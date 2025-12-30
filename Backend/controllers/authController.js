import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userId = user._id.toString();


    // Check current active sessions
    // Filter out expired sessions first (optional cleanup)
    // user.activeSessions = user.activeSessions.filter(session => {
    //   // Add logic here if we wanted to auto-remove expired tokens, but we rely on JWT expiry
    //   return true; 
    // });

    // Clean up expired sessions first
    const now = new Date();
    user.activeSessions = user.activeSessions.filter(session => {
      try {
        // Check if access token is expired
        const decoded = jwt.decode(session.accessToken);
        if (!decoded || decoded.exp * 1000 < now.getTime()) {
          return false; // Remove expired session
        }
        return true;
      } catch (err) {
        return false; // Remove invalid sessions
      }
    });

    // Determine max concurrent logins from environment variables
    // Default: Admin = 7 (multiple logins allowed), Cashier = 1 (single login only)
    // Cashier users can only login from one device at a time
    // Admin users can have multiple concurrent logins (configurable via .env)
    const adminMaxLogins = parseInt(process.env.ADMIN_MAX_CONCURRENT_LOGINS || '7', 10);
    const cashierMaxLogins = parseInt(process.env.CUSTOMER_MAX_CONCURRENT_LOGINS || '1', 10);
    const maxLogins = user.role === 'Admin' ? adminMaxLogins : cashierMaxLogins;

    // Check if user has reached maximum concurrent login limit
    // This check is per-user, so different users can login simultaneously
    // User1 can login on device A, User2 can login on device B, etc.
    // But each user is limited to their max concurrent sessions
    if (user.activeSessions.length >= maxLogins) {
      return res.status(403).json({
        message: `Limited access for login: Maximum of ${maxLogins} device(s) allowed for ${user.role} users. Please logout from other devices to continue.`,
        maxLogins: maxLogins,
        currentSessions: user.activeSessions.length,
        role: user.role
      });
    }

    const accessToken = jwt.sign(
      { id: userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: userId, role: user.role },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Add new session to database
    user.activeSessions.push({
      accessToken,
      refreshToken,
      lastActive: new Date()
    });

    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const token = req.headers['authorization']?.split(' ')[1];

    if (token && userId) {
      // Remove session from database
      const user = await User.findById(userId);
      if (user) {
        user.activeSessions = user.activeSessions.filter(
          session => session.accessToken !== token
        );
        await user.save();
      }
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Refresh token expired. Please login again.' });
      }
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Check if user exists and has this refresh token in active sessions
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    // Find the session with this refresh token
    const sessionIndex = user.activeSessions.findIndex(s => s.refreshToken === token);

    if (sessionIndex === -1) {
      // Token reuse detection or valid token but session kicked/expired
      return res.status(403).json({ message: 'Invalid refresh token (session expired or logged out)' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Update the session with new tokens (Token Rotation)
    user.activeSessions[sessionIndex].accessToken = newAccessToken;
    user.activeSessions[sessionIndex].refreshToken = newRefreshToken;
    user.activeSessions[sessionIndex].lastActive = new Date();

    await user.save();

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const register = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create admin user (public if no admin exists, protected if admins exist)
export const createAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });

    // If admin exists, require authentication and admin role
    if (existingAdmin) {
      // Check if user is authenticated (req.user should be set by middleware if auth passed)
      if (!req.user) {
        return res.status(401).json({ message: 'Access token required. An admin already exists.' });
      }

      // Check if user is an admin
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Admin access required to create additional admins.' });
      }
    }

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create admin user
    const adminUser = new User({
      username,
      password,
      role: 'Admin'
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        username: adminUser.username,
        role: adminUser.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Setup initial admin (only works if no admin exists - for initial setup)
export const setupAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      return res.status(403).json({
        message: 'Admin user already exists. Use /api/auth/admin/create endpoint to create additional admins.'
      });
    }

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create initial admin user
    const adminUser = new User({
      username,
      password,
      role: 'Admin'
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Initial admin user created successfully',
      user: {
        id: adminUser._id,
        username: adminUser.username,
        role: adminUser.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

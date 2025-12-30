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

    // Determine max concurrent logins
    const adminMaxLogins = parseInt(process.env.ADMIN_MAX_CONCURRENT_LOGINS || '1', 10);
    const customerMaxLogins = parseInt(process.env.CUSTOMER_MAX_CONCURRENT_LOGINS || '5', 10);
    const maxLogins = user.role === 'Admin' ? adminMaxLogins : customerMaxLogins;

    // Check current active sessions
    // Filter out expired sessions first (optional cleanup)
    // user.activeSessions = user.activeSessions.filter(session => {
    //   // Add logic here if we wanted to auto-remove expired tokens, but we rely on JWT expiry
    //   return true; 
    // });

    if (user.activeSessions.length >= maxLogins) {
      return res.status(403).json({
        message: `Limited access for login: Maximum of ${maxLogins} device(s) allowed. Please logout from other devices.`
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
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
      // Remove session from database
      await User.findByIdAndUpdate(userId, {
        $pull: { activeSessions: { accessToken: token } }
      });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

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
    if (error.name === 'TokenExpiredError') {
      // Optionally remove the expired session from DB here if we had the user ID
      return res.status(403).json({ message: 'Refresh token expired' });
    }
    res.status(403).json({ message: 'Invalid refresh token' });
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

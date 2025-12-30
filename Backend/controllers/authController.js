import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import sessionManager from '../utils/sessionManager.js';

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userId = user._id.toString();

    // Set max concurrent logins based on role
    const adminMaxLogins = parseInt(process.env.ADMIN_MAX_CONCURRENT_LOGINS || '1', 10);
    const customerMaxLogins = parseInt(process.env.CUSTOMER_MAX_CONCURRENT_LOGINS || '5', 10);
    const maxLogins = user.role === 'Admin' ? adminMaxLogins : customerMaxLogins;
    sessionManager.setUserMaxLogins(userId, maxLogins);

    const accessToken = jwt.sign(
      { id: userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // 24-hour access token for better UX
    );

    const refreshToken = jwt.sign(
      { id: userId, role: user.role },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' } // Long-lived refresh token
    );

    // Add session to session manager (will return false if limit reached)
    const sessionAdded = sessionManager.addSession(userId, accessToken);
    if (!sessionAdded) {
      const activeCount = sessionManager.getActiveSessionCount(userId);
      return res.status(403).json({
        message: `Login limit reached. Only ${maxLogins} concurrent login${maxLogins > 1 ? 's' : ''} allowed. Currently ${activeCount} active session${activeCount > 1 ? 's' : ''}.`
      });
    }

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
      sessionManager.removeSession(userId, token);
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

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Optionally generate new refresh token
    const newRefreshToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
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

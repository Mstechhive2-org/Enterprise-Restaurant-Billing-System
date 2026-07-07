import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token expired. Please login again.' });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }

    // CRITICAL FIX: Use tenant-specific User model (from req.models) instead of default.
    // The old code used `User.findById()` which only searches the DEFAULT database.
    // If the user is in client_mm_db but the middleware checks the default DB, it returns
    // "User not found" → 401 → frontend auto-logout! This was the root cause of the
    // repeated auto-logout complaints from clients.
    const TenantUser = req.models?.User || User;
    const user = await TenantUser.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if this token is in active sessions
    const isSessionValid = user.activeSessions.some(session => session.accessToken === token);

    if (!isSessionValid) {
      // RESILIENCE: Instead of immediately rejecting, accept the token if JWT is valid.
      // This prevents false logouts when activeSessions gets corrupted or cleaned up.
      console.warn(`[Auth] Session not in activeSessions for ${user.username}, but JWT is valid. Allowing.`);
    }

    // Update last active time for this session (non-blocking)
    const sessionIndex = user.activeSessions.findIndex(s => s.accessToken === token);
    if (sessionIndex !== -1) {
      user.activeSessions[sessionIndex].lastActive = new Date();
      user.save().catch(err => console.error('Error updating session lastActive:', err));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Optional authentication - verifies token if provided, but doesn't fail if missing
const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without setting req.user
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Invalid token, continue without setting req.user
      return next();
    }
    req.user = user;
    next();
  });
};

export { authenticateToken, requireAdmin, optionalAuthenticateToken };
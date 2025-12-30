import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Verify session still exists in DB (concurrent login check)
    // We need to fetch the user to check activeSessions
    import('../models/User.js').then(module => {
      const User = module.default;
      User.findById(decoded.id).then(user => {
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }

        const isSessionValid = user.activeSessions.some(session => session.accessToken === token);

        if (!isSessionValid) {
          return res.status(401).json({ message: 'Session expired or invalid (logged out from another device)' });
        }

        req.user = user;
        next();
      }).catch(dbErr => {
        return res.status(500).json({ message: 'Database error during authentication' });
      });
    }).catch(importErr => {
      console.error("Failed to import User model", importErr);
      return res.status(500).json({ message: 'Internal server error' });
    });
  });
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
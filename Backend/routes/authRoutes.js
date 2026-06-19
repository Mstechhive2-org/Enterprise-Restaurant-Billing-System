import express from 'express';
const router = express.Router();
import { login, logout, logoutAll, refreshToken, createAdmin, setupAdmin, updateProfile } from '../controllers/authController.js';
import sessionManager from '../utils/sessionManager.js';
import { authenticateToken, requireAdmin, optionalAuthenticateToken } from '../middleware/auth.js';

// Public routes
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/clear-sessions', (req, res) => {
  sessionManager.clearAllSessions();
  res.json({ message: 'All sessions cleared' });
});

// Protected routes
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAll);
router.put('/profile', authenticateToken, updateProfile);

// Admin routes (public if no admin exists, protected if admins exist)
// Uses optional auth middleware so token is verified if provided, but not required
router.post('/admin/create', optionalAuthenticateToken, createAdmin);

// Setup route (public, but only works if no admin exists)
router.post('/admin/setup', setupAdmin);

export default router;

import express from 'express';
import { setupDatabase, resetLicense } from '../controllers/configController.js';

const router = express.length ? express.Router() : express.Router();

// Allow frontend to configure database on first boot without auth
router.post('/setup', setupDatabase);

// Allow frontend to reset license to switch accounts
router.post('/reset', resetLicense);

export default router;

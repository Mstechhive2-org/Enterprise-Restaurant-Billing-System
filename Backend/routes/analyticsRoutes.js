import express from 'express';
const router = express.Router();
import { getAnalytics, downloadDailyReportCSV, downloadMonthlyReportExcel } from '../controllers/analyticsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

// GET analytics - Admin users only
router.get('/', authenticateToken, requireAdmin, getAnalytics);

// Download reports - Admin users only
router.get('/download/daily/csv', authenticateToken, requireAdmin, downloadDailyReportCSV);
router.get('/download/monthly/excel', authenticateToken, requireAdmin, downloadMonthlyReportExcel);

export default router;


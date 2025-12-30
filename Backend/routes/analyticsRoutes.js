import express from 'express';
const router = express.Router();
import { getAnalytics, downloadDailyReportCSV, downloadMonthlyReportExcel } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

// GET analytics - authenticated users only
router.get('/', authenticateToken, getAnalytics);

// Download reports - authenticated users only
router.get('/download/daily/csv', authenticateToken, downloadDailyReportCSV);
router.get('/download/monthly/excel', authenticateToken, downloadMonthlyReportExcel);

export default router;


import express from 'express';
const router = express.Router();
import { getAnalytics, getDayBook, exportDayBookExcel, downloadDailyReportCSV, downloadMonthlyReportExcel } from '../controllers/analyticsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

// GET analytics - Admin users only
router.get('/', authenticateToken, requireAdmin, getAnalytics);

// GET DayBook - Admin users only
router.get('/daybook', authenticateToken, requireAdmin, getDayBook);

// Export DayBook - Admin users only
router.get('/daybook/export', authenticateToken, requireAdmin, exportDayBookExcel);

// Download reports - Admin users only
router.get('/download/daily/csv', authenticateToken, requireAdmin, downloadDailyReportCSV);
router.get('/download/monthly/excel', authenticateToken, requireAdmin, downloadMonthlyReportExcel);


export default router;

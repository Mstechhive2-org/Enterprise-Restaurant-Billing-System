import express from 'express';
import { addExpense, getExpenses, deleteExpense } from '../controllers/expenseController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Expenses are highly sensitive financial data, strict Admin access required
router.post('/', authenticateToken, requireAdmin, addExpense);
router.get('/', authenticateToken, requireAdmin, getExpenses);
router.delete('/:id', authenticateToken, requireAdmin, deleteExpense);

export default router;

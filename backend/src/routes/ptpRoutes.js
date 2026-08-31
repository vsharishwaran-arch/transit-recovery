import express from 'express';
import {
  createPTP,
  markPTPPaid,
  getActivePTPs,
  getPTPHistory,
  getPTPStats,
} from '../controllers/ptpController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Conductor actions
router.post('/create', createPTP);
router.patch('/mark-paid', markPTPPaid);

// Admin dashboard routes
router.get('/active', requireAdmin, getActivePTPs);
router.get('/history', requireAdmin, getPTPHistory);
router.get('/stats', requireAdmin, getPTPStats);

export default router;

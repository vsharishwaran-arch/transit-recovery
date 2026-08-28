import express from 'express';
import {
  getFailedSessions,
  getStats,
  getEscalated,
  getBatchHistory,
  getBatchDetail,
  markAsRecovered,
} from '../controllers/recoveryController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/sessions', getFailedSessions);
router.get('/stats', getStats);
router.get('/escalated', getEscalated);
router.get('/batches', getBatchHistory);
router.get('/batches/:batchRunId', getBatchDetail);
router.patch('/mark-recovered', markAsRecovered);

export default router;

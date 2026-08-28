import express from 'express';
import {
  createTicketSession,
  getSessionStatus,
  getMyTickets,
  cancelTicketSession,
} from '../controllers/conductorController.js';
import { authenticate, requireConductor } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate, requireConductor);

router.post('/ticket', createTicketSession);
router.get('/ticket/:sessionId/status', getSessionStatus);
router.patch('/ticket/:sessionId/cancel', cancelTicketSession);
router.get('/tickets', getMyTickets);

export default router;

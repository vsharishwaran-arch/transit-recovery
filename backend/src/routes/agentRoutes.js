import express from 'express';
import { runAgent } from '../controllers/agentController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.post('/run', runAgent);

export default router;

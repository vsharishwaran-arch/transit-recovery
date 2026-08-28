import { runRecoveryAgent } from '../agents/recoveryAgent.js';

export const runAgent = async (req, res, next) => {
  try {
    const { batchSize = 20, language = 'hinglish', routeFilter = 'all' } = req.body;
    const safeBatchSize = Math.min(Number(batchSize) || 20, 50);

    const batchRun = await runRecoveryAgent({
      conductorId: req.user.userId,
      routeFilter,
      batchSize: safeBatchSize,
      language,
    });

    res.json({ success: true, batchRun });
  } catch (err) {
    next(err);
  }
};

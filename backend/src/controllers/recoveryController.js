import TicketSession from '../models/TicketSession.js';
import RecoveryLog from '../models/RecoveryLog.js';
import BatchRun from '../models/BatchRun.js';

export const getFailedSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { upiStatus: { $ne: 'paid' } };

    const sessions = await TicketSession.find(query)
      .populate('routeId')
      .populate('conductorId', 'name employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Attach latest recovery log per session
    const enriched = await Promise.all(
      sessions.map(async (session) => {
        const latestLog = await RecoveryLog.findOne({ sessionId: session.sessionId })
          .sort({ attemptedAt: -1 });
        return { ...session.toObject(), latestLog };
      })
    );

    const total = await TicketSession.countDocuments(query);

    res.json({ success: true, sessions: enriched, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    // Revenue at risk
    const failedSessions = await TicketSession.find({
      upiStatus: { $ne: 'paid' },
    });
    const amountAtRisk = failedSessions.reduce((sum, s) => sum + s.amount, 0);

    // Recovery logs aggregation
    const allLogs = await RecoveryLog.find({ status: { $ne: 'skipped' } });
    const recoveredLogs = allLogs.filter((l) => l.status === 'recovered');
    const amountRecovered = recoveredLogs.reduce((sum, l) => sum + l.amount, 0);
    const recoveryRate =
      allLogs.length > 0 ? Math.round((recoveredLogs.length / allLogs.length) * 100) : 0;

    // Failure breakdown
    const failureBreakdown = await TicketSession.aggregate([
      { $match: { upiStatus: { $ne: 'paid' } } },
      { $group: { _id: '$providerStatus', count: { $sum: 1 } } },
    ]);

    // Recovery log failure reasons breakdown
    const reasonBreakdown = await RecoveryLog.aggregate([
      { $match: { status: { $ne: 'skipped' } } },
      { $group: { _id: '$failureReason', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      stats: {
        amountAtRisk,
        failedSessionCount: failedSessions.length,
        recoveryAttempted: allLogs.length,
        recoveredCount: recoveredLogs.length,
        amountRecovered,
        recoveryRate,
        failureBreakdown,
        reasonBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getEscalated = async (req, res, next) => {
  try {
    const escalated = await RecoveryLog.find({ status: 'escalated' })
      .populate('routeId')
      .sort({ escalatedAt: -1 });
    res.json({ success: true, escalated });
  } catch (err) {
    next(err);
  }
};

export const getBatchHistory = async (req, res, next) => {
  try {
    const batches = await BatchRun.find().sort({ startedAt: -1 }).limit(10);
    res.json({ success: true, batches });
  } catch (err) {
    next(err);
  }
};

export const getBatchDetail = async (req, res, next) => {
  try {
    const { batchRunId } = req.params;
    const batch = await BatchRun.findOne({ batchRunId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    const logs = await RecoveryLog.find({ batchRunId }).populate('routeId').sort({ attemptedAt: 1 });
    res.json({ success: true, batch, logs });
  } catch (err) {
    next(err);
  }
};

export const markAsRecovered = async (req, res, next) => {
  try {
    const { recoveryLogId } = req.body;
    const log = await RecoveryLog.findById(recoveryLogId);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Recovery log not found' });
    }
    log.status = 'recovered';
    log.recoveredAt = new Date();
    await log.save();
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

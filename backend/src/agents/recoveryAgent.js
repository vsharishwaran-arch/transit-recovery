import RecoveryLog from '../models/RecoveryLog.js';
import TicketSession from '../models/TicketSession.js';
import BatchRun from '../models/BatchRun.js';
import Route from '../models/Route.js';
import { classifyBusFailure, generateRecoveryMessage } from '../utils/llmClient.js';

/**
 * Rule 1–5 compliance check before attempting recovery.
 */
const checkStoppingRules = async (sessionId, session) => {
  // Rule 1: Already recovered
  const alreadyRecovered = await RecoveryLog.findOne({ sessionId, status: 'recovered' });
  if (alreadyRecovered) return { allowed: false, reason: 'already_recovered' };

  // Rule 2: Max 3 attempts
  const attemptCount = await RecoveryLog.countDocuments({
    sessionId,
    status: { $ne: 'skipped' },
  });
  if (attemptCount >= 3) return { allowed: false, reason: 'max_attempts' };

  // Rule 3: Below ₹50 threshold
  if (session.amount < 50) return { allowed: false, reason: 'below_threshold' };

  // Rule 4: Older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (new Date(session.createdAt) < thirtyDaysAgo) return { allowed: false, reason: 'too_old' };

  // Rule 5: Already escalated
  const escalated = await RecoveryLog.findOne({ sessionId, status: 'escalated' });
  if (escalated) return { allowed: false, reason: 'escalated' };

  return { allowed: true, reason: null };
};

/**
 * Check if session qualifies for escalation (2+ failed/sent attempts).
 */
const checkEscalation = async (sessionId) => {
  const count = await RecoveryLog.countDocuments({
    sessionId,
    status: { $in: ['sent', 'failed'] },
  });
  return count >= 2;
};

/**
 * Demo simulation of recovery outcome.
 * Replace with real Razorpay payment webhook in production.
 */
const simulateRecoveryOutcome = (amount, failureReason) => {
  // Demo simulation — replace with real webhook in production
  const rates = {
    network_handoff: 0.55,  // easy to retry when stable
    peak_load: 0.45,
    insufficient_funds: 0.20, // harder
    user_cancelled: 0.35,
    timeout: 0.50,
    webhook_dropout: 0.85, // payment captured, high recovery
    unknown: 0.30,
  };

  let rate = rates[failureReason] ?? 0.30;

  // Adjust by amount
  if (amount < 100) rate += 0.10;
  if (amount > 1000) rate -= 0.10;

  return Math.random() < rate;
};

/**
 * Main autonomous recovery agent loop.
 */
export const runRecoveryAgent = async ({
  conductorId,
  routeFilter = 'all',
  batchSize = 20,
  language = 'hinglish',
}) => {
  const batchRunId = 'batch_' + Date.now();

  // Step 1: Create BatchRun
  const batchRun = await BatchRun.create({
    batchRunId,
    triggeredBy: 'manual',
    language,
    routeFilter,
    status: 'running',
  });

  try {
    // Step 2: Query failed TicketSessions (all unpaid sessions)
    const query = { upiStatus: { $ne: 'paid' } };

    if (routeFilter !== 'all') {
      // routeFilter is a routeNumber string — find the route
      const route = await Route.findOne({ routeNumber: routeFilter });
      if (route) query.routeId = route._id;
    }

    const sessions = await TicketSession.find(query)
      .populate('routeId')
      .sort({ createdAt: -1 })
      .limit(Math.min(batchSize, 50));

    // Step 3: Set batch metrics
    batchRun.sessionsScanned = sessions.length;
    batchRun.amountAtRisk = sessions.reduce((sum, s) => sum + s.amount, 0);
    await batchRun.save();

    // Step 4: Process each session sequentially
    for (const session of sessions) {
      const sessionId = session.sessionId;

      // Step 4a: Check stopping rules
      const { allowed, reason } = await checkStoppingRules(sessionId, session);
      if (!allowed) {
        await RecoveryLog.create({
          sessionId,
          routeId: session.routeId?._id,
          busNumber: session.busNumber,
          amount: session.amount,
          aiMessage: `Skipped: ${reason}`,
          status: 'skipped',
          skipReason: reason,
          batchRunId,
        });
        batchRun.sessionsSkipped += 1;
        batchRun.skipReasons = {
          ...batchRun.skipReasons,
          [reason]: (batchRun.skipReasons[reason] || 0) + 1,
        };
        batchRun.markModified('skipReasons');
        await batchRun.save();
        continue;
      }

      // Step 4b: Check escalation
      const shouldEscalate = await checkEscalation(sessionId);
      if (shouldEscalate) {
        const latestLog = await RecoveryLog.findOne({ sessionId }).sort({ attemptedAt: -1 });
        if (latestLog) {
          latestLog.status = 'escalated';
          latestLog.escalatedAt = new Date();
          await latestLog.save();
        }
        batchRun.sessionsEscalated += 1;
        await batchRun.save();
        continue;
      }

      // Step 4c: Classify failure
      const { failureReason, suggestedAction, contextNote } = classifyBusFailure(session);

      // Step 4d: Generate recovery message
      let aiMessage = '';
      try {
        const routeFrom = session.routeId?.from || 'Unknown';
        const routeTo = session.routeId?.to || 'Unknown';
        aiMessage = await generateRecoveryMessage({
          amount: session.amount,
          busNumber: session.busNumber,
          routeFrom,
          routeTo,
          failureReason,
          suggestedAction,
          language,
        });
      } catch (err) {
        console.error(`LLM error for session ${sessionId}:`, err.message);
        await RecoveryLog.create({
          sessionId,
          routeId: session.routeId?._id,
          busNumber: session.busNumber,
          amount: session.amount,
          failureReason,
          suggestedAction,
          aiMessage: `Message generation failed: ${err.message}`,
          status: 'failed',
          batchRunId,
          vehicleContext: {
            speed: session.vehicleSpeed,
            networkStrength: session.networkStrength,
            passengerLoad: session.passengerLoad,
          },
        });
        batchRun.sessionsAttempted += 1;
        await batchRun.save();
        continue;
      }

      // Step 4e: Attempt number
      const existingAttempts = await RecoveryLog.countDocuments({ sessionId });
      const attemptNumber = existingAttempts + 1;

      // Step 4f: Create RecoveryLog as 'sent'
      const recoveryLog = await RecoveryLog.create({
        sessionId,
        routeId: session.routeId?._id,
        busNumber: session.busNumber,
        amount: session.amount,
        failureReason,
        suggestedAction,
        aiMessage,
        messageLanguage: language,
        vehicleContext: {
          speed: session.vehicleSpeed,
          networkStrength: session.networkStrength,
          passengerLoad: session.passengerLoad,
        },
        status: 'sent',
        attemptNumber,
        batchRunId,
      });

      // Step 4g: Simulate recovery outcome
      const recovered = simulateRecoveryOutcome(session.amount, failureReason);
      if (recovered) {
        recoveryLog.status = 'recovered';
        recoveryLog.recoveredAt = new Date();
        await recoveryLog.save();
        batchRun.sessionsRecovered += 1;
        batchRun.amountRecovered += session.amount;
      }

      // Step 4h: Count attempt
      batchRun.sessionsAttempted += 1;
      await batchRun.save();

      // Step 4i: 600ms delay between sessions
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // Step 5: Mark batch complete
    batchRun.status = 'completed';
    batchRun.completedAt = new Date();
    await batchRun.save();
  } catch (err) {
    // Step 6: Handle unexpected errors
    batchRun.status = 'failed';
    batchRun.errorMessage = err.message;
    await batchRun.save();
    console.error('Recovery agent failed:', err);
  }

  return batchRun;
};

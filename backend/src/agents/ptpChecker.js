import PromiseToPay from '../models/PromiseToPay.js';
import RecoveryLog from '../models/RecoveryLog.js';
import TicketSession from '../models/TicketSession.js';

/**
 * Checks for expired Promise-to-Pay documents and auto-escalates them.
 */
export const checkExpiredPromises = async () => {
  try {
    const now = new Date();
    const expiredPTPs = await PromiseToPay.find({
      status: 'active',
      expiresAt: { $lte: now },
    });

    if (!expiredPTPs || expiredPTPs.length === 0) {
      return { expired: 0, escalated: 0 };
    }

    let escalatedCount = 0;

    for (const ptp of expiredPTPs) {
      // Step a: Update to expired
      ptp.status = 'expired';
      ptp.escalatedAt = now;
      await ptp.save();

      // Get session for passenger phone or additional info
      const session = await TicketSession.findOne({ sessionId: ptp.sessionId });

      // Step b: Create RecoveryLog entry for escalated queue
      await RecoveryLog.create({
        sessionId: ptp.sessionId,
        failureReason: 'user_cancelled',
        aiMessage: `Promise to pay expired — passenger did not pay within ${ptp.promisedMinutes} minutes`,
        status: 'escalated',
        suggestedAction: 'retry_upi',
        batchRunId: 'ptp_expiry_' + Date.now(),
        amount: ptp.amount,
        passengerPhone: session?.passengerPhone || '+91 98401 23456',
        attemptedAt: now,
      });

      // Step c: Update PTP status to escalated
      ptp.status = 'escalated';
      await ptp.save();

      escalatedCount++;
    }

    console.log(`⏰ PTP Checker: ${expiredPTPs.length} promises expired → escalated`);
    return { expired: expiredPTPs.length, escalated: escalatedCount };
  } catch (err) {
    console.error('❌ Error in checkExpiredPromises:', err);
    return { expired: 0, escalated: 0, error: err.message };
  }
};

/**
 * Starts the recurring PTP checker timer (every 60 seconds).
 */
export const startPTPChecker = () => {
  // Run once on startup
  checkExpiredPromises();

  // Run every 60 seconds
  const INTERVAL_MS = 60 * 1000;
  setInterval(() => {
    checkExpiredPromises();
  }, INTERVAL_MS);
};

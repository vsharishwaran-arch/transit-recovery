import PromiseToPay from '../models/PromiseToPay.js';
import TicketSession from '../models/TicketSession.js';
import RecoveryLog from '../models/RecoveryLog.js';

/**
 * Conductor creates a new Promise to Pay record for a failed ticket session.
 */
export const createPTP = async (req, res, next) => {
  try {
    const {
      sessionId,
      busNumber,
      routeId,
      amount,
      passengerCount,
      promisedMinutes,
      notes,
    } = req.body;

    // 1. Verify TicketSession exists
    const session = await TicketSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Ticket session not found' });
    }

    // 2. Check if active PTP already exists for this session
    const existingActive = await PromiseToPay.findOne({ sessionId, status: 'active' });
    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: 'Promise already recorded for this session',
      });
    }

    // 3. Calculate expiresAt
    const promisedAt = new Date();
    const expiresAt = new Date(promisedAt.getTime() + Number(promisedMinutes) * 60000);

    // 4. Create PromiseToPay document
    const ptp = await PromiseToPay.create({
      sessionId,
      conductorId: req.user?._id || session.conductorId,
      busNumber: busNumber || session.busNumber,
      routeId: routeId || session.routeId,
      amount: Number(amount || session.amount),
      passengerCount: Number(passengerCount || session.passengerCount),
      promisedMinutes: Number(promisedMinutes),
      promisedAt,
      expiresAt,
      status: 'active',
      notes: notes || null,
    });

    // 5. Update TicketSession upiStatus
    session.upiStatus = 'ptp_active';
    await session.save();

    res.status(201).json({
      success: true,
      ptp,
      message: `Promise recorded — expires in ${promisedMinutes} minutes`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Conductor/Admin marks an active PTP as paid.
 */
export const markPTPPaid = async (req, res, next) => {
  try {
    const { ptpId } = req.body;

    const ptp = await PromiseToPay.findById(ptpId);
    if (!ptp) {
      return res.status(404).json({ success: false, message: 'Promise to Pay record not found' });
    }

    if (ptp.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark PTP as paid. Current status: ${ptp.status}`,
      });
    }

    const now = new Date();
    ptp.status = 'paid';
    ptp.paidAt = now;
    await ptp.save();

    // Update TicketSession upiStatus to paid
    const session = await TicketSession.findOne({ sessionId: ptp.sessionId });
    if (session) {
      session.upiStatus = 'paid';
      await session.save();
    }

    // Create RecoveryLog entry
    await RecoveryLog.create({
      sessionId: ptp.sessionId,
      failureReason: 'user_cancelled',
      aiMessage: 'Passenger paid after promise — PTP resolved',
      status: 'recovered',
      suggestedAction: 'none',
      batchRunId: 'ptp_manual_' + Date.now(),
      amount: ptp.amount,
      passengerPhone: session?.passengerPhone || '+91 98401 23456',
      attemptedAt: now,
    });

    res.json({
      success: true,
      ptp,
      message: 'Promise resolved — payment marked as received',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all active Promise-to-Pay records (sorted by most urgent first).
 */
export const getActivePTPs = async (req, res, next) => {
  try {
    const now = new Date();
    const rawPtps = await PromiseToPay.find({ status: 'active' })
      .populate('routeId')
      .populate('conductorId', 'name employeeId')
      .sort({ expiresAt: 1 });

    const ptps = rawPtps.map((ptp) => {
      const p = ptp.toObject();
      p.minutesRemaining = Math.max(
        0,
        Math.floor((new Date(ptp.expiresAt).getTime() - now.getTime()) / 60000)
      );
      return p;
    });

    res.json({
      success: true,
      ptps,
      total: ptps.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get full PTP history (limit 50).
 */
export const getPTPHistory = async (req, res, next) => {
  try {
    const ptps = await PromiseToPay.find()
      .populate('routeId')
      .populate('conductorId', 'name employeeId')
      .sort({ promisedAt: -1 })
      .limit(50);

    const totalPTPs = await PromiseToPay.countDocuments();
    const totalPaid = await PromiseToPay.countDocuments({ status: 'paid' });
    const totalExpired = await PromiseToPay.countDocuments({ status: 'expired' });
    const totalEscalated = await PromiseToPay.countDocuments({ status: 'escalated' });

    const ptpSuccessRate =
      totalPTPs > 0 ? ((totalPaid / totalPTPs) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      ptps,
      total: totalPTPs,
      stats: {
        totalPTPs,
        totalPaid,
        totalExpired,
        totalEscalated,
        ptpSuccessRate: Number(ptpSuccessRate),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get aggregated PTP statistics for dashboard widgets.
 */
export const getPTPStats = async (req, res, next) => {
  try {
    const activePTPsList = await PromiseToPay.find({ status: 'active' });
    const activePTPs = activePTPsList.length;
    const amountPending = activePTPsList.reduce((sum, p) => sum + p.amount, 0);

    const totalResolved = await PromiseToPay.countDocuments({ status: 'paid' });
    const totalExpiredCount = await PromiseToPay.countDocuments({ status: 'expired' });
    const totalEscalatedCount = await PromiseToPay.countDocuments({ status: 'escalated' });
    const totalExpired = totalExpiredCount + totalEscalatedCount;

    const denominator = totalResolved + totalExpired;
    const successRate =
      denominator > 0 ? Math.round((totalResolved / denominator) * 100) : 0;

    res.json({
      success: true,
      stats: {
        activePTPs,
        amountPending,
        totalResolved,
        totalExpired,
        successRate,
      },
    });
  } catch (err) {
    next(err);
  }
};

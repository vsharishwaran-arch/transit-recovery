import Razorpay from 'razorpay';
import Route from '../models/Route.js';
import TicketSession from '../models/TicketSession.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

export const createTicketSession = async (req, res, next) => {
  try {
    const { routeId, busNumber, passengerCount, paymentMethod, vehicleSpeed, networkStrength, passengerLoad } = req.body;

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const amount = route.fare * (passengerCount || 1);

    if (paymentMethod === 'upi') {
      let paymentLinkData = null;
      let sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      try {
        // Create Razorpay payment link
        paymentLinkData = await razorpay.paymentLink.create({
          amount: amount * 100, // paise
          currency: 'INR',
          description: `Bus ticket: ${route.from} → ${route.to} | ${passengerCount} passenger(s)`,
          notify: { sms: false, email: false },
          reminder_enable: false,
          notes: {
            routeNumber: route.routeNumber,
            busNumber,
            passengerCount: String(passengerCount),
          },
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/retry`,
          callback_method: 'get',
        });
        sessionId = paymentLinkData.id;
      } catch (razorpayErr) {
        console.warn('Razorpay payment link failed (demo fallback):', razorpayErr.message);
        // Demo fallback — continue with generated sessionId
      }

      const session = await TicketSession.create({
        sessionId,
        routeId,
        conductorId: req.user.userId,
        busNumber,
        passengerCount,
        amount,
        paymentMethod: 'upi',
        upiStatus: 'pending',
        vehicleSpeed: vehicleSpeed || 0,
        networkStrength: networkStrength || 'strong',
        passengerLoad: passengerLoad || 'medium',
      });

      return res.status(201).json({
        success: true,
        session,
        paymentLink: paymentLinkData?.short_url || `https://rzp.io/demo/${sessionId}`,
        qrCode: paymentLinkData?.short_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=tnstc@upi%26am=${amount}`,
      });
    }

    // Cash payment
    const session = await TicketSession.create({
      sessionId: `cash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      routeId,
      conductorId: req.user.userId,
      busNumber,
      passengerCount,
      amount,
      paymentMethod: 'cash',
      upiStatus: 'paid',
      vehicleSpeed: vehicleSpeed || 0,
      networkStrength: networkStrength || 'strong',
      passengerLoad: passengerLoad || 'medium',
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

export const getSessionStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await TicketSession.findOne({ sessionId }).populate('routeId');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Poll Razorpay for status update if it's a UPI session
    if (session.paymentMethod === 'upi' && session.upiStatus === 'pending') {
      try {
        const rzpLink = await razorpay.paymentLink.fetch(sessionId);
        const statusMap = {
          created: 'pending',
          partially_paid: 'pending',
          paid: 'paid',
          cancelled: 'cancelled',
          expired: 'expired',
        };
        const newStatus = statusMap[rzpLink.status] || session.upiStatus;
        if (newStatus !== session.upiStatus) {
          session.upiStatus = newStatus;
          await session.save();
        }
      } catch {
        // Razorpay poll failed — return current DB status
      }
    }

    res.json({ success: true, status: session.upiStatus, session });
  } catch (err) {
    next(err);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await TicketSession.find({ conductorId: req.user.userId })
      .populate('routeId')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, tickets });
  } catch (err) {
    next(err);
  }
};

import mongoose from 'mongoose';

const TicketSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    conductorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    busNumber: { type: String, required: true },
    passengerCount: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['upi', 'cash'], default: 'upi' },
    upiStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'expired', 'cancelled', 'payment_success_ticket_failed', 'ptp_active'],
      default: 'pending',
    },
    vehicleSpeed: { type: Number, default: 0 },
    networkStrength: { type: String, enum: ['strong', 'weak', 'none'], default: 'strong' },
    passengerLoad: {
      type: String,
      enum: ['low', 'medium', 'high', 'overcrowded'],
      default: 'medium',
    },
    providerStatus: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('TicketSession', TicketSessionSchema);

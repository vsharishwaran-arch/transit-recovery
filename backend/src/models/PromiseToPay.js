import mongoose from 'mongoose';

const promiseToPaySchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    conductorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    busNumber: {
      type: String,
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
    },
    amount: {
      type: Number,
      required: true,
    },
    passengerCount: {
      type: Number,
      required: true,
    },
    promisedMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
    },
    promisedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paid', 'expired', 'escalated'],
      default: 'active',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

promiseToPaySchema.index({ status: 1, expiresAt: 1 });

const PromiseToPay = mongoose.model('PromiseToPay', promiseToPaySchema);

export default PromiseToPay;

import mongoose from 'mongoose';

const RecoveryLogSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    busNumber: { type: String },
    amount: { type: Number, required: true },
    failureReason: {
      type: String,
      enum: ['network_handoff', 'peak_load', 'insufficient_funds', 'timeout', 'user_cancelled', 'webhook_dropout', 'unknown'],
      default: 'unknown',
    },
    vehicleContext: {
      speed: { type: Number },
      networkStrength: { type: String },
      passengerLoad: { type: String },
    },
    aiMessage: { type: String, required: true },
    messageLanguage: {
      type: String,
      enum: ['english', 'hinglish', 'tamil'],
      default: 'hinglish',
    },
    suggestedAction: {
      type: String,
      enum: ['retry_upi', 'pay_cash', 'retry_at_stop', 'generate_ticket'],
      default: 'retry_upi',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'recovered', 'failed', 'escalated', 'skipped'],
      default: 'pending',
    },
    skipReason: { type: String, default: null },
    attemptNumber: { type: Number, default: 1 },
    batchRunId: { type: String, index: true },
    attemptedAt: { type: Date, default: Date.now },
    recoveredAt: { type: Date, default: null },
    escalatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RecoveryLogSchema.index({ sessionId: 1, attemptNumber: 1 });

export default mongoose.model('RecoveryLog', RecoveryLogSchema);

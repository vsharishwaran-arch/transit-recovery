import mongoose from 'mongoose';

const BatchRunSchema = new mongoose.Schema(
  {
    batchRunId: { type: String, unique: true, required: true },
    triggeredBy: { type: String, enum: ['manual', 'scheduled'], default: 'manual' },
    language: { type: String, enum: ['english', 'hinglish', 'tamil'], default: 'hinglish' },
    routeFilter: { type: String, default: 'all' },
    status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
    sessionsScanned: { type: Number, default: 0 },
    sessionsAttempted: { type: Number, default: 0 },
    sessionsSkipped: { type: Number, default: 0 },
    sessionsEscalated: { type: Number, default: 0 },
    sessionsRecovered: { type: Number, default: 0 },
    amountAtRisk: { type: Number, default: 0 },
    amountRecovered: { type: Number, default: 0 },
    skipReasons: { type: Object, default: {} },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('BatchRun', BatchRunSchema);

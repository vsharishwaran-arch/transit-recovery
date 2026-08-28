import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    role: { type: String, enum: ['conductor', 'admin'], default: 'conductor' },
    assignedRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    assignedBus: { type: String },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);

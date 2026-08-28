import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema(
  {
    routeNumber: { type: String, required: true, unique: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    fare: { type: Number, required: true },
    avgDailyPassengers: { type: Number, default: 800 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Route', RouteSchema);

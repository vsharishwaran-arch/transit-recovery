import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();
process.env.MONGOMS_MD5_CHECK = 'false';

let mongoMemoryServerInstance = null;

const connectDB = async () => {
  // Tier 1: MongoDB Atlas
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB Atlas connected');
      return;
    } catch (err) {
      console.warn('⚠️  MongoDB Atlas failed:', err.message);
    }
  }

  // Tier 2: Local MongoDB
  try {
    await mongoose.connect('mongodb://localhost:27017/transit-recovery');
    console.log('✅ Local MongoDB connected (fallback)');
    return;
  } catch (err) {
    console.warn('⚠️  Local MongoDB failed:', err.message);
  }

  // Tier 3: In-Memory MongoDB (Demo Mode)
  try {
    mongoMemoryServerInstance = await MongoMemoryServer.create({
      binary: { version: '7.0.0', checkMD5: false },
    });
    const uri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(uri);
    console.log('✅ In-Memory MongoDB connected (Demo Mode)');
  } catch (err) {
    console.error('❌ All database tiers failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;

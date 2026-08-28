import mongoose from 'mongoose';

const directUri = 'mongodb://hri41468_db_user:Gayathriwaran@ac-qvuvg9y-shard-00-00.klbpl4m.mongodb.net:27017,ac-qvuvg9y-shard-00-01.klbpl4m.mongodb.net:27017,ac-qvuvg9y-shard-00-02.klbpl4m.mongodb.net:27017/transit-recovery?ssl=true&replicaSet=atlas-qvuvg9y-shard-0&authSource=admin&retryWrites=true&w=majority';

console.log('Testing direct shard URI connection...');

try {
  await mongoose.connect(directUri, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected to MongoDB Atlas directly!');
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('❌ Direct connection failed:', err.message);
  process.exit(1);
}

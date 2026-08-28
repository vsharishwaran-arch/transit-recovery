import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
process.env.MONGOMS_MD5_CHECK = 'false';

// Import models
import Route from '../src/models/Route.js';
import User from '../src/models/User.js';
import TicketSession from '../src/models/TicketSession.js';
import RecoveryLog from '../src/models/RecoveryLog.js';

const connectForSeed = async () => {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB Atlas for seeding');
      return;
    } catch {}
  }
  try {
    await mongoose.connect('mongodb://localhost:27017/transit-recovery');
    console.log('Connected to Local MongoDB for seeding');
    return;
  } catch {}
  const memServer = await MongoMemoryServer.create({
    binary: { version: '7.0.0', checkMD5: false },
  });
  await mongoose.connect(memServer.getUri());
  console.log('Connected to In-Memory MongoDB for seeding (Demo Mode)');
};

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const seed = async () => {
  await connectForSeed();

  // Clear existing data
  await Promise.all([
    Route.deleteMany({}),
    User.deleteMany({}),
    TicketSession.deleteMany({}),
    RecoveryLog.deleteMany({}),
  ]);

  // ===== 1. ROUTES =====
  const routeData = [
    { routeNumber: '47C', from: 'Koyambedu', to: 'Tambaram', distanceKm: 28, fare: 35 },
    { routeNumber: '21B', from: 'Chennai Central', to: 'Guindy', distanceKm: 15, fare: 25 },
    { routeNumber: '108', from: 'Madurai', to: 'Dindigul', distanceKm: 65, fare: 55 },
    { routeNumber: '78A', from: 'Coimbatore', to: 'Tiruppur', distanceKm: 45, fare: 45 },
    { routeNumber: '15C', from: 'Salem', to: 'Namakkal', distanceKm: 38, fare: 40 },
  ];
  const routes = await Route.insertMany(routeData);
  console.log('✅ Created 5 routes');

  // ===== 2. USERS =====
  const hashedAdmin = await bcrypt.hash('admin123', 12);
  const hashedConductor = await bcrypt.hash('conductor123', 12);

  const adminUser = await User.create({
    name: 'Admin User',
    employeeId: 'TNSTC-ADMIN',
    role: 'admin',
    password: hashedAdmin,
  });

  const conductors = await User.insertMany([
    {
      name: 'Rajan K',
      employeeId: 'TNSTC-2891',
      role: 'conductor',
      assignedRoute: routes[0]._id,
      assignedBus: 'TN01-AB-1234',
      password: hashedConductor,
    },
    {
      name: 'Murugan S',
      employeeId: 'TNSTC-3421',
      role: 'conductor',
      assignedRoute: routes[1]._id,
      assignedBus: 'TN07-CD-5678',
      password: hashedConductor,
    },
    {
      name: 'Selvam R',
      employeeId: 'TNSTC-1205',
      role: 'conductor',
      assignedRoute: routes[2]._id,
      assignedBus: 'TN59-EF-9012',
      password: hashedConductor,
    },
  ]);
  console.log('✅ Created 4 users (1 admin, 3 conductors)');

  // ===== 3. TICKET SESSIONS =====
  const sessions = [];
  const busNumbers = ['TN01-AB-1234', 'TN07-CD-5678', 'TN59-EF-9012', 'TN33-GH-3456', 'TN22-IJ-7890'];
  const fareRanges = { '47C': 35, '21B': 25, '108': 55, '78A': 45, '15C': 40 };

  // 15 × network_handoff failures
  for (let i = 0; i < 15; i++) {
    const route = randomFrom(routes);
    const conductor = randomFrom(conductors);
    const passengers = randomBetween(1, 4);
    sessions.push({
      sessionId: `rzp_net_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
      routeId: route._id,
      conductorId: conductor._id,
      busNumber: randomFrom(busNumbers),
      passengerCount: passengers,
      amount: (fareRanges[route.routeNumber] || 35) * passengers,
      paymentMethod: 'upi',
      upiStatus: 'failed',
      vehicleSpeed: randomBetween(45, 70),
      networkStrength: randomFrom(['none', 'weak']),
      passengerLoad: randomFrom(['medium', 'high']),
      providerStatus: 'timeout',
      createdAt: daysAgo(randomBetween(1, 28)),
    });
  }

  // 10 × peak_load failures
  for (let i = 0; i < 10; i++) {
    const route = randomFrom(routes);
    const conductor = randomFrom(conductors);
    const passengers = randomBetween(2, 6);
    sessions.push({
      sessionId: `rzp_peak_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
      routeId: route._id,
      conductorId: conductor._id,
      busNumber: randomFrom(busNumbers),
      passengerCount: passengers,
      amount: (fareRanges[route.routeNumber] || 35) * passengers,
      paymentMethod: 'upi',
      upiStatus: 'failed',
      vehicleSpeed: randomBetween(5, 30),
      networkStrength: 'strong',
      passengerLoad: 'overcrowded',
      providerStatus: 'timeout',
      createdAt: daysAgo(randomBetween(1, 25)),
    });
  }

  // 8 × insufficient_funds
  for (let i = 0; i < 8; i++) {
    const route = randomFrom(routes);
    const conductor = randomFrom(conductors);
    const passengers = randomBetween(1, 3);
    sessions.push({
      sessionId: `rzp_funds_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
      routeId: route._id,
      conductorId: conductor._id,
      busNumber: randomFrom(busNumbers),
      passengerCount: passengers,
      amount: (fareRanges[route.routeNumber] || 35) * passengers,
      paymentMethod: 'upi',
      upiStatus: 'failed',
      vehicleSpeed: randomBetween(0, 40),
      networkStrength: 'strong',
      passengerLoad: randomFrom(['low', 'medium']),
      providerStatus: 'insufficient_funds',
      createdAt: daysAgo(randomBetween(1, 20)),
    });
  }

  // 7 × user_cancelled
  for (let i = 0; i < 7; i++) {
    const route = randomFrom(routes);
    const conductor = randomFrom(conductors);
    const passengers = randomBetween(1, 4);
    sessions.push({
      sessionId: `rzp_cancel_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
      routeId: route._id,
      conductorId: conductor._id,
      busNumber: randomFrom(busNumbers),
      passengerCount: passengers,
      amount: (fareRanges[route.routeNumber] || 35) * passengers,
      paymentMethod: 'upi',
      upiStatus: 'cancelled',
      vehicleSpeed: randomBetween(0, 60),
      networkStrength: randomFrom(['strong', 'weak']),
      passengerLoad: randomFrom(['low', 'medium', 'high']),
      providerStatus: null,
      createdAt: daysAgo(randomBetween(1, 15)),
    });
  }

  // 5 × payment_success_ticket_failed (webhook dropout edge case)
  for (let i = 0; i < 5; i++) {
    const route = randomFrom(routes);
    const conductor = randomFrom(conductors);
    const passengers = randomBetween(1, 3);
    sessions.push({
      sessionId: `rzp_captured_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
      routeId: route._id,
      conductorId: conductor._id,
      busNumber: randomFrom(busNumbers),
      passengerCount: passengers,
      amount: (fareRanges[route.routeNumber] || 35) * passengers,
      paymentMethod: 'upi',
      upiStatus: 'payment_success_ticket_failed',
      vehicleSpeed: randomBetween(10, 50),
      networkStrength: randomFrom(['strong', 'weak']),
      passengerLoad: randomFrom(['medium', 'high']),
      providerStatus: 'captured',
      createdAt: daysAgo(randomBetween(1, 10)),
    });
  }

  await TicketSession.insertMany(sessions);
  console.log('✅ Created 45 TicketSessions (15 network, 10 peak, 8 funds, 7 cancelled, 5 webhook dropout)');

  // ===== 4. RECOVERY LOGS (5 for demo history) =====
  const createdSessions = await TicketSession.find().limit(5).populate('routeId');
  const demoMessages = [
    'Bus TN01-AB-1234 mein aapka ₹70 ka UPI payment fail ho gaya. Network issue tha. Kya aap dobara try kar sakte hain?',
    'Bus TN07-CD-5678 par aapka ₹50 payment process nahi hua. Please retry karein.',
    'Bus TN59-EF-9012-ல் உங்கள் ₹110 UPI கட்டணம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
    'Your UPI payment of ₹45 on bus TN33-GH-3456 (Salem to Namakkal) could not be processed. Please try again.',
    'Aapka ₹35 ka payment cancel ho gaya bus TN22-IJ-7890 mein. Kya aap dobara try karenge?',
  ];

  const recoveryLogs = [
    {
      sessionId: createdSessions[0]?.sessionId || 'demo_1',
      routeId: createdSessions[0]?.routeId?._id,
      busNumber: createdSessions[0]?.busNumber || 'TN01-AB-1234',
      amount: createdSessions[0]?.amount || 70,
      failureReason: 'network_handoff',
      aiMessage: demoMessages[0],
      messageLanguage: 'hinglish',
      suggestedAction: 'retry_at_stop',
      status: 'sent',
      attemptNumber: 1,
      batchRunId: 'batch_demo_001',
    },
    {
      sessionId: createdSessions[1]?.sessionId || 'demo_2',
      routeId: createdSessions[1]?.routeId?._id,
      busNumber: createdSessions[1]?.busNumber || 'TN07-CD-5678',
      amount: createdSessions[1]?.amount || 50,
      failureReason: 'peak_load',
      aiMessage: demoMessages[1],
      messageLanguage: 'hinglish',
      suggestedAction: 'retry_upi',
      status: 'sent',
      attemptNumber: 1,
      batchRunId: 'batch_demo_001',
    },
    {
      sessionId: createdSessions[2]?.sessionId || 'demo_3',
      routeId: createdSessions[2]?.routeId?._id,
      busNumber: createdSessions[2]?.busNumber || 'TN59-EF-9012',
      amount: createdSessions[2]?.amount || 110,
      failureReason: 'network_handoff',
      aiMessage: demoMessages[2],
      messageLanguage: 'tamil',
      suggestedAction: 'retry_at_stop',
      status: 'recovered',
      recoveredAt: new Date(),
      attemptNumber: 1,
      batchRunId: 'batch_demo_001',
    },
    {
      sessionId: createdSessions[3]?.sessionId || 'demo_4',
      routeId: createdSessions[3]?.routeId?._id,
      busNumber: createdSessions[3]?.busNumber || 'TN33-GH-3456',
      amount: createdSessions[3]?.amount || 45,
      failureReason: 'user_cancelled',
      aiMessage: demoMessages[3],
      messageLanguage: 'english',
      suggestedAction: 'retry_upi',
      status: 'escalated',
      escalatedAt: new Date(),
      attemptNumber: 2,
      batchRunId: 'batch_demo_001',
    },
    {
      sessionId: createdSessions[4]?.sessionId || 'demo_5',
      routeId: createdSessions[4]?.routeId?._id,
      busNumber: createdSessions[4]?.busNumber || 'TN22-IJ-7890',
      amount: createdSessions[4]?.amount || 35,
      failureReason: 'unknown',
      aiMessage: 'Skipped: max_attempts',
      messageLanguage: 'hinglish',
      suggestedAction: 'retry_upi',
      status: 'skipped',
      skipReason: 'max_attempts',
      attemptNumber: 3,
      batchRunId: 'batch_demo_001',
    },
  ];

  await RecoveryLog.insertMany(recoveryLogs);
  console.log('✅ Created 5 RecoveryLogs for demo history');
  console.log('🚀 Seed complete — run the recovery agent!');
  console.log('\nDemo credentials:');
  console.log('  Admin:     TNSTC-ADMIN  / admin123');
  console.log('  Conductor: TNSTC-2891   / conductor123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

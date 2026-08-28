# Transit Recovery Agent

**AI-powered autonomous UPI payment recovery for Tamil Nadu government bus ticketing**

Built for **Razorpay AI Buildathon 2026 — Track 03: AI Revenue Recovery**

---

## Architecture

```
Failed UPI Payment (Bus Network)
         ↓
Vehicle Context Capture
(speed, network strength, passenger load)
         ↓
Bus-Specific Failure Classification
(network handoff / peak load / low balance)
         ↓
Compliance Stopping Rules
(max attempts / stale / below threshold / escalated)
         ↓
Gemini 1.5 Flash
(Hinglish / Tamil / English recovery message)
         ↓
RecoveryLog (MongoDB audit trail)
         ↓
BatchRun Report
(₹ recovered / sessions / compliance breakdown)
         ↓
Admin Dashboard + Escalation Queue
```

---

## The Problem

Tamil Nadu buses run on a government-mandated digital ticketing system. But UPI payments fail constantly:
- **Moving vehicles** cause network handoffs between towers
- **Overcrowded buses** create peak-load timeouts on UPI servers
- **Passengers** give up mid-payment or have insufficient funds

Every failed ticket is **lost revenue** for the government. There is no automated recovery system.

---

## The Solution

An autonomous AI recovery agent that:
1. **Captures vehicle context** at the moment of failure (speed, network strength, passenger load)
2. **Classifies the exact root cause** — network handoff, peak load, or low balance
3. **Generates a personalized recovery message** in Hinglish or Tamil via Gemini 1.5 Flash
4. **Enforces compliance stopping rules** — no harassment, max 3 attempts
5. **Escalates persistent failures** to human review
6. **Reports exactly how much revenue was recovered**

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login with employeeId + password |
| POST | `/api/auth/logout` | Cookie | Clear auth cookie |
| GET | `/api/auth/me` | Cookie | Get current user |
| POST | `/api/conductor/ticket` | Conductor | Create ticket + Razorpay payment link |
| GET | `/api/conductor/ticket/:id/status` | Conductor | Poll payment status |
| GET | `/api/conductor/tickets` | Conductor | My last 50 tickets |
| GET | `/api/recovery/sessions` | Admin | Failed sessions with recovery logs |
| GET | `/api/recovery/stats` | Admin | Aggregated recovery metrics |
| GET | `/api/recovery/escalated` | Admin | Escalated sessions |
| GET | `/api/recovery/batches` | Admin | Last 10 batch runs |
| GET | `/api/recovery/batches/:id` | Admin | Batch detail + all logs |
| PATCH | `/api/recovery/mark-recovered` | Admin | Manual recovery mark |
| POST | `/api/agent/run` | Admin | Run autonomous recovery agent |
| GET | `/api/health` | Public | Health check + DB status |

---

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (3-tier fallback: Atlas → Local → In-Memory)
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/

# Auth
JWT_SECRET=your_jwt_secret_here

# AI
GEMINI_API_KEY=your_gemini_api_key_here

# Payments
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/harish200522/transit-recovery.git
cd transit-recovery

# Backend
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev            # starts on port 5000

# Seed data
node scripts/seedData.js

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # starts on port 5173
```

---

## Demo Credentials

| Role | Employee ID | Password |
|------|-------------|----------|
| Admin | `TNSTC-ADMIN` | `admin123` |
| Conductor | `TNSTC-2891` | `conductor123` |
| Conductor | `TNSTC-3421` | `conductor123` |

---

## Seed Data

The seed script creates:
- **5 Tamil Nadu bus routes** (47C Koyambedu→Tambaram, 21B Chennai Central→Guindy, 108 Madurai→Dindigul, 78A Coimbatore→Tiruppur, 15C Salem→Namakkal)
- **4 users** (1 admin, 3 conductors)
- **40 failed TicketSessions** (15 network handoff, 10 peak load, 8 low balance, 7 cancelled)
- **5 demo RecoveryLogs** (2 sent, 1 recovered, 1 escalated, 1 skipped)

---

## 3-Tier Database Fallback

| Tier | Connection | Log |
|------|-----------|-----|
| 1 | MongoDB Atlas (`MONGO_URI`) | ✅ MongoDB Atlas connected |
| 2 | Local MongoDB (`localhost:27017`) | ✅ Local MongoDB connected (fallback) |
| 3 | In-Memory MongoDB | ✅ In-Memory MongoDB connected (Demo Mode) |

---

## Stopping Rules (Compliance Safeguards)

| Rule | Condition | Action |
|------|-----------|--------|
| Already Recovered | Session has a `recovered` log | Skip |
| Max Attempts | 3+ non-skipped logs | Skip |
| Below Threshold | Amount < ₹50 | Skip |
| Too Old | Created > 30 days ago | Skip |
| Already Escalated | Has `escalated` log | Skip |
| Escalation Trigger | 2+ `sent`/`failed` logs | Escalate |

---

## Pitch

> "Tamil Nadu buses run on a government-mandated digital ticketing system. But UPI payments fail constantly — moving vehicles cause network handoffs, overcrowded buses create peak load timeouts, and passengers give up mid-payment. Every failed ticket is lost revenue for the government. I built an autonomous AI recovery agent that captures the vehicle context at the moment of failure, classifies the exact root cause — network handoff, peak load, or low balance — and generates a personalised recovery message in Hinglish or Tamil via Gemini. It processes batches of failed sessions with compliance stopping rules, escalates persistent failures to human review, and reports exactly how much revenue was recovered. The architecture is production-ready — only the simulated outcome needs to be replaced with a real payment webhook."

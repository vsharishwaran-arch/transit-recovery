```markdown
 🚍 Transit Recovery Agent
> AI-powered autonomous UPI payment recovery for Tamil Nadu 
> government bus ticketing

Built for Razorpay AI Buildathon 2026 — Track 03: AI Revenue Recovery

[![CI](https://github.com/vsharishwaran-arch/transit-recovery/actions/workflows/transit-recovery-check.yml/badge.svg)](https://github.com/vsharishwaran-arch/transit-recovery/actions)

---

 🎬 Demo Video
[▶ Watch 5-minute Demo](https://drive.google.com/file/d/1z2KDKws_JU8qv0XNEW_TrSmhUvV46r0H/view?usp=sharing)

---

💡 The Problem — A Personal Experience

On August 28, 2026, I paid ₹35 via UPI on a TNSTC bus from 
college. My phone showed **payment successful**. The conductor's 
machine was still loading. He restarted it. My ticket never 
came. I didn't know if I'd been charged.

This happens thousands of times daily across Tamil Nadu's 
21,000 buses:

- 🚌 Moving vehicles cause **network handoffs** between towers
- 👥 Overcrowded buses create **peak-load timeouts** on UPI servers  
- 🔄 Conductor terminal restarts cause **webhook dropouts** — 
  passenger charged, ticket never printed
- ❌ Passengers give up mid-payment — **checkout abandonment**

Every failed ticket is lost government revenue. 
There is no automated recovery system. **Until now.**

---

✅ The Solution

An autonomous AI recovery agent that:

1. **Detects** failed, expired, and cancelled UPI ticket sessions
2. **Captures** vehicle telemetry at moment of failure 
   (speed, network strength, passenger load)
3. **Classifies** exact root cause using bus-specific logic
4. **Generates** personalized recovery messages via Gemini 1.5 Flash
   in **Hinglish, Tamil, or English**
5. **Enforces** 5 compliance stopping rules — no harassment
6. **Tracks** verbal payment promises with live countdown timers
7. **Escalates** persistent failures to human review
8. **Reports** exact rupees recovered per batch run

---

🏗️ Architecture

```
Failed UPI Payment (Bus Network)
         ↓
Vehicle Context Capture
(speed, network strength, passenger load)
         ↓
Bus-Specific Failure Classification
┌─────────────────────────────────────┐
│ network_handoff  → speed >40 + timeout  │
│ peak_load        → overcrowded + timeout│
│ insufficient_funds → funds error        │
│ webhook_dropout  → paid but no ticket   │
│ user_cancelled   → abandoned payment    │
└─────────────────────────────────────┘
         ↓
5 Compliance Stopping Rules
(max attempts / stale / below ₹50 / escalated)
         ↓
Gemini 1.5 Flash
(Hinglish / Tamil / English recovery message)
         ↓
RecoveryLog (MongoDB audit trail)
         ↓
BatchRun Report
(₹ recovered / sessions / compliance breakdown)
         ↓
Admin Dashboard + PTP Tracker + Escalation Queue
```

---

⭐ Key Features

 🤖 Autonomous Recovery Agent
- Sequential batch processing (5–50 sessions per run)
- Bus-specific telemetry classifier — 6 failure root causes
- Gemini 1.5 Flash multilingual message generation
- Graceful fallback to templates if LLM unavailable

🛡️ 5 Compliance Safeguards
| Rule | Condition | Action |
|---|---|---|
| Already Recovered | Session has recovered log | Skip |
| Max Attempts | 3+ non-skipped logs | Skip |
| Below Threshold | Amount < ₹50 | Skip |
| Too Old | Created > 30 days ago | Skip |
| Already Escalated | Has escalated log | Skip |

 🤝 Promise-to-Pay (PTP) Tracker
- Conductor marks verbal payment commitments on-device
- Custom timer: 5 to 60 minutes (conductor sets)
- **Live countdown timers** in admin dashboard
  - 🟢 Green: >5 min | 🟡 Amber: 2–5 min | 🔴 Red: <2 min
- Background agent auto-escalates expired promises every 60 seconds
- Directly matches Razorpay's Track 03 example: *"Promise-to-pay tracker"*

📱 Conductor Mobile PWA
- Dark theme — readable in direct sunlight
- One-handed operation — 48px+ touch targets
- Dynamic QR code — 3-second live payment polling
- Animated status ring: Blue (waiting) → Green (paid) → Red (failed)
- PTP modal — record promise without leaving the screen

 📊 Admin Recovery Dashboard
- Real-time KPI cards (₹ at risk, recovered, rate, escalated)
- Recharts failure breakdown by root cause
- Expandable AI message inspector per session
- Batch history — last 10 agent runs
- Escalated queue — human review workflow

🌐 Passenger Retry Portal
- Public URL — no login required
- Shows journey details + fare
- One-tap Razorpay checkout
- Auto-updates RecoveryLog on payment

---

🎬 Demo Walkthrough

> Full video: [▶ Watch Demo](YOUR_VIDEO_LINK_HERE)

| Step | What to see | URL |
|---|---|---|
| 1 | Health check | `localhost:5000/api/health` |
| 2 | Admin login | `localhost:5173` → TNSTC-ADMIN |
| 3 | Stats — ₹ at risk | Dashboard cards |
| 4 | Run agent — Hinglish | "Run Recovery Agent" button |
| 5 | Batch results — ₹ recovered | BatchResultsPanel |
| 6 | AI message — Hinglish | "AI Msg ▾" expand |
| 7 | PTP tracker — live countdown | PTP Tracker tab |
| 8 | Escalated queue | Escalated tab |
| 9 | Conductor QR | Login: TNSTC-2891 |
| 10 | Passenger retry | `localhost:5173/retry` |

---

🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express 4, Mongoose 8, ES Modules |
| Database | MongoDB Atlas (3-tier fallback) |
| AI Engine | Gemini 1.5 Flash (@google/genai) |
| Payments | Razorpay SDK (payment links, QR, webhooks) |
| Auth | HTTP-only cookie JWT, RBAC |
| CI | GitHub Actions |

---

🗄️ Database Models (6 Models)

```
Route          — bus routes, fares, depot info
User           — conductors + admins (RBAC)
TicketSession  — payment transactions + vehicle telemetry
RecoveryLog    — audit trail of every AI recovery attempt
BatchRun       — batch execution metrics + ₹ recovered
PromiseToPay   — verbal commitment tracker + expiry
```

---

🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check + DB status |
| POST | `/api/auth/login` | Public | Login → HTTP-only JWT cookie |
| POST | `/api/auth/logout` | Cookie | Clear auth cookie |
| GET | `/api/auth/me` | Cookie | Current user |
| POST | `/api/conductor/ticket` | Conductor | Create ticket + Razorpay QR |
| GET | `/api/conductor/ticket/:id/status` | Conductor | Poll payment status |
| GET | `/api/conductor/tickets` | Conductor | Last 50 tickets |
| GET | `/api/recovery/sessions` | Admin | Failed sessions + AI logs |
| GET | `/api/recovery/stats` | Admin | Recovery metrics |
| GET | `/api/recovery/escalated` | Admin | Escalated queue |
| GET | `/api/recovery/batches` | Admin | Last 10 batch runs |
| GET | `/api/recovery/batches/:id` | Admin | Batch detail + audit log |
| PATCH | `/api/recovery/mark-recovered` | Admin | Manual recovery |
| POST | `/api/agent/run` | Admin | Run recovery agent |
| POST | `/api/ptp/create` | Conductor | Record promise to pay |
| PATCH | `/api/ptp/mark-paid` | Conductor | Mark promise fulfilled |
| GET | `/api/ptp/active` | Admin | Active promises + countdowns |
| GET | `/api/ptp/stats` | Admin | PTP success metrics |

---

⚙️ Environment Variables

```bash
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (3-tier: Atlas → Local → In-Memory)
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/transit-recovery

# Auth
JWT_SECRET=your_jwt_secret_here

# AI — free key at aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key_here

# Payments
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

 🚀 Quick Start

```bash
# Clone
git clone https://github.com/vsharishwaran-arch/transit-recovery.git
cd transit-recovery

# Backend
cd backend
npm install
cp .env.example .env   # fill your keys
npm run dev            # → localhost:5000

# Seed data (new terminal)
node scripts/seedData.js

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # → localhost:5173
```

---

 👤 Demo Credentials

| Role | Employee ID | Password | Access |
|---|---|---|---|
| Admin | `TNSTC-ADMIN` | `admin123` | Full dashboard + agent |
| Conductor | `TNSTC-2891` | `conductor123` | Route 47C — TN01-AB-1234 |
| Conductor | `TNSTC-3421` | `conductor123` | Route 21B — TN07-CD-5678 |

---

🌱 Seed Data

```
5  Tamil Nadu routes (47C, 21B, 108, 78A, 15C)
4  Users (1 admin, 3 conductors)
45 TicketSessions:
   15 × network_handoff (speed >40kmph)
   10 × peak_load (overcrowded + timeout)
   8  × insufficient_funds
   7  × user_cancelled
   5  × webhook_dropout (paid but no ticket)
5  RecoveryLogs (demo history)
8  PromiseToPay records (3 active, 2 paid, 2 expired, 1 escalated)
```

---

 🗣️ Pitch

> *"Tamil Nadu buses run on government-mandated digital ticketing.
> But UPI payments fail constantly — moving vehicles cause network 
> handoffs, overcrowded buses create peak load timeouts, and conductor 
> terminal restarts cause webhook dropouts where the passenger is 
> charged but gets no ticket. I faced this personally on August 28th.
> I built an autonomous AI recovery agent that captures vehicle 
> telemetry at the moment of failure, classifies the exact root cause,
> and generates personalized recovery messages in Hinglish or Tamil 
> via Gemini 1.5 Flash. It tracks verbal payment promises with live 
> countdown timers, enforces 5 compliance stopping rules, escalates 
> persistent failures to human review, and reports exactly how much 
> revenue was recovered — closing the loop from detection to recovery."*

---

 👨‍💻 Author

**Harishwaran V S**  
Final Year B.Tech — AI & Data Science  
M. Kumarasamy College of Engineering, Karur  
📧 vsharishwaran@gmail.com  
🐙 [github.com/harish200522](https://github.com/harish200522)
```

# AriZon — Smart PDS

### Kerala Civil Supplies & Consumer Affairs Department

**SC-09 Hackathon 2026 — Ration Shop Stock Visibility**

> **Know the stock before you travel. Track the supply. Verify the transaction.**

---

### 🏛️ Kerala Sovereign AI & Digital Governance Pioneer
> *"As Kerala surges ahead as a national pioneer in cutting-edge tech and digital public infrastructure, the Kerala Government can deploy **Kerala-based Local Sovereign Indic LLMs** (C-DAC / Digital University Kerala) to power AriZon — ensuring maximum data sovereignty, citizen privacy, zero leakage of sensitive PDS distribution telemetry outside state boundaries, and native Malayalam fluency."*

AriZon features a **Pluggable Multi-Provider AI Gateway** in the Government Portal (`/gov`), allowing civil supplies officers to switch between **10+ AI Providers** in real-time without restarting or redeploying:
1. **Kerala Sovereign Indic LLM (Local Edge)** — State-hosted air-gapped sovereign inference (`localhost:11434 / vLLM`)
2. **OpenRouter (Universal Router)** — Access to 100+ models with universal routing
3. **xAI (Grok 2 / Grok Vision)** — Fast multi-modal reasoning
4. **DeepSeek (V3 / R1 Reasoning)** — Ultra-low-cost high-performance reasoning
5. **OpenAI (GPT-4o / GPT-4o-mini)** — Industry standard function calling
6. **Anthropic (Claude 3.5 Sonnet)** — Strict enterprise-grade alignment
7. **Groq (Llama 3.3 70B Versatile)** — Sub-second ultra-low latency inference
8. **Google Gemini (2.0 Flash)** — High-context multi-lingual processing
9. **Together AI (Llama 3.3 70B Turbo)** — High-throughput open-weights hosting
10. **Ollama (Self-Hosted Local)** — Zero-cloud privacy for field taluk offices
11. **Custom State Gateway** — Dedicated State Data Centre endpoints

---

AriZon is an **AI-assisted Smart PDS platform** designed to improve ration-shop stock visibility, supply-chain tracking, transparency, and citizen access.

Instead of treating ration-shop stock as a single number, AriZon connects the flow:

```text
Government
    ↓
Taluk / Supplier
    ↓
Dispatch
    ↓
Ration Shop
    ↓
Stock
    ↓
e-POS Sale
    ↓
Citizen
```

The goal is simple:

**Let citizens check ration availability before visiting the shop while giving government officers better visibility into the stock journey.**

---

## The Problem

A ration-card holder may travel to a Fair Price Shop without knowing whether the required commodity is available.

At the same time, stock passes through multiple stages:

* allocation
* dispatch
* receipt
* storage
* sale
* reconciliation

Without connecting these stages, it becomes difficult to understand:

* what was allocated
* what was dispatched
* what was received
* what was sold
* what should remain
* where a discrepancy occurred

---

## Our Solution

AriZon connects four stakeholders through one shared system:

```text
┌──────────────┐
│ Government   │
└──────┬───────┘
       ↓
┌──────────────┐
│ Supplier     │
└──────┬───────┘
       ↓
┌──────────────┐
│ Ration Shop  │
└──────┬───────┘
       ↓
┌──────────────┐
│ Citizen      │
└──────────────┘
```

### Core features

* Shop-level stock visibility
* Nearby ration-shop discovery
* "Notify Me" stock alerts
* Delivery and weight verification
* e-POS transaction recording
* Household transaction notifications
* Three-level supply approval
* Stock reconciliation
* AI-assisted forecasting and anomaly analysis
* Government AI control panel
* Excel stock import
* English + Malayalam interface

---

# Four Portals

## Customer — `/customer`

For ration-card holders.

* Find nearby ration shops
* Search commodities
* View current stock
* Check stock status
* Subscribe to arrival alerts
* View purchase history
* Confirm or dispute transactions
* Ask the AI Agent in English or Malayalam

---

## Seller — `/seller`

For Fair Price Shop operators.

* View shop inventory
* Record deliveries
* Compare dispatched vs received quantity
* Process e-POS sales
* Update stock
* Record controlled adjustments
* Upload stock using Excel
* View demand and inventory information

Example:

```text
Dispatched: 1000 kg
Received:    850 kg

Variance:     15%
Status:       MISMATCH
```

The system records the actual received quantity for the stock calculation.

---

## Supplier — `/supplier`

For Taluk-level supply operations.

* View shop demand
* Approve dispatches
* Track deliveries
* View stock requirements
* Forecast demand
* Get AI-assisted allocation recommendations

---

## Government — `/gov`

For Directorate-level oversight.

* State-wide stock overview
* Supply-chain approval
* Reconciliation
* Anomaly detection
* Trust signals
* Demand analytics
* Audit information
* SMS monitoring
* AI configuration and control

---

# Three-Level Supply Approval

AriZon creates an explicit workflow:

```text
Government
   │
   │ Allocation
   ▼
Supplier / Taluk
   │
   │ Dispatch Approval
   ▼
Ration Shop
   │
   │ Receive + Verify
   ▼
Stock Available
```

Each stage can record:

* requested quantity
* approved quantity
* dispatched quantity
* received quantity
* verification result
* responsible user
* timestamp

This creates a clearer operational trail from allocation to shop.

---

# Stock Ledger

AriZon uses the basic stock equation:

```text
Opening Stock
+ Received
- Sold
± Approved Adjustments
= Closing Stock
```

The system can compare the calculated balance with the recorded/observed balance and highlight discrepancies.

This allows stock history to be analyzed rather than relying only on the latest manually entered number.

---

# Trust & Verification

The prototype combines multiple signals:

### 1. Weight variance

```text
Warehouse Dispatch
        vs
Shop Received Weight
```

### 2. Citizen confirmation

```text
Recognized transaction
        vs
Disputed transaction
```

### 3. Transaction behavior

Transaction activity can be analyzed for unusual patterns.

The Government dashboard brings these signals together to help identify shops that may need investigation.

> These are prototype decision-support mechanisms and are not presented as the current official Kerala PDS fraud-detection system.

---

# Citizen Notifications

AriZon supports two important notification flows.

### Restock alert

```text
Item unavailable
      ↓
Citizen selects "Notify Me"
      ↓
Delivery recorded
      ↓
Stock updated
      ↓
Notification generated
```

### Transaction alert

A sale can generate notifications for registered household members so that the household can identify an unrecognized transaction and report it.

---

# AI Agent

AriZon uses a **provider-neutral AI Agent architecture**.

The AI can assist different roles with:

* natural-language queries
* stock analysis
* demand forecasting
* supply recommendations
* anomaly explanations
* reports

Access is role-scoped, so a customer, shopkeeper, supplier, and government officer do not receive the same tools.

The AI provider can be configured through:

```env
AI_API_KEY=
AI_BASE_URL=
AI_MODEL=
```

This keeps the application flexible for future government-approved AI infrastructure.

---

# Government AI Control

The Government portal is designed to control the AI integration.

A future production deployment can use this layer for:

* changing AI providers
* changing models
* rotating API credentials
* enabling/disabling AI features
* monitoring AI requests
* maintaining audit records

AI is intended to **assist authorized officers**, not silently replace human approval for high-impact decisions.

---

# Excel Stock Import

To make data entry easier for ration shops:

```text
Download Template
        ↓
Fill Stock Data
        ↓
Upload Excel
        ↓
Validate
        ↓
Update Stock
```

This provides a standardized way for shop operators to submit stock, reducing inconsistent formats and repeated manual entry.

---

# Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts
* Lucide React

### Backend

* Next.js API Routes
* Server Actions
* TypeScript

### Database

* PostgreSQL
* Supabase-compatible architecture
* Shared relational data model

### AI

* Provider-neutral AI API
* Role-scoped tool calling

### Other

* Excel import/export
* SMS notification layer
* English/Malayalam localization

---

# Project Structure

```text
ARIZON/
│
├── app/
│   ├── customer/
│   ├── seller/
│   ├── supplier/
│   ├── gov/
│   ├── login/
│   ├── api/
│   └── actions/
│
├── components/
│
├── lib/
│   ├── ai.ts
│   ├── data.ts
│   ├── tools.ts
│   ├── types.ts
│   └── translations.ts
│
├── supabase/
│   └── schema.sql
│
├── package.json
└── README.md
```

---

# Getting Started

## Install

```bash
git clone <YOUR_REPOSITORY_URL>
cd ARIZON
npm install
```

## Development

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production

```bash
npm run build
npm run start
```

---

# AI Configuration

Create:

```text
.env.local
```

Example:

```env
AI_API_KEY=your_api_key
AI_BASE_URL=https://your-provider.example/v1
AI_MODEL=your-model
```

Never commit API keys to GitHub.

---

# Demo Flow

For a hackathon demonstration:

### 1. Citizen

```text
Login
 ↓
Find nearby shop
 ↓
Check stock
 ↓
Subscribe to restock alert
```

### 2. Seller

```text
Record delivery
 ↓
Verify received weight
 ↓
Process sale
 ↓
Stock automatically changes
 ↓
Household notification generated
```

### 3. Supplier

```text
Review demand
 ↓
Approve dispatch
 ↓
Use AI forecast/recommendation
```

### 4. Government

```text
Monitor supply chain
 ↓
Check reconciliation
 ↓
Inspect anomalies
 ↓
Control AI configuration
```

---

# Quickstart & Vercel Deployment

### 1. Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/ARIZON.git
cd ARIZON

# Install dependencies
npm install

# Start local development server
npm run dev
# Open http://localhost:3000 in your browser
```

### 2. Deploy to Vercel in 60 Seconds
AriZon is built on **Next.js 16 (App Router)** and is 100% cloud-ready for instant Vercel deployment:

1. **Push to GitHub**: Commit your changes and push the repo to GitHub.
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your GitHub repository.
   - **Root Directory**: If your repository has `ARIZON` as a subfolder, set Root Directory to `ARIZON`. If `ARIZON` is the repo root, leave it as `./`.
   - **Framework Preset**: `Next.js` (automatically detected).
3. **Environment Variables (Optional for demo/hackathon)**:
   - AriZon includes a resilient **Zero-Setup Mock Database and In-Memory Store** that boots automatically without external dependencies!
   - If you want persistent Supabase cloud storage:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
   - If you want pre-configured AI (can also be entered live via the `/gov` AI Control Panel):
     - `GROK_API_KEY` or `OPENROUTER_API_KEY`: Your API key
     - `AI_GATEWAY_PROVIDER`: `openrouter` (or `xai`, `deepseek`, etc.)
4. **Deploy**: Click **Deploy**. Vercel will build and output your live production URL in under 2 minutes!

---

# Prototype vs Production

AriZon is currently a **hackathon prototype**.

The prototype may contain synthetic/demo:

* ration cards
* households
* shops
* transactions
* deliveries
* stock values
* SMS records
* trust scores
* AI recommendations

It does **not** claim to be directly connected to Kerala's live production PDS database.

A production deployment would require authorized integration with the appropriate government systems, identity infrastructure, e-POS systems, notification services, and approved data interfaces.

---

# Security & Privacy

A production version should use:

* role-based access control
* secure authentication
* encrypted data
* protected API credentials
* audit logs
* minimum necessary personal data
* strict access to household information

Aadhaar numbers should not be publicly exposed.

---

# Future Roadmap

### Phase 1 — Hackathon

* [x] Four portals
* [x] Stock visibility
* [x] Stock ledger
* [x] Delivery verification
* [x] Notifications
* [x] Supply approval workflow
* [x] AI Agent
* [x] Government dashboard
* [x] Reconciliation
* [x] Excel import
* [x] Malayalam support

### Phase 2 — Pilot

* Real FPS master data
* Authorized shop accounts
* Real notification gateway
* Verified stock feeds
* Pilot deployment

### Phase 3 — Production

* Authorized government integrations
* e-POS integration
* Official allocation/dispatch data
* Government hosting
* Security audit
* State-wide deployment

---

# Hackathon Goal

**SC-09 — Ration Shop Stock Visibility**

AriZon focuses on the core citizen question:

> **"Do I need to go to the ration shop today?"**

And extends it into a larger system question:

> **"Where did this stock come from, how much should be here, what was sold, and does the data match?"**

---

# Vision

AriZon aims to make PDS information more:

**Visible → Traceable → Verifiable → Actionable**

### AriZon

**See the stock.
Track the supply.
Verify the transaction.**

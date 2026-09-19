# SMART PDS (AriZon) — DEEP OPERATIONAL & ARCHITECTURAL SPECIFICATION

> **Kerala State Civil Supplies & Consumer Affairs Department**  
> **AriZon Platform — Production-Grade Technical & Operational Specification Document**  
> *A Unified AI-Agent-Driven PDS Stock Visibility, 3-Tier Supply Chain Verification, Anti-Leakage, and Predictive Optimization Platform*

---

## 1. Executive Summary & The Governance Problem It Solves

### The Ground Truth in Kerala
- **14,200+ Fair Price Shops (Ration Shops / FPS)** across 14 districts in Kerala serve over **85 lakh ration cardholder households**.
- Since 2018, shops operate biometric **e-POS (Electronic Point of Sale)** machines linked to `epos.kerala.gov.in`.
- The State Government is actively integrating e-POS machines with **e-Balance digital weighing scales** to electronically capture physically delivered and dispensed weights.
- Despite high technological adoption, **national PDS grain diversion historically reached 40%–50%**, with state audits indicating that approximately **28% of allocated foodgrains fail to reach genuine beneficiaries**.
- Biometric authentication alone cannot eliminate diversion because:
  1. **Single-Token Vulnerability**: An unsuspecting family member's biometric authentication can be misused for unreceived commodities.
  2. **Warehouse-to-Shop Transit Siphoning**: Diverted grain leaves the taluk godown but is siphoned before reaching the shop scale.
  3. **Information Asymmetry & Wasted Travel**: Daily-wage earners walk or travel miles to distant shops only to find Matta Rice, Kuruva Rice, Wheat, or Sugar out of stock, losing critical daily wages.
  4. **Post-Facto Book Doctoring**: Dealers reconcile missing grain by manually doctoring opening balances in next month's paper or offline spreadsheets.

### The AriZon Solution
Instead of developing four isolated, hardcoded admin panels, **AriZon places a single, role-scoped AI reasoning core (powered by xAI Grok / OpenAI / Anthropic / Gemini / Sovereign Edge Models) at the operational center of the system**.

The platform provides:
1. **Live SKU-Level Stock Visibility**: Citizens verify live grain inventory, opening/received/sold metrics, and distance before leaving home.
2. **Citizen Stockout Subscriptions ("Notify Me")**: Households register interest for out-of-stock items; the platform logs unfulfilled demand and automatically broadcasts SMS alerts to all registered family members the second grain is weighed on the shop's e-Balance scale.
3. **Multi-Member Household SMS Broadcast**: Every purchase or delivery triggers an automated SMS alert to **every Aadhaar-linked family member registered on the ration card**, turning 85 lakh families into anti-diversion inspectors.
4. **3-Tier Supply Chain Approval Pipeline**:
   - **Tier 1 (Gov)**: Issues state allocation directives with rationale and target quotas.
   - **Tier 2 (TSO / Supplier)**: Reviews directive, allocates godown inventory, approves, and marks in transit.
   - **Tier 3 (FPS Dealer & On-Site Inspector)**: Dealer weighs consignment on e-Balance scale, and the civil supplies inspector signs off biometrically to lock the ledger.
5. **Government AI API Control Panel & Model Gateway**: State officials can dynamically switch LLM providers, rotate API keys, alter models, run live connectivity ping tests with millisecond latency benchmarks, or engage deterministic local fallbacks.
6. **Inline Editable Stock Ledger**: Dealers and auditors can update inventory values with live calculations ($Closing = Opening + Received - Sold$) and immediate anomaly re-evaluations.
7. **Multi-Signal Anti-Leakage Trust Engine**: Cross-checks three independent vectors ($S_1$ weighing scale variance, $S_2$ citizen confirmation ratio, $S_3$ biometric velocity) to generate trust scores and plain-language audit explanations for Civil Supplies officers.
8. **Real-Time Cross-Portal Synchronization**: Instant background polling and visibility-aware state refreshes keep all four portals synchronized without page reloads.
9. **Native Bilingual Experience (English & മലയാളം)**: Accessible to every citizen and official across Kerala.

---

## 2. System Architecture: The Unified AI Core

```
 [Customer (/customer)]   [Seller (/seller)]   [Supplier (/supplier)]   [Gov (/gov)]
            \                      |                      |                     /
             \_____________________|______________________|____________________/
                                           |
                              Unified Navigation & Auth Gate
                                           |
                           Central AI Agent Engine & Gateway
                       (Role-Scoped Function Calling: Grok / Multi-LLM)
                                           |
        ┌──────────────────────────────────┼──────────────────────────────────┐
        │                                  │                                  │
   PostgreSQL DB                     SMS Broadcast                      IoT & Hardware
(Ledger, Supply Orders,           (Multi-Member Fan-out            (e-POS Biometrics, e-Balance
 Confirmations, Anomalies)           via DLT Gateway)                  Electronic Scales)
```

### Role-Scoped Tool Execution Matrix
The central AI agent dynamically validates the caller's role before executing any tool function:

| Tool Function | Customer (`/customer`) | Seller (`/seller`) | Supplier (`/supplier`) | Government (`/gov`) | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `get_stock` | **Yes** | **Yes** | **Yes** | **Yes** | Fetches live stock ledger and closing balances |
| `get_nearby_shops` | **Yes** | No | No | **Yes** | Calculates Haversine distance and shop item status |
| `record_unfulfilled_request` | **Yes** | No | No | **Yes** | Logs citizen demand and registers arrival alerts |
| `log_delivery` | No | **Yes** | No | **Yes** | Compares dispatch vs e-Balance scale, auto-updates stock |
| `record_manual_update` | No | **Yes** | No | **Yes** | Dealer emergency fallback adjustment with audit note |
| `grok_seller_consultant` | No | **Yes** | No | **Yes** | Dealer business advisor for burn rates and re-orders |
| `forecast_demand` | No | No | **Yes** | **Yes** | Time-series forecasting for upcoming monthly cycles |
| `grok_optimize_supply` | No | No | **Yes** | **Yes** | Computes optimal godown grain allocation vectors |
| `compute_reconciliation` | No | No | **Yes** (Own Scope) | **Yes** | Calculates Opening + Received - Sold vs Closing |
| `detect_anomaly` | No | No | No | **Yes** | 3-signal cross-check generating plain-language audit |
| `generate_report` | No | No | No | **Yes** | Executive state-wide audit memorandum generation |
| `send_sms` | *System* | *System* | *System* | **Yes** | Broadcasts SMS to all Aadhaar-linked family members |

---

## 3. Exhaustive Directory & File-by-File Breakdown

### Root Directory
- **`package.json`**: Defines dependencies: Next.js 16 (App Router, Turbopack), React 19, `@ai-sdk/openai`, `ai`, `@supabase/supabase-js`, `lucide-react`, `recharts`, and Tailwind CSS.
- **`tsconfig.json`**: TypeScript compiler configuration with strict mode and path alias `@/*`.
- **`next.config.ts`**: Next.js production build configuration.
- **`README.md`**: Public presentation, architecture diagrams, and quickstart documentation.
- **`working.md`**: Complete operational and architectural specification (this file).

---

### `supabase/` (Database Layer)
- **`supabase/schema.sql`**:
  Contains PostgreSQL DDL for 11 relational tables:
  1. `shops`: Shop metadata (`id`, `name`, `district`, `taluk`, `lat`, `lon`).
  2. `commodities`: Standardized PDS items (`id`, `name`, `unit`).
  3. `ration_cards`: Cards mapped to shops (`id`, `shop_id`, `category` e.g. AAY, PHH, NPS).
  4. `card_members`: All registered family members (`id`, `card_id`, `name`, `phone_number`).
  5. `transactions`: e-POS sales log (`id`, `card_id`, `shop_id`, `commodity_id`, `qty`, `source`, `timestamp`).
  6. `deliveries`: Consignment logs (`id`, `shop_id`, `commodity_id`, `dispatched_qty`, `weighed_qty`, `timestamp`).
  7. `confirmations`: Citizen crowd verifications (`id`, `transaction_id`, `confirmed`, `timestamp`).
  8. `stock_ledger`: Monthly balance ledger (`shop_id`, `commodity_id`, `period`, `opening`, `received`, `sold`, `closing`).
  9. `unfulfilled_requests`: Backlog of items citizens wanted that were out of stock (`card_id`, `shop_id`, `commodity_id`, `status`, `requested_at`).
  10. `anomaly_flags`: AI audit records (`shop_id`, `period`, `trust_score`, `reasoning`, `created_at`).
  11. `sms_outbox`: Multi-member household SMS logs (`card_id`, `phone_number`, `message`, `sent_at`).
  Includes seed data for Ernakulam (Kanayannur, Kochi, Aluva) and Thiruvananthapuram (Kazhakkoottam).

---

### `lib/` (Core Logic & Infrastructure)
- **`lib/types.ts`**: TypeScript definitions for all domain entities, tool parameters, and response structures.
- **`lib/data.ts`**: In-memory and Supabase-mirrored singleton data store:
  - Methods: `getShops()`, `getNearbyShops()`, `getStock()`, `logDelivery()`, `recordTransaction()`, `recordConfirmation()`, `getReconciliation()`, `getAnomalyReports()`.
  - **3-Tier Supply Orders**: `createSupplyOrder()`, `advanceSupplyOrder()`, `getSupplyOrders()`, `supplyOrderCounts()`.
  - **Editable Ledger**: `updateStockCell()` with automatic closing balance recomputation and instant anomaly re-evaluation.
- **`lib/ai.ts`**: Vendor-neutral AI client wrapping `@ai-sdk/openai` configured with dynamic parameters from `lib/ai-control.ts`. Features deterministic local rule fallbacks for complete offline resilience.
- **`lib/ai-control.ts`**: Government AI Control singleton holding active provider, model, base URL, encrypted/masked API keys, live request logs, and test ping capabilities.
- **`lib/tools.ts`**: Definitions and implementations of all 12 callable tools.
- **`lib/translations.ts`**: Bilingual localization dictionary (English & മലയാളം) providing complete UI and prompt translations.
- **`lib/supabase.ts`**: Client connector for Supabase PostgreSQL instance.

---

### `components/` (Shared UI Components)
- **`components/Navbar.tsx`**: Header with Kerala State seal, portal selector (`/customer`, `/seller`, `/supplier`, `/gov`), and bilingual toggle (English / മലയാളം).
- **`components/AgentChat.tsx`**: Role-aware conversational AI widget displaying function-calling execution badges, preset prompts, and natural language responses.
- **`components/EditableCell.tsx`**: Inline editable number input for stock ledger values with Enter to save, Esc to cancel, and instant database mutation.
- **`components/useAutoRefresh.ts`**: React hook for visibility-aware interval polling and window focus synchronization.
- **`components/StockBadge.tsx`**: Color-coded stock status badge (`IN STOCK`, `LOW STOCK`, `OUT OF STOCK`).
- **`components/MobileTabBar.tsx`**: Responsive bottom navigation tab bar for mobile viewport ergonomics.

---

### `app/` (Pages & API Routes)
- **`app/page.tsx`**: Landing page presenting the vision, 4 portal launchers, system architecture, and live statewide stats.
- **`app/login/page.tsx`**: Password-less citizen login with 10-digit ration card ID and mock OTP `1234`.
- **`app/customer/page.tsx`**: Citizen portal featuring nearby shop stock finder, SKU status badges, "Notify Me" SMS subscription, transaction crowd-confirmation, and bilingual citizen AI assistant.
- **`app/seller/page.tsx`**: FPS Dealer portal featuring inline editable stock ledger, 3-tier consignment receipt & staff sign-off, e-Balance scale verification form, e-POS sale simulator, and Grok AI dealer consultant.
- **`app/supplier/page.tsx`**: Taluk Supply Officer portal featuring 3-tier directive approval & transit dispatch, taluk demand charts, 3-month forecasting, and Grok AI supply allocation optimizer.
- **`app/gov/page.tsx`**: State Directorate portal featuring 3-tier directive issuance & pipeline monitoring, AI API Control Panel & Model Gateway, multi-signal anomaly heatmap, reconciliation matrix, and SMS outbox table.

#### Backend API Routes (`app/api/`)
- **`app/api/supply-orders/route.ts`**: Handles directive creation and 5-stage approval transitions (`gov_directive` $\to$ `supplier_approved` $\to$ `in_transit` $\to$ `shop_received` $\to$ `staff_approved`).
- **`app/api/admin/ai/route.ts`**: GET/POST/DELETE for reading and updating AI configuration, toggling AI engine, and testing upstream connectivity with live latency ping.
- **`app/api/admin/ai/key/route.ts`**: Secure endpoint for rotating and updating the LLM API key.
- **`app/api/stock/[shop_id]/[commodity_id]/route.ts`**: PATCH endpoint for inline ledger cell updates, auto-recomputing closing balance and triggering anomaly checks.
- **`app/api/chat/route.ts`**: Central role-scoped AI agent endpoint executing tool calls based on user authorization.
- **`app/api/shops/route.ts`**: Returns shops filtered by coordinates (Haversine distance) or ID.
- **`app/api/stock/route.ts`**: Returns stock ledger entries.
- **`app/api/transactions/route.ts`**: Logs e-POS sales and triggers multi-member household SMS broadcasting.
- **`app/api/deliveries/route.ts`**: Logs scale receipts and detects weight variance.
- **`app/api/confirmations/route.ts`**: Records citizen crowd verification for past purchases.
- **`app/api/reconciliation/route.ts`**: Calculates ledger reconciliation and triggers month-end closing carry-forward.
- **`app/api/anomaly/route.ts`**: Evaluates the 3-signal trust engine ($S_1, S_2, S_3$) across all shops.
- **`app/api/sms/route.ts`**: Returns the multi-member household SMS broadcast outbox.
- **`app/api/analytics/route.ts`**: Generates statewide analytics, focus taluks, top buyers, and demand forecasts.

---

## 4. Click-by-Click Operational Flow & Governance Impact

### Flow 1: Citizen Login & Stock Visibility (`/login` & `/customer`)
1. **Click `/login` Preset ("Rajan Pillai")**: Autofills Card ID `card-KL048821` and linked phone `+91 98765 43210`.
2. **Click "Request OTP"**: Displays simulated OTP `1234`.
3. **Click "Verify & Enter Portal"**: Establishes session cookie and routes to `/customer`.
4. **Select Locality (e.g. "Kaloor", "Fort Kochi")**: Instant Haversine distance recalculation to nearby Fair Price Shops with real-time stock badges.
5. **Click "Notify Me When Available"**:
   - Executes `recordUnfulfilledRequest(shop_id, commodity_id)`.
   - Subscribes the household to SMS arrival alerts when grain arrives at the shop scale.
6. **Click "Confirm Purchase" / "Flag Discrepancy"**:
   - Citizen confirms or disputes historical transactions.
   - Feeds directly into Signal $S_2$ of the anti-leakage engine.

### Flow 2: 3-Tier Supply Chain Approval Pipeline
1. **Government Directive Issuance (`/gov`)**:
   - Official clicks **"Issue Allocation Directive"**.
   - Selects target shop (`shop-402`), commodity (`comm-matta`), quantity (`500 kg`), and rationale.
   - Clicks **"Transmit Allocation Directive to TSO"**.
   - Creates order with status `gov_directive` in `/api/supply-orders`.
2. **Taluk Supply Officer Approval & Dispatch (`/supplier`)**:
   - TSO navigates to the **Supply Chain Approvals** panel.
   - Clicks **"Approve Allocation"** $\to$ transitions status to `supplier_approved`.
   - Clicks **"Mark In Transit"** $\to$ transitions status to `in_transit` with lorry dispatch note.
3. **FPS Dealer Electronic Scale Weighing (`/seller`)**:
   - Dealer views incoming consignment on `/seller`.
   - Consignment shows `in_transit`.
   - Dealer clicks **"Weigh & Receive (Scale)"** $\to$ transitions status to `shop_received`.
4. **Civil Supplies Inspector Final Sign-Off (`/seller`)**:
   - On-site inspector inspects physical inventory and clicks **"Staff Final Sign-Off"**.
   - Transitions status to `staff_approved`.
   - Permanently updates the official ledger and locks the receipt.

### Flow 3: Inline Stock Ledger Editing (`/seller`)
1. **Locate Stock Row** (e.g. Matta Rice):
   - Hover over `opening`, `received`, `sold`, or `closing` to reveal edit pencil.
2. **Click Value**: Cell transforms into an active number input.
3. **Enter New Value & Press Enter**:
   - Dispatches `PATCH /api/stock/[shop_id]/[commodity_id]`.
   - Automatically recalculates $Closing = Opening + Received - Sold$.
   - Automatically triggers `recomputeAnomaly()`.
   - Pressing **Esc** cancels the edit without mutation.

### Flow 4: Government AI Control Panel (`/gov`)
1. **Switch LLM Provider**:
   - Official selects between `openai-compatible` (xAI Grok / OpenAI), `anthropic`, `google`, `ollama` (local edge), or `custom`.
2. **Adjust Model & Base URL**:
   - Input model name (e.g. `grok-2-latest`, `claude-3-5-sonnet`, `gemini-1.5-pro`).
3. **Rotate API Key**:
   - Enter new API key and click **"Apply Configuration"**. Securely updates without exposing secrets in logs.
4. **Click "Test Ping & Latency"**:
   - Executes live network round-trip ping to the configured model.
   - Displays live latency badge (e.g. `Latency: 142 ms`).
5. **Inspect Live Audit Logs**:
   - Real-time stream of all AI reasoning calls, caller roles, latencies, and execution statuses.

### Flow 5: Multi-Signal Anti-Leakage Detection (`/gov`)
1. **Open Anomaly Heatmap**:
   - Color-coded shop cards displaying Trust Score ($0.00 - 1.00$).
   - Flags shops with Trust Score $< 0.70$ (e.g. Kaloor FPS #402 at $\sim 0.34$).
2. **Click Flagged Shop for Plain-Language Audit**:
   - Explains the exact mathematical reasons:
     - **Signal $S_1$ (Scale Shortfall)**: 15% discrepancy between dispatched and weighed grain.
     - **Signal $S_2$ (Citizen Dispute)**: 40% of cardholders flagged unreceived transactions.
     - **Signal $S_3$ (Transaction Velocity)**: Abnormal transactions conducted outside business hours.
3. **Click "Run Month-End Carryover Job"**:
   - Executes $Opening_{M+1} \equiv (Opening_M + Received_M) - Sold_M$.
   - Automatically rolls balances forward into October 2026, eliminating book doctoring.

---

## 5. How AriZon Revolutionizes Kerala Governance

| Traditional PDS Problem in Kerala | The AriZon Revolution | Governance Impact |
| :--- | :--- | :--- |
| **Silent Biometric Misuse** | Multi-member household SMS broadcasting alerts all family members simultaneously. | 85 lakh families become decentralized anti-diversion watchdogs. |
| **Transit Siphoning** | 3-tier approval with e-Balance scale verification flags discrepancies $>5\%$. | Plugs the estimated ₹350+ Cr annual diversion leakage. |
| **Futile Travel for Low-Income Citizens** | Real-time stock status + "Notify Me" arrival SMS. | Saves an estimated 4-6 hours of travel and lost daily wages per household per month. |
| **Manual Book Reconciliations** | Automated monthly mathematical roll-forward ($Opening_{M+1} \equiv Closing_M$). | Eliminates book manipulation and retrospective register doctoring. |
| **Vendor Lock-in for State AI** | Pluggable Government AI Control Panel supporting Grok, Gemini, Claude, and sovereign on-premise models. | Total technological sovereignty for Kerala State IT Mission & NIC. |

---

## 6. How to Run & Verify

### Build Verification
```powershell
npm run build
```
Builds 100% cleanly with zero TypeScript errors.

### Start Production Server
```powershell
npm run start
```
Available at `http://localhost:3000`.

---

*AriZon — Built for Kerala Civil Supplies & Consumer Affairs Department • Hackathon 2026 Prototype.*

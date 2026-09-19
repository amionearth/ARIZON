# SMART PDS (Arizon) — DEEP OPERATIONAL & ARCHITECTURAL SPECIFICATION

> **Kerala State Civil Supplies & Consumer Affairs Department**  
> **Arizon Hackathon Prototype — Production-Grade Specification Document**  
> *A Unified AI-Agent-Driven PDS Stock Visibility, Anti-Leakage, and Predictive Supply Optimization Platform*

---

## 1. Executive Summary & The Problem It Revolutionizes

### The Ground Truth in Kerala
- **14,200+ Fair Price Shops (Ration Shops)** across 14 districts have been operating e-POS (Electronic Point of Sale) biometric machines since 2018.
- The state is integrating e-POS with **e-Balance** electronic weighing scales so that physically delivered and sold weights are recorded digitally on `epos.kerala.gov.in`.
- Despite high technological adoption, **national PDS grain diversion historically reached 40%–50%**, with recent audits continuing to show approximately **28% of allocated foodgrains failing to reach genuine beneficiaries**.
- Biometrics alone cannot eliminate leakage because:
  1. Dealers can conduct false sales under a cardholder's biometric authentication when the citizen is unaware.
  2. Warehouse-to-shop transit diversions occur before grain ever reaches the shop scale.
  3. Citizens travel miles to fair price shops only to find essential grains (Matta Rice, Kuruva Rice, Sugar, Wheat) out of stock, leading to frustration and lost daily wages.

### The Arizon Solution
Instead of developing four disconnected, siloed admin panels that require constant manual cross-checking, **Arizon places a single, role-scoped AI reasoning engine (powered by Grok-2 / xAI) at the operational center**.

The platform provides:
1. **Live SKU-Level Stock Visibility**: Citizens verify nearby stock before stepping out of their homes.
2. **Citizen Stockout Alerts ("Notify Me")**: Households register interest for out-of-stock items; the system logs unfulfilled demand and automatically alerts all registered family members the second grain is weighed at the shop scale.
3. **Multi-Member Household SMS Broadcast**: Every purchase triggers an instantaneous SMS alert to **every Aadhaar-linked family member registered on the card** (not just the buyer), turning the entire family into an anti-diversion sentinel.
4. **Multi-Signal Anti-Leakage Trust Engine**: Cross-checks three independent vectors ($S_1$ weighing scale weight, $S_2$ citizen confirmations, $S_3$ biometric velocity) to generate trust scores and plain-language audit explanations for Civil Supplies officers.
5. **Automated Month-End Stock Reconciliation**: Automatically executes `Closing = (Opening + Received) - Sold`, carries closing stock into next month's opening balance, and eliminates book fraud.
6. **Bilingual Accessibility (English & മലയാളം)**: Democratizes access for elderly and low-literacy citizens through conversational voice and text AI.

---

## 2. System Architecture: The Unified AI Core

```
 [Customer (/customer)]   [Seller (/seller)]   [Supplier (/supplier)]   [Gov (/gov)]
            \                      |                      |                     /
             \_____________________|______________________|____________________/
                                           |
                              Unified Navigation & Auth Gate
                                           |
                                Central AI Agent Engine
                         (Role-Scoped Function Calling: Grok-2)
                         /                 |                 \
          PostgreSQL DB              SMS Gateway          e-POS / Scale Feed
    (Ledger, Confirmations)     (Multi-Member Fan-out)   (Biometric & Weight)
```

### Role-Scoped Tool Execution Matrix
The central agent dynamically verifies the caller's role before executing any tool function:

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
- **`package.json`**: Defines project dependencies including `next@16.3.5`, `react@19.2.8`, `@ai-sdk/openai`, `ai`, `@supabase/supabase-js`, `lucide-react`, `recharts`, `tailwindcss@4`.
- **`tsconfig.json`**: TypeScript configuration with path alias `@/*` mapped to `./*`.
- **`working.md`**: Complete architectural, operational, and impact documentation (this document).
- **`README.md`**: Quickstart guide and positioning summary.

---

### `supabase/` (Database Layer)
- **`supabase/schema.sql`**:
  - Contains PostgreSQL DDL for 11 relational tables:
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
  - Contains comprehensive seed data for Kerala districts: **Ernakulam** (Kaloor FPS #402, Fort Kochi FPS #114, Palarivattom FPS #308, Aluva FPS #501, Thrippunithura FPS #215) and **Thiruvananthapuram** (Kazhakkoottam FPS #012).

---

### `lib/` (Core Logic & Infrastructure)
- **`lib/types.ts`**:
  - TypeScript interfaces for all database rows, tool payloads, and API returns (`Shop`, `Commodity`, `RationCard`, `CardMember`, `Transaction`, `Delivery`, `StockLedgerRow`, `UnfulfilledRequest`, `AnomalyDetectionResult`, `SupplyOptimizationResult`, `ReconciliationResult`).
- **`lib/data.ts`**:
  - The unified data store and state management engine (`PdsDataStore`).
  - Holds an active in-memory Kerala dataset that allows live mutations (sales deduction, delivery receipts, SMS fan-out, confirmations, reconciliation carry-forward).
  - Guarantees 100% demo reliability without external database connection failures on judge laptops while mirroring Supabase schema.
  - Implements the Haversine formula for GPS distance calculation.
  - Implements `validateCardAndPhone(cardId, phone)` for password-less citizen login.
- **`lib/ai.ts`**:
  - Configures the Grok AI provider using `@ai-sdk/openai` targeting `https://api.x.ai/v1` with model `grok-2-latest`.
  - Implements `isGrokConfigured` flag checking `GROK_API_KEY`.
- **`lib/tools.ts`**:
  - Implements all 12 callable tools with typed arguments and Zod schemas for Grok function-calling.
  - Implements `ROLE_TOOL_PERMISSIONS` and `getRoleScopedTools(role)`.
- **`lib/translations.ts`**:
  - English and Malayalam (`മലയാളം`) localization dictionary covering every label, heading, badge, button, and prompt.
- **`lib/supabase.ts`**:
  - Supabase client initialized via `@supabase/supabase-js`.

---

### `components/` (Shared UI Components)
- **`components/Navbar.tsx`**:
  - Official Government of Kerala strip with department logo and live e-POS status pulse.
  - Dynamic navigation links (`/`, `/login`, `/customer`, `/seller`, `/supplier`, `/gov`) with active path highlighting.
  - Language toggle button (`English` / `മലയാളം`).
- **`components/StockBadge.tsx`**:
  - Visual status indicator pill:
    - **`IN STOCK`** (Emerald green, pulsing dot)
    - **`LOW STOCK`** (Amber yellow)
    - **`OUT OF STOCK`** (Rose red)
  - Supports bilingual text and displays exact closing stock quantity with units.
- **`components/AgentChat.tsx`**:
  - Reusable role-scoped Grok AI conversational widget.
  - Displays authorized tool badges (e.g. `get_stock()`, `get_nearby_shops()`).
  - Shows executed tool call chips with arguments in real time.
  - Features quick-action preset buttons in English and Malayalam for instant hackathon demonstrations.

---

### `app/actions/` (Next.js Server Actions)
- **`app/actions/auth.ts`**:
  - `requestOTP(cardId, phone)`: Validates that the entered phone number matches an Aadhaar-linked member under the given 10-digit Ration Card in the Civil Supplies database. Returns success message with mock OTP instructions.
  - `verifyOTP(cardId, otp)`: Checks mock OTP (`1234`). On match, uses Next.js `cookies()` to set an encrypted, HTTP-only cookie named `pds_session` containing the card ID (valid for 7 days).
  - `logout()`: Clears the `pds_session` cookie.
  - `getSessionCardId()`: Server-side helper that reads the logged-in cardholder ID from cookies.
- **`app/actions/notify.ts`**:
  - `recordUnfulfilledRequest(shopId, commodityId)`: Reads the authenticated card ID from the `pds_session` cookie and records an unfulfilled demand entry in the database with status `pending`. Returns subscription confirmation.

---

### `app/api/` (Deterministic REST API Gateways)
- **`app/api/chat/route.ts`**:
  - Central POST route for role-scoped AI conversations.
  - Enforces role boundaries. If Grok API key is present, calls Grok-2 tool-calling; if running offline, invokes the intelligent local tool-runner with exact context and Malayalam/English answers.
- **`app/api/shops/route.ts`**:
  - GET endpoint returning shop details, live stock, or nearby shops based on `lat`, `lon`, and `commodity_id`.
- **`app/api/deliveries/route.ts`**:
  - GET: Lists deliveries.
  - POST: Logs delivery, verifies e-Balance scale weight against warehouse dispatch, flags mismatches $>5\%$, auto-increments stock ledger, and triggers SMS arrival alerts to waiting cardholders.
- **`app/api/transactions/route.ts`**:
  - GET: Retrieves purchase history and confirmation status for a ration card or shop.
  - POST: Simulates biometric e-POS sale, auto-deducts stock balance, and broadcasts SMS alerts to all family members.
- **`app/api/reconciliation/route.ts`**:
  - GET: Returns the state-wide reconciliation matrix for all shops.
  - POST: Executes the month-end automated carry-forward worker (`Closing` rolled into next month's `Opening`).
- **`app/api/anomaly/route.ts`**:
  - GET: Runs multi-signal anomaly evaluations across all shops and returns trust scores with plain-language audit explanations.
- **`app/api/sms/route.ts`**:
  - GET: Returns the live SMS outbox showing all dispatched family messages.
  - POST: Test SMS trigger.
- **`app/api/confirmations/route.ts`**:
  - POST: Records citizen confirmation (`true`) or dispute/ghost-claim flag (`false`).
- **`app/api/subscribe/route.ts`**:
  - POST: Registers citizen notification request for out-of-stock items.

---

### `app/` (Stakeholder Web Pages)
- **`app/page.tsx` (`/`)**:
  - Government of Kerala landing page.
  - Live system stats (14,200+ shops, e-Balance integration, 100% family SMS reach, 3-signal trust engine).
  - 4 Stakeholder Portal launcher cards.
  - Architecture breakdown explaining the single AI core.
  - Multi-Signal Anti-Leakage technical breakdown.
- **`app/login/page.tsx` (`/login`)**:
  - Mobile-first, rural-accessible login interface for citizens.
  - Input fields for 10-Digit Ration Card ID and Registered Mobile Number.
  - 1-click autofill demo presets for judges (Rajan Pillai / Mary Thomas).
  - Mock OTP verification (`1234`) setting HTTP-only `pds_session` cookie.
- **`app/customer/page.tsx` (`/customer`)**:
  - Citizen hub for finding nearby stock, subscribing for stockout alerts, viewing entitlements, and confirming transactions.
- **`app/seller/page.tsx` (`/seller`)**:
  - Fair Price Shop dealer day-to-day dashboard with live ledger, e-Balance verification, and e-POS biometric simulator.
- **`app/supplier/page.tsx` (`/supplier`)**:
  - Taluk Supply Officer godown dashboard with demand aggregation, dispatch tracking, Grok supply optimizer, and demand forecast charts.
- **`app/gov/page.tsx` (`/gov`)**:
  - Civil Supplies Directorate oversight portal with reconciliation matrix, anomaly heatmap, audit inspector, and live SMS outbox.

---

## 4. Deep Walkthrough: What Each Click, Button & Function Does

### A. Citizen Password-Less Login Flow (`/login`)

```
[Enter Card ID & Phone] ──► [Click 'Request OTP'] ──► Server checks ration_cards + card_members
                                                            │
                                                     (Match Found)
                                                            ▼
[Enter OTP '1234'] ─────► [Click 'Verify & Enter'] ──► Sets HTTP-only 'pds_session' cookie
                                                            │
                                                            ▼
                                                Redirects to /customer
```

1. **"Quick Autofill Demo Cards" Click**:
   - Clicking **"Rajan Pillai (card-KL048821)"** immediately populates Card ID `card-KL048821` and Phone `+919876543210`.
   - Clicking **"Mary Thomas (card-KL041234)"** immediately populates Card ID `card-KL041234` and Phone `+919876500001`.
2. **"Request OTP" Button Click**:
   - Triggers `requestOTP(cardId, phone)` server action in `app/actions/auth.ts`.
   - Queries `PdsDataStore.validateCardAndPhone`.
   - Validates that the phone number is genuinely registered under that ration card.
   - Transitions UI from State 1 to State 2, displaying the beneficiary's name and prompt to enter `1234`.
3. **"Verify & Enter Portal" Button Click**:
   - Triggers `verifyOTP(cardId, otp)` server action.
   - Verifies OTP `1234`.
   - Sets secure cookie `pds_session = card-KL048821` (HTTP-only, Lax, 7-day expiration).
   - Smoothly redirects the user to `/customer`.

---

### B. Customer Portal (`/customer`)

1. **Locality Filter Buttons ("Kaloor", "Fort Kochi", "Palarivattom", "Kazhakkoottam")**:
   - Updates `lat` and `lon` states in React.
   - Calls `GET /api/shops?lat=...&lon=...`.
   - The backend runs the **Haversine formula** to calculate distance in kilometers and dynamically loads the live stock ledger of the closest shops.
2. **Search Input & Commodity Dropdown**:
   - Allows instant client-side filtering by shop name, taluk, or commodity type.
3. **"Notify Me When Available" Button Click**:
   - Located on any item that is `LOW_STOCK` or `OUT_OF_STOCK` (e.g. Fortified Sugar at Kaloor FPS #402).
   - Executes `recordUnfulfilledRequest(shopId, commodityId)` server action in `app/actions/notify.ts`.
   - Extracts the authenticated `card_id` from the `pds_session` cookie.
   - Inserts a row into `unfulfilled_requests` with `status = 'pending'`.
   - Updates button to `"Subscribed to SMS Alert"`.
   - Shows banner: *"Subscribed! All registered family members under Card #KL-04-8821 will receive an SMS arrival alert when Fortified Sugar is weighed at the shop."*
4. **"Confirm Purchase" Button Click**:
   - Triggers `POST /api/confirmations` with `{ transaction_id, confirmed: true }`.
   - Flags the biometric purchase as authenticated by the household.
   - Increases the shop's Citizen Confirmation Ratio ($S_2$), boosting its Anti-Leakage Trust Score.
5. **"Flag Unrecognized / Ghost Transaction" Button Click**:
   - Triggers `POST /api/confirmations` with `{ transaction_id, confirmed: false }`.
   - Flags the transaction as an unauthorized ghost claim.
   - Drops the shop's Trust Score below 0.70 and creates an immediate audit flag on the Government Dashboard.
6. **"Logout / Change" Button Click**:
   - Calls `logout()` server action, destroys the `pds_session` cookie, and redirects to `/login`.
7. **Citizen Grok AI Assistant**:
   - Typing or clicking preset queries like *"കലൂരിൽ മട്ട അരി ലഭ്യമാണോ?"* triggers `POST /api/chat`.
   - Grok executes `get_nearby_shops(lat: 9.9886, lon: 76.2905, commodity_id: 'comm-matta')`.
   - Returns a polite response in Malayalam informing the cardholder that 350 kg is in stock at Kaloor FPS #402 and 520 kg at Fort Kochi FPS #114.

---

### C. Seller / FPS Dealer Portal (`/seller`)

1. **"Selected FPS Shop" Dropdown**:
   - Switches active dealer view between Kaloor FPS #402, Fort Kochi FPS #114, Palarivattom FPS #308, and Kazhakkoottam FPS #012.
   - Instantly re-queries `GET /api/shops?shop_id=...` to load that shop's specific ledger.
2. **"Verify Scale Weight & Update Stock" Form Submission (e-Balance Verification)**:
   - Dealer inputs:
     - Commodity (e.g. Matta Rice)
     - Warehouse Dispatched Qty (e.g. 1,000 kg from challan)
     - Scale Weighed Qty (e.g. 850 kg on electronic scale)
   - Triggers `POST /api/deliveries`.
   - Computes weight discrepancy: $\Delta_{weight} = |1000 - 850| / 1000 = 15.0\%$.
   - Since $15.0\% > 5.0\%$, the system flags `mismatch_flag: true`.
   - Displays prominent red alert: *"Scale Mismatch Detected (15% Shortfall)! Anomaly logged for Taluk audit."*
   - Automatically increments `received` and `closing` balance by the **actual weighed physical amount** (850 kg), ensuring ghost weight is not entered into the ledger.
   - Checks `unfulfilled_requests` for this commodity at this shop. If waiting subscribers exist, it triggers `send_sms()` to every family member, updating their status to `'notified'`.
3. **"Process Biometric Sale & Broadcast SMS" Form Submission (e-POS Simulator)**:
   - Dealer enters Card ID, Item, and Quantity (e.g. 10 kg Matta Rice).
   - Triggers `POST /api/transactions`.
   - Automatically deducts 10 kg from the shop's closing stock in `stock_ledger`.
   - Calls `send_sms(card_id, message, all_members=true)`.
   - Queries `card_members` for all phone numbers associated with that card.
   - Dispatches individual SMS alerts to all family members:
     > *"Govt of Kerala PDS: 10kg Matta Rice purchased under Card #KL-04-8821 at Kaloor FPS #402 on 18/09/2026. If you did not make this purchase, reply NO."*
   - Returns confirmation showing the transaction ID, new closing stock, and recipient count (3 family members).
4. **"Fallback Manual Stock Adjustment" Form Submission**:
   - In cases of spillage or bag tearing, allows manual balance correction.
   - Requires an explanatory audit note (`source="dealer_fallback"`), logged to the state audit trail.
5. **"Grok AI Business & Inventory Consultant"**:
   - Dealer asks: *"How much rice do I have left?"* or *"Analyze my burn rate"*.
   - Grok executes `get_stock` and `grok_seller_consultant`.
   - Analyzes daily sales velocity and advises: *"You have 338 kg of Matta Rice left. At your average burn rate of 42 kg/day, stock will be exhausted in 8 days. Request 400 kg from Kanayannur Taluk Godown."*

---

### D. Supplier / Taluk Godown Portal (`/supplier`)

1. **"Taluk Godown" Selector**:
   - Filters between Kanayannur, Fort Kochi, Aluva, and TVM Taluks.
2. **"Run AI Optimization Matrix" Button Click**:
   - Triggers `POST /api/chat` with role `'supplier'`.
   - Grok executes `grok_optimize_supply(taluk_or_district: 'Kanayannur')`.
   - Aggregates current closing stock and all pending citizen stockout requests (`unfulfilled_requests`).
   - Generates priority allocation vectors:
     - **Kaloor FPS #402 (Sugar)**: Priority `CRITICAL`, Allocate `+210 kg` (Zero stock balance, 2 households waiting).
     - **Palarivattom FPS #308 (Kerosene)**: Priority `CRITICAL`, Allocate `+150 L`.
     - **Kaloor FPS #402 (Wheat)**: Priority `MODERATE`, Allocate `+180 kg` (Low buffer, 30 kg remaining).
3. **Dispatch Schedule & Scale Verification Status Table**:
   - Displays historical consignments sent to shops.
   - Highlights consignments in green (`VERIFIED AT SCALE`) or red (`MISMATCH FLAGGED`) based on IoT scale readings.
4. **3-Month Commodity Demand Forecast Chart (Recharts)**:
   - Visualizes current vs forecasted demand for Matta Rice, Kuruva Rice, Wheat, Sugar, and Kerosene incorporating seasonal festival multipliers and citizen demand spikes.

---

### E. Government Directorate & Oversight Portal (`/gov`)

1. **"Multi-Signal Anti-Leakage & Anomaly Heatmap"**:
   - Visualizes all fair price shops color-coded by their Multi-Signal Trust Score:
     - **Green ($\ge 0.85$)**: Normal operations (Fort Kochi FPS #114, Kazhakkoottam FPS #012).
     - **Red ($< 0.70$)**: Critical Leakage Alert (**Kaloor FPS #402, Trust Score: 0.34 / 1.0**).
2. **"Inspect" Shop Anomaly Click**:
   - Selecting **Kaloor FPS #402** renders the Plain-Language AI Audit Inspector:
     > **Audit Flag (Kaloor FPS #402): Trust Score: 0.34 / 1.0.**  
     > *Critical alerts: Warehouse dispatched 1,200 kg across recent consignments, but electronic scale logged only 850 kg (15% physical shortfall). Additionally, 45% of transactions conducted between 18:00–20:00 received zero citizen confirmation responses, indicating possible ghost biometric claims. Immediate Taluk vigilance recommended.*
3. **"State-Wide Stock Reconciliation Matrix"**:
   - Tabulates every shop's stock equation:
     $$\text{Calculated Closing} = (\text{Opening} + \text{Weighed Received}) - \text{e-POS Sold}$$
   - Compares Calculated Closing against Recorded Closing.
   - Discrepancies $> 5\text{ kg}$ are highlighted with red `SHORTFALL` badges.
4. **"Run Month-End Carryover Job" Button Click**:
   - Triggers `POST /api/reconciliation`.
   - Executes `PdsDataStore.executeMonthEndReconciliationJob('2026-09')`.
   - Computes the audited closing balance for all 20 commodity ledgers across all shops.
   - Carries the closing balance forward into next month's opening balance (`2026-10`).
   - Displays toast: *"Month-End Reconciliation Run Complete! 20 commodity ledgers carried forward from 2026-09 into opening balance of 2026-10."*
5. **"Export Audit Report" Button Click**:
   - Triggers `POST /api/chat` with role `'gov'`.
   - Grok invokes `generate_report` and generates an executive memorandum summarizing state-wide discrepancies, citizen confirmation ratios, and taluk enforcement actions.
6. **"Live Multi-Member Household SMS Broadcast Outbox" Table**:
   - Displays real-time entries in `sms_outbox`.
   - Proves household reach by showing multiple phone numbers receiving individual SMS alerts for the same ration card transaction (e.g. Rajan Pillai, Suma Rajan, Arjun Rajan).
   - Displays carrier header (`GOVKER-PDS`) and delivery status.

---

## 5. How This Solves, Improves, and Revolutionizes Kerala Governance

```
 Traditional PDS Vulnerabilities              Arizon AI-Driven Revolution
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│ • Single biometric point of failure  │ ──► │ • 3-Signal Trust Engine (Hardware +  │
│   (Dealers swipe cards in secret)    │     │   Crowd SMS + Biometrics)            │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ • Citizens travel in vain to shops   │ ──► │ • Live SKU Stock Finder + "Notify Me"│
│   finding items out of stock         │     │   SMS Arrival Broadcast              │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ • Only 1 person receives SMS alerts  │ ──► │ • Multi-Member Household Fan-out     │
│   (often missed or dealer-controlled)│     │   (All Aadhaar-linked numbers alerted)│
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ • Manual paper ledger reconciliation │ ──► │ • Automated Closing Carry-Forward    │
│   (discrepancies hidden at month end)│     │   (Zero-book-fraud equation)         │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ • Grain allocation by guesswork      │ ──► │ • Grok AI Supply Optimizer           │
│   (godowns over/under supply shops)  │     │   (Citizen backlog + burn-rate vector│
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

### 1. Eliminating the Documented 28%+ Grain Diversion
In traditional setups, once grain leaves the taluk godown, dealers can claim that full weight arrived, while physically diverting 10%–20% of the consignment to the open market (black market). By enforcing **e-Balance electronic scale entry ($S_1$)**, discrepancies between dispatched weight and received weight are flagged instantly before the grain can be sold.

### 2. Neutralizing Ghost Biometric Claims
Ration shop dealers have historically utilized cardholders' biometrics under false pretenses or during system updates. Because Arizon broadcasts an SMS receipt to **every registered family member on the card ($S_2$)**, any unauthorized biometric sale is immediately flagged by the household with a 1-click dispute on their phone, dropping the dealer's Trust Score below 0.70.

### 3. Ending Wasted Travel for Rural Citizens
Rural citizens often lose half a day's wages traveling to distant shops only to discover that sugar or kerosene has run out. With the **Nearby Shop Stock Finder** and **"Notify Me When Available"** engine, households receive an automated SMS the instant a fresh delivery is weighed on the shop scale, guaranteeing item availability.

### 4. Replacing Spreadsheets with Grok AI Supply Vectors
Instead of taluk supply officers manually guessing monthly quotas on Excel spreadsheets, the **Grok AI Supply Optimizer** calculates the exact allocation vector for each shop based on unfulfilled citizen demand and monthly disbursement rates, ending artificial scarcity.

### 5. Automated Month-End Anti-Fraud Carryover
Dealers often conceal missing inventory by arbitrarily rewriting opening balances on new month registers. Arizon's automated reconciliation engine strictly enforces:
$$\text{Opening Balance}_{M+1} \equiv (\text{Opening}_{M} + \text{Weighed Received}_{M}) - \text{e-POS Sold}_{M}$$
preventing unrecorded book corrections.

---

## 6. How to Run & Demonstrate the Application

### 1. Start the Production Server
```powershell
npm run build
npm run start
```
Or start in development mode:
```powershell
npm run dev
```
Open **`http://localhost:3000`** in any web browser.

### 2. Suggested 5-Minute Judge Demonstration Script
1. **Homepage (`/`)**:
   - Showcase the Kerala Government branding and explain the unified architecture (one AI core, 4 roles).
   - Toggle language between English and **മലയാളം** in the top navigation bar.
2. **Citizen Login & Customer Portal (`/login` & `/customer`)**:
   - Go to `/login`, click the **"Rajan Pillai"** autofill preset.
   - Click **"Request OTP"**, enter demo OTP **`1234`**, and click **"Verify & Enter Portal"**.
   - On `/customer`, show the nearby shop stock list with distances and SKU availability badges.
   - Click **"Notify Me When Available"** on Fortified Sugar at Kaloor FPS #402. Notice the confirmation alert!
   - Under purchase history, click **"Confirm Purchase"** on a past transaction to show crowd verification.
   - Open the Grok AI chat and type: *"കലൂരിൽ മട്ട അരി ലഭ്യമാണോ?"* to demonstrate bilingual tool calling.
3. **Seller Portal (`/seller`)**:
   - Switch to `/seller`.
   - In the **Goods Received** form, enter `1000 kg` dispatched and `850 kg` weighed. Click submit. Notice the **red 15% shortfall mismatch alert**, the ledger update, and the automatic SMS notification sent to the waiting subscriber!
   - In the **e-POS Simulator**, click **"Process Biometric Sale & Broadcast SMS"**. Observe the stock decrement and the multi-member SMS broadcast receipt.
4. **Supplier Portal (`/supplier`)**:
   - Switch to `/supplier`.
   - Click **"Run AI Optimization Matrix"** to watch Grok calculate priority dispatch vectors for Kanayannur taluk.
   - View the 3-month demand forecast chart.
5. **Government Directorate Portal (`/gov`)**:
   - Switch to `/gov`.
   - Inspect the **Multi-Signal Heatmap**: point out **Kaloor FPS #402** flagged in red (Trust Score ~0.34).
   - Click on Kaloor FPS #402 to read the **plain-language audit explanation** (scale shortfall + citizen confirmation drop).
   - View the **Live SMS Outbox** table to prove that all 3 family members on Card `#card-KL048821` received individual SMS alerts.
   - Click **"Run Month-End Carryover Job"** to demonstrate automated closing balance roll-forward into the next monthly cycle.

---

*Document generated for the Kerala State Civil Supplies Department • Arizon Smart PDS Hackathon.*

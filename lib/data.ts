// lib/data.ts -- In-memory PDS data store for hackathon demo.
// Mirrors the Supabase schema but works 100% offline on any laptop,
// which guarantees demo reliability even when judge laptops have
// no internet.

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type Role = 'customer' | 'seller' | 'supplier' | 'gov';

export interface Shop {
  id: string;
  name: string;
  district: string;
  taluk: string;
  lat: number;
  lon: number;
}
export interface Commodity {
  id: string;
  name: string;
  unit: string;
}
export interface RationCard {
  id: string;
  shop_id: string;
  category: string;
}
export interface CardMember {
  id: string;
  card_id: string;
  name: string;
  phone_number: string;
}
export interface Transaction {
  id: string;
  card_id: string;
  shop_id: string;
  commodity_id: string;
  qty: number;
  timestamp: string;
  source: string;
}
export interface Delivery {
  id: string;
  shop_id: string;
  commodity_id: string;
  dispatched_qty: number;
  weighed_qty: number;
  timestamp: string;
}
export interface Confirmation {
  id: string;
  transaction_id: string;
  confirmed: boolean;
  timestamp: string;
}
export interface StockLedgerRow {
  id: number;
  shop_id: string;
  commodity_id: string;
  period: string;
  opening: number;
  received: number;
  sold: number;
  closing: number;
}
export interface AnomalyFlag {
  id: number;
  shop_id: string;
  period: string;
  trust_score: number;
  reasoning: string;
  created_at: string;
  signals_used: {
    weight_variance_pct: number;
    citizen_confirmation_ratio: number;
    transaction_velocity_score: number;
  };
  is_flagged: boolean;
}
export interface Forecast {
  id: number;
  shop_id: string;
  commodity_id: string;
  period: string;
  predicted_qty: number;
  basis: string;
}
export interface Subscription {
  id: number;
  card_id: string;
  shop_id: string;
  commodity_id: string;
  created_at: string;
}
export interface SmsOutbox {
  id: number;
  card_id: string;
  phone_number: string;
  message: string;
  sent_at: string;
  kind?: 'sale' | 'arrival' | 'shortfall';
}
export interface UnfulfilledRequest {
  id: number;
  card_id: string;
  shop_id: string;
  commodity_id: string;
  status: string;
  requested_at: string;
}
export interface ShortageNotice {
  id: number;
  card_id: string;
  shop_id: string;
  commodity_id: string;
  qty_requested: number;
  qty_provided: number;
  timestamp: string;
}

/**
 * Multi-stage supply chain approval: the State Civil Supplies Directorate
 * (gov) issues an allocation directive to the Taluk Supply Officer
 * (supplier); the supplier approves and dispatches; the FPS dealer (seller)
 * receives at the e-Balance scale; finally the on-site ration shop staff
 * acknowledges the receipt. Each transition is appended to `approvals`.
 */
export type SupplyOrderStatus =
  | 'gov_directive'
  | 'supplier_approved'
  | 'in_transit'
  | 'shop_received'
  | 'staff_approved'
  | 'rejected'
  | 'cancelled';

export interface SupplyOrderApproval {
  stage: SupplyOrderStatus;
  actor: string;
  at: string;
  note?: string;
}

export interface SupplyOrder {
  id: string;
  shop_id: string;
  shop_name?: string;
  district?: string;
  taluk?: string;
  commodity_id: string;
  commodity_name?: string;
  period: string;
  allocated_qty: number;
  rationale?: string;
  created_by: string;
  created_at: string;
  status: SupplyOrderStatus;
  approvals: SupplyOrderApproval[];
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function stockStatus(closing: number): StockStatus {
  if (closing <= 0) return 'OUT_OF_STOCK';
  if (closing < 60) return 'LOW_STOCK';
  return 'IN_STOCK';
}

class PdsDataStore {
  shops: Shop[] = [
    { id: 'shop-402', name: 'Kaloor Fair Price Shop #402', district: 'Ernakulam', taluk: 'Kanayannur', lat: 9.988661, lon: 76.290598 },
    { id: 'shop-114', name: 'Fort Kochi Fair Price Shop #114', district: 'Ernakulam', taluk: 'Fort Kochi', lat: 9.963100, lon: 76.242520 },
    { id: 'shop-308', name: 'Palarivattom Fair Price Shop #308', district: 'Ernakulam', taluk: 'Kanayannur', lat: 10.001700, lon: 76.308300 },
    { id: 'shop-012', name: 'Kazhakkoottam Fair Price Shop #012', district: 'Thiruvananthapuram', taluk: 'Thiruvananthapuram', lat: 8.572100, lon: 76.876900 },
    { id: 'shop-501', name: 'Aluva Fair Price Shop #501', district: 'Ernakulam', taluk: 'Aluva', lat: 10.100600, lon: 76.357400 },
    { id: 'shop-215', name: 'Thrippunithura Fair Price Shop #215', district: 'Ernakulam', taluk: 'Kanayannur', lat: 9.945300, lon: 76.351900 },
  ];
  commodities: Commodity[] = [
    { id: 'comm-matta', name: 'Matta Rice', unit: 'kg' },
    { id: 'comm-kuruva', name: 'Kuruva Rice', unit: 'kg' },
    { id: 'comm-wheat', name: 'Wheat', unit: 'kg' },
    { id: 'comm-sugar', name: 'Fortified Sugar', unit: 'kg' },
    { id: 'comm-kerosene', name: 'Kerosene', unit: 'liter' },
  ];
  rationCards: RationCard[] = [
    { id: 'card-KL048821', shop_id: 'shop-402', category: 'PHH' },
    { id: 'card-KL041234', shop_id: 'shop-402', category: 'AAY' },
    { id: 'card-KL115566', shop_id: 'shop-114', category: 'PHH' },
    { id: 'card-KL309901', shop_id: 'shop-308', category: 'NPS' },
    { id: 'card-KL012345', shop_id: 'shop-012', category: 'PHH' },
  ];
  cardMembers: CardMember[] = [
    { id: 'mem-001', card_id: 'card-KL048821', name: 'Rajan Pillai', phone_number: '+919876543210' },
    { id: 'mem-002', card_id: 'card-KL048821', name: 'Suma Rajan', phone_number: '+919876543211' },
    { id: 'mem-003', card_id: 'card-KL048821', name: 'Arjun Rajan', phone_number: '+919876543212' },
    { id: 'mem-004', card_id: 'card-KL041234', name: 'Mary Thomas', phone_number: '+919876500001' },
    { id: 'mem-005', card_id: 'card-KL041234', name: 'Biju Thomas', phone_number: '+919876500002' },
    { id: 'mem-006', card_id: 'card-KL115566', name: 'Sreekumar Nair', phone_number: '+919845001122' },
    { id: 'mem-007', card_id: 'card-KL115566', name: 'Lekha Sreekumar', phone_number: '+919845001123' },
    { id: 'mem-008', card_id: 'card-KL309901', name: 'Abdul Rahman', phone_number: '+919745112233' },
    { id: 'mem-009', card_id: 'card-KL012345', name: 'Geetha Devi', phone_number: '+919745998877' },
  ];
  transactions: Transaction[] = [
    { id: 'txn-001', card_id: 'card-KL048821', shop_id: 'shop-402', commodity_id: 'comm-matta', qty: 10, timestamp: '2026-09-05T10:15:00+05:30', source: 'epos' },
    { id: 'txn-002', card_id: 'card-KL048821', shop_id: 'shop-402', commodity_id: 'comm-sugar', qty: 2, timestamp: '2026-09-05T10:16:00+05:30', source: 'epos' },
    { id: 'txn-003', card_id: 'card-KL041234', shop_id: 'shop-402', commodity_id: 'comm-matta', qty: 5, timestamp: '2026-09-06T11:00:00+05:30', source: 'epos' },
    { id: 'txn-004', card_id: 'card-KL041234', shop_id: 'shop-402', commodity_id: 'comm-wheat', qty: 3, timestamp: '2026-09-06T11:01:00+05:30', source: 'epos' },
    { id: 'txn-005', card_id: 'card-KL115566', shop_id: 'shop-114', commodity_id: 'comm-matta', qty: 10, timestamp: '2026-09-07T09:30:00+05:30', source: 'epos' },
    { id: 'txn-006', card_id: 'card-KL309901', shop_id: 'shop-308', commodity_id: 'comm-matta', qty: 8, timestamp: '2026-09-08T14:00:00+05:30', source: 'epos' },
    { id: 'txn-007', card_id: 'card-KL012345', shop_id: 'shop-012', commodity_id: 'comm-matta', qty: 10, timestamp: '2026-09-09T10:00:00+05:30', source: 'epos' },
    { id: 'txn-008', card_id: 'card-KL012345', shop_id: 'shop-012', commodity_id: 'comm-kerosene', qty: 5, timestamp: '2026-09-09T10:02:00+05:30', source: 'epos' },
  ];
  deliveries: Delivery[] = [
    { id: 'del-001', shop_id: 'shop-402', commodity_id: 'comm-matta', dispatched_qty: 1000, weighed_qty: 850, timestamp: '2026-09-01T09:00:00+05:30' },
    { id: 'del-002', shop_id: 'shop-402', commodity_id: 'comm-wheat', dispatched_qty: 300, weighed_qty: 299, timestamp: '2026-09-01T09:30:00+05:30' },
    { id: 'del-003', shop_id: 'shop-114', commodity_id: 'comm-matta', dispatched_qty: 600, weighed_qty: 598, timestamp: '2026-09-02T10:00:00+05:30' },
    { id: 'del-004', shop_id: 'shop-308', commodity_id: 'comm-matta', dispatched_qty: 700, weighed_qty: 700, timestamp: '2026-09-03T11:00:00+05:30' },
    { id: 'del-005', shop_id: 'shop-012', commodity_id: 'comm-matta', dispatched_qty: 900, weighed_qty: 760, timestamp: '2026-09-04T09:00:00+05:30' },
  ];
  confirmations: Confirmation[] = [
    { id: 'conf-001', transaction_id: 'txn-001', confirmed: true, timestamp: '2026-09-05T10:20:00+05:30' },
    { id: 'conf-002', transaction_id: 'txn-002', confirmed: true, timestamp: '2026-09-05T10:21:00+05:30' },
    { id: 'conf-003', transaction_id: 'txn-005', confirmed: true, timestamp: '2026-09-07T09:35:00+05:30' },
    { id: 'conf-004', transaction_id: 'txn-003', confirmed: false, timestamp: '2026-09-06T11:10:00+05:30' },
  ];
  stockLedger: StockLedgerRow[] = [
    { id: 1, shop_id: 'shop-402', commodity_id: 'comm-matta', period: '2026-09', opening: 200, received: 800, sold: 650, closing: 350 },
    { id: 2, shop_id: 'shop-402', commodity_id: 'comm-kuruva', period: '2026-09', opening: 100, received: 400, sold: 380, closing: 120 },
    { id: 3, shop_id: 'shop-402', commodity_id: 'comm-wheat', period: '2026-09', opening: 80, received: 300, sold: 290, closing: 90 },
    { id: 4, shop_id: 'shop-402', commodity_id: 'comm-sugar', period: '2026-09', opening: 50, received: 200, sold: 250, closing: 0 },
    { id: 5, shop_id: 'shop-402', commodity_id: 'comm-kerosene', period: '2026-09', opening: 100, received: 500, sold: 480, closing: 120 },
    { id: 6, shop_id: 'shop-114', commodity_id: 'comm-matta', period: '2026-09', opening: 150, received: 600, sold: 590, closing: 160 },
    { id: 7, shop_id: 'shop-114', commodity_id: 'comm-wheat', period: '2026-09', opening: 60, received: 250, sold: 248, closing: 62 },
    { id: 8, shop_id: 'shop-114', commodity_id: 'comm-sugar', period: '2026-09', opening: 40, received: 150, sold: 150, closing: 40 },
    { id: 9, shop_id: 'shop-114', commodity_id: 'comm-kerosene', period: '2026-09', opening: 80, received: 400, sold: 399, closing: 81 },
    { id: 10, shop_id: 'shop-308', commodity_id: 'comm-matta', period: '2026-09', opening: 180, received: 700, sold: 430, closing: 450 },
    { id: 11, shop_id: 'shop-308', commodity_id: 'comm-wheat', period: '2026-09', opening: 70, received: 280, sold: 100, closing: 250 },
    { id: 12, shop_id: 'shop-308', commodity_id: 'comm-kerosene', period: '2026-09', opening: 90, received: 450, sold: 200, closing: 340 },
    { id: 13, shop_id: 'shop-012', commodity_id: 'comm-matta', period: '2026-09', opening: 220, received: 900, sold: 880, closing: 240 },
    { id: 14, shop_id: 'shop-012', commodity_id: 'comm-wheat', period: '2026-09', opening: 90, received: 360, sold: 355, closing: 95 },
    { id: 15, shop_id: 'shop-012', commodity_id: 'comm-sugar', period: '2026-09', opening: 55, received: 220, sold: 219, closing: 56 },
    { id: 16, shop_id: 'shop-012', commodity_id: 'comm-kerosene', period: '2026-09', opening: 110, received: 550, sold: 548, closing: 112 },
    { id: 17, shop_id: 'shop-501', commodity_id: 'comm-matta', period: '2026-09', opening: 160, received: 650, sold: 610, closing: 200 },
    { id: 18, shop_id: 'shop-215', commodity_id: 'comm-matta', period: '2026-09', opening: 140, received: 560, sold: 555, closing: 30 },
  ];
  anomalyFlags: AnomalyFlag[] = [];
  forecasts: Forecast[] = [
    { id: 1, shop_id: 'shop-402', commodity_id: 'comm-matta', period: '2026-10', predicted_qty: 920, basis: '3-month moving average +2.5%. Festive season uplift applied.' },
    { id: 2, shop_id: 'shop-114', commodity_id: 'comm-matta', period: '2026-10', predicted_qty: 640, basis: 'Near-depletion in Sep. Increase allocation 7%.' },
    { id: 3, shop_id: 'shop-308', commodity_id: 'comm-matta', period: '2026-10', predicted_qty: 700, basis: 'Healthy closing stock. Historical average maintained.' },
    { id: 4, shop_id: 'shop-012', commodity_id: 'comm-matta', period: '2026-10', predicted_qty: 950, basis: 'High-demand shop. Consistent monthly off-take ~900kg.' },
    { id: 5, shop_id: 'shop-501', commodity_id: 'comm-matta', period: '2026-10', predicted_qty: 680, basis: 'Steady demand pattern, slight growth trend.' },
    { id: 6, shop_id: 'shop-215', commodity_id: 'comm-matta', period: '2026-10', predicted_qty: 580, basis: 'Near-depletion warning: closing 30kg below threshold.' },
  ];
  subscriptions: Subscription[] = [];
  smsOutbox: SmsOutbox[] = [];
  unfulfilledRequests: UnfulfilledRequest[] = [];
  shortageNotices: ShortageNotice[] = [];
  /**
   * Multi-stage supply-chain approval chain:
   *  gov_directive -> supplier_approved -> in_transit -> shop_received -> staff_approved
   *  (any state can also transition to 'cancelled' or 'rejected')
   */
  supplyOrders: SupplyOrder[] = [
    {
      id: 'so-001',
      shop_id: 'shop-402',
      shop_name: 'Kaloor Fair Price Shop #402',
      district: 'Ernakulam',
      taluk: 'Kanayannur',
      commodity_id: 'comm-matta',
      commodity_name: 'Matta Rice',
      period: '2026-10',
      allocated_qty: 920,
      rationale: 'Kaloor is a high-demand FPS. Closing stock dropped to 350 kg in September.',
      created_by: 'gov',
      created_at: '2026-09-25T10:00:00+05:30',
      status: 'supplier_approved',
      approvals: [
        { stage: 'gov_directive', actor: 'Gov (Directorate)', at: '2026-09-25T10:00:00+05:30', note: 'Initial allocation order based on AI forecast.' },
        { stage: 'supplier_approved', actor: 'Kanayannur Taluk Supply Officer', at: '2026-09-26T11:15:00+05:30', note: 'Verified against taluk demand + warehouse capacity.' },
      ],
    },
    {
      id: 'so-002',
      shop_id: 'shop-114',
      shop_name: 'Fort Kochi Fair Price Shop #114',
      district: 'Ernakulam',
      taluk: 'Fort Kochi',
      commodity_id: 'comm-sugar',
      commodity_name: 'Fortified Sugar',
      period: '2026-10',
      allocated_qty: 210,
      rationale: 'Fort Kochi was zero-stock on fortified sugar in Sep. Citizen requests pending.',
      created_by: 'gov',
      created_at: '2026-09-27T09:30:00+05:30',
      status: 'gov_directive',
      approvals: [
        { stage: 'gov_directive', actor: 'Gov (Directorate)', at: '2026-09-27T09:30:00+05:30', note: 'Direct allocation for stockout.' },
      ],
    },
    {
      id: 'so-003',
      shop_id: 'shop-308',
      shop_name: 'Palarivattom Fair Price Shop #308',
      district: 'Ernakulam',
      taluk: 'Kanayannur',
      commodity_id: 'comm-kerosene',
      commodity_name: 'Kerosene',
      period: '2026-10',
      allocated_qty: 150,
      rationale: 'Kerosene buffer below threshold. Pending household requests.',
      created_by: 'gov',
      created_at: '2026-09-28T08:45:00+05:30',
      status: 'in_transit',
      approvals: [
        { stage: 'gov_directive', actor: 'Gov (Directorate)', at: '2026-09-28T08:45:00+05:30', note: '' },
        { stage: 'supplier_approved', actor: 'Kanayannur Taluk Supply Officer', at: '2026-09-28T14:00:00+05:30', note: 'Truck #KL-09-AQ-2118 loaded.' },
        { stage: 'in_transit', actor: 'Logistics', at: '2026-09-29T06:30:00+05:30', note: 'Departed Kanayannur godown.' },
      ],
    },
  ];

  private nextId = 1000;
  /** Exposed so admin endpoints (e.g. bulk stock upload) can allocate ids. */
  public nextLedgerId(): number {
    return this.nextId++;
  }

  /* ------------------------------------------------------------------ */
  /* Card / member helpers                                              */
  /* ------------------------------------------------------------------ */

  validateCardAndPhone(cardId: string, phone: string): CardMember | null {
    const card = this.rationCards.find((c) => c.id === cardId);
    if (!card) return null;
    return this.cardMembers.find((m) => m.card_id === cardId && m.phone_number === phone) ?? null;
  }

  getShopById(id: string): Shop | undefined {
    return this.shops.find((s) => s.id === id);
  }
  getCommodityById(id: string): Commodity | undefined {
    return this.commodities.find((c) => c.id === id);
  }
  getMembersByCard(cardId: string): CardMember[] {
    return this.cardMembers.filter((m) => m.card_id === cardId);
  }
  getCardById(id: string): RationCard | undefined {
    return this.rationCards.find((c) => c.id === id);
  }

  /* ------------------------------------------------------------------ */
  /* Stock ledger helpers                                               */
  /* ------------------------------------------------------------------ */

  getLedger(shopId: string, period: string): StockLedgerRow[] {
    return this.stockLedger.filter((r) => r.shop_id === shopId && r.period === period);
  }

  getLedgerRow(shopId: string, commodityId: string, period: string): StockLedgerRow | undefined {
    return this.stockLedger.find(
      (r) => r.shop_id === shopId && r.commodity_id === commodityId && r.period === period,
    );
  }

  getNearbyShops(lat: number, lon: number, commodityId?: string, period = '2026-09') {
    return this.shops
      .map((s) => {
        const distance_km = haversine(lat, lon, s.lat, s.lon);
        const ledgerRows = commodityId
          ? this.stockLedger.filter(
              (r) => r.shop_id === s.id && r.commodity_id === commodityId && r.period === period,
            )
          : this.stockLedger.filter((r) => r.shop_id === s.id && r.period === period);

        // When a commodity is selected, we expose one row for that commodity
        // plus a small availability table for other commodities at the same shop.
        const focusedRow = commodityId
          ? this.stockLedger.find(
              (r) => r.shop_id === s.id && r.commodity_id === commodityId && r.period === period,
            )
          : undefined;

        const allCommodities = ledgerRows.map((r) => {
          const c = this.getCommodityById(r.commodity_id);
          return {
            commodity_id: r.commodity_id,
            name: c?.name ?? r.commodity_id,
            closing: r.closing,
            unit: c?.unit ?? 'kg',
            status: stockStatus(r.closing),
          };
        });

        const closingForShop = allCommodities.reduce((sum, c) => sum + c.closing, 0);
        const stock_status: StockStatus = commodityId
          ? stockStatus(focusedRow?.closing ?? 0)
          : stockStatus(closingForShop);

        return {
          shop_id: s.id,
          name: s.name,
          district: s.district,
          taluk: s.taluk,
          lat: s.lat,
          lon: s.lon,
          distance_km,
          stock_status,
          closing_stock: focusedRow ? focusedRow.closing : closingForShop,
          available_commodities: allCommodities,
        };
      })
      .sort((a, b) => a.distance_km - b.distance_km);
  }

  /* ------------------------------------------------------------------ */
  /* Core business actions                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Log a delivery and verify dispatch vs. e-Balance weighed qty.
   * Auto-updates the shop's stock ledger using the **actual weighed** amount
   * (so phantom weight is never entered) and notifies waiting subscribers.
   */
  logDelivery(
    shopId: string,
    commodityId: string,
    dispatched: number,
    weighed: number,
  ): {
    delivery_id: string;
    mismatch_flag: boolean;
    variance_pct: number;
    updated_closing: number;
    sms_sent_to_subscribers: number;
  } {
    const id = `del-${Date.now()}`;
    const mismatch_pct = dispatched > 0 ? Math.abs(dispatched - weighed) / dispatched : 0;
    const mismatch_flag = mismatch_pct > 0.05;
    this.deliveries.push({
      id,
      shop_id: shopId,
      commodity_id: commodityId,
      dispatched_qty: dispatched,
      weighed_qty: weighed,
      timestamp: new Date().toISOString(),
    });

    const period = '2026-09';
    const row = this.getLedgerRow(shopId, commodityId, period);
    if (row) {
      row.received += weighed;
      row.closing += weighed;
    } else {
      this.stockLedger.push({
        id: this.nextId++,
        shop_id: shopId,
        commodity_id: commodityId,
        period,
        opening: 0,
        received: weighed,
        sold: 0,
        closing: weighed,
      });
    }

    // Notify waiting subscribers
    const waiting = this.unfulfilledRequests.filter(
      (r) => r.shop_id === shopId && r.commodity_id === commodityId && r.status === 'pending',
    );
    const comm = this.getCommodityById(commodityId);
    const shop = this.getShopById(shopId);
    let smsCount = 0;
    for (const req of waiting) {
      req.status = 'notified';
      const members = this.getMembersByCard(req.card_id);
      for (const m of members) {
        this.smsOutbox.push({
          id: this.nextId++,
          card_id: req.card_id,
          phone_number: m.phone_number,
          kind: 'arrival',
          message: `GOVKER-PDS: ${comm?.name ?? commodityId} has arrived at ${shop?.name ?? shopId}. Please visit to collect your ration. -Kerala Civil Supplies`,
          sent_at: new Date().toISOString(),
        });
        smsCount++;
      }
    }

    // Recompute anomaly so the dashboard reflects the new delivery
    this.recomputeAnomaly(shopId, period);

    const updatedRow = this.getLedgerRow(shopId, commodityId, period);
    return {
      delivery_id: id,
      mismatch_flag,
      variance_pct: Math.round(mismatch_pct * 1000) / 10,
      updated_closing: updatedRow?.closing ?? weighed,
      sms_sent_to_subscribers: smsCount,
    };
  }

  /**
   * Process a biometric sale.
   * - Deducts stock from the shop's ledger for the current period.
   * - Broadcasts an SMS to ALL Aadhaar-linked family members (multi-member fan-out).
   * - If `requestedQty` is greater than what the cardholder received, records a
   *   shortage notice ("you didn't get X kg, here's what we sent to the taluk office").
   */
  recordSale(
    cardId: string,
    shopId: string,
    commodityId: string,
    qty: number,
    requestedQty?: number,
  ): {
    transaction_id: string;
    new_closing: number;
    sms_broadcast_count: number;
    shortage: number;
    requested: number;
  } {
    const id = `txn-${Date.now()}`;
    const safeQty = Math.max(0, Number(qty) || 0);
    const requested = Math.max(safeQty, Number(requestedQty) || 0);
    const shortage = Math.max(0, requested - safeQty);

    this.transactions.push({
      id,
      card_id: cardId,
      shop_id: shopId,
      commodity_id: commodityId,
      qty: safeQty,
      timestamp: new Date().toISOString(),
      source: 'epos',
    });

    const period = '2026-09';
    const row = this.getLedgerRow(shopId, commodityId, period);
    if (row) {
      row.sold += safeQty;
      row.closing = Math.max(0, row.closing - safeQty);
    }

    const members = this.getMembersByCard(cardId);
    const comm = this.getCommodityById(commodityId);
    const shop = this.getShopById(shopId);
    const dateStr = new Date().toLocaleDateString('en-IN');

    for (const m of members) {
      this.smsOutbox.push({
        id: this.nextId++,
        card_id: cardId,
        phone_number: m.phone_number,
        kind: 'sale',
        message: `GOVKER-PDS: ${safeQty}${comm?.unit ?? 'kg'} ${comm?.name ?? commodityId} purchased under Card #${cardId} at ${shop?.name ?? shopId} on ${dateStr}. If you did NOT make this purchase, reply NO to raise a flag. -Kerala Civil Supplies`,
        sent_at: new Date().toISOString(),
      });
    }

    if (shortage > 0) {
      this.shortageNotices.push({
        id: this.nextId++,
        card_id: cardId,
        shop_id: shopId,
        commodity_id: commodityId,
        qty_requested: requested,
        qty_provided: safeQty,
        timestamp: new Date().toISOString(),
      });
      for (const m of members) {
        this.smsOutbox.push({
          id: this.nextId++,
          card_id: cardId,
          phone_number: m.phone_number,
          kind: 'shortfall',
          message: `GOVKER-PDS: You requested ${requested}${comm?.unit ?? 'kg'} ${comm?.name ?? commodityId} but only ${safeQty}${comm?.unit ?? 'kg'} was available at ${shop?.name ?? shopId}. Shortfall of ${shortage}${comm?.unit ?? 'kg'} reported to Taluk Supply Office for priority dispatch. -Kerala Civil Supplies`,
          sent_at: new Date().toISOString(),
        });
      }
    }

    return {
      transaction_id: id,
      new_closing: row?.closing ?? 0,
      sms_broadcast_count: members.length,
      shortage,
      requested,
    };
  }

  addUnfulfilledRequest(cardId: string, shopId: string, commodityId: string): number {
    const existing = this.unfulfilledRequests.find(
      (r) =>
        r.card_id === cardId &&
        r.shop_id === shopId &&
        r.commodity_id === commodityId &&
        r.status === 'pending',
    );
    if (existing) return existing.id;
    const id = this.nextId++;
    this.unfulfilledRequests.push({
      id,
      card_id: cardId,
      shop_id: shopId,
      commodity_id: commodityId,
      status: 'pending',
      requested_at: new Date().toISOString(),
    });
    return id;
  }

  addConfirmation(transactionId: string, confirmed: boolean): void {
    const id = `conf-${Date.now()}`;
    this.confirmations.push({
      id,
      transaction_id: transactionId,
      confirmed,
      timestamp: new Date().toISOString(),
    });
    if (!confirmed) {
      const txn = this.transactions.find((t) => t.id === transactionId);
      if (txn) this.recomputeAnomaly(txn.shop_id, '2026-09');
    }
  }

  getTransactionsByCard(cardId: string): (Transaction & {
    confirmed?: boolean;
    confirmation_status: 'CONFIRMED' | 'DISPUTED' | 'PENDING';
    commodity_name?: string;
    shop_name?: string;
    unit?: string;
  })[] {
    return this.transactions
      .filter((t) => t.card_id === cardId)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .map((t) => {
        const conf = this.confirmations.find((c) => c.transaction_id === t.id);
        const c = this.getCommodityById(t.commodity_id);
        const s = this.getShopById(t.shop_id);
        const status: 'CONFIRMED' | 'DISPUTED' | 'PENDING' = conf
          ? conf.confirmed
            ? 'CONFIRMED'
            : 'DISPUTED'
          : 'PENDING';
        return {
          ...t,
          confirmed: conf?.confirmed,
          confirmation_status: status,
          commodity_name: c?.name,
          shop_name: s?.name,
          unit: c?.unit,
        };
      });
  }

  getTransactionsByShop(shopId: string): Transaction[] {
    return this.transactions.filter((t) => t.shop_id === shopId);
  }

  /* ------------------------------------------------------------------ */
  /* Reconciliation                                                     */
  /* ------------------------------------------------------------------ */

  computeReconciliation(shopId: string, period: string) {
    const rows = this.getLedger(shopId, period);
    return rows.map((row) => {
      const calc_closing = row.opening + row.received - row.sold;
      const variance_pct =
        row.received > 0 ? Math.abs(row.closing - calc_closing) / row.received * 100 : 0;
      const comm = this.getCommodityById(row.commodity_id);
      return {
        ...row,
        commodity_name: comm?.name,
        calc_closing,
        variance_pct: Math.round(variance_pct * 10) / 10,
        status: Math.abs(row.closing - calc_closing) > 5 ? 'SHORTFALL' : 'OK',
      };
    });
  }

  /** Group reconciliation rows by shop so the gov UI can render one card per shop. */
  getAllReconciliationGrouped(period: string) {
    const shops = this.shops.map((shop) => {
      const items = this.computeReconciliation(shop.id, period).map((r) => ({
        commodity_id: r.commodity_id,
        commodity_name: r.commodity_name ?? r.commodity_id,
        unit: this.getCommodityById(r.commodity_id)?.unit ?? 'kg',
        opening: r.opening,
        received: r.received,
        sold: r.sold,
        recorded_closing: r.closing,
        calculated_closing: r.calc_closing,
        variance_pct: r.variance_pct,
        is_discrepant: r.status === 'SHORTFALL',
      }));
      return {
        shop_id: shop.id,
        shop_name: shop.name,
        district: shop.district,
        taluk: shop.taluk,
        period,
        items,
      };
    });
    return shops;
  }

  getAllReconciliation(period: string) {
    const allRows = this.stockLedger.filter((r) => r.period === period);
    return allRows.map((row) => {
      const calc_closing = row.opening + row.received - row.sold;
      const variance_pct =
        row.received > 0 ? Math.abs(row.closing - calc_closing) / row.received * 100 : 0;
      const comm = this.getCommodityById(row.commodity_id);
      const shop = this.getShopById(row.shop_id);
      return {
        ...row,
        shop_name: shop?.name,
        commodity_name: comm?.name,
        unit: comm?.unit,
        calc_closing,
        variance_pct: Math.round(variance_pct * 10) / 10,
        status: Math.abs(row.closing - calc_closing) > 5 ? 'SHORTFALL' : 'OK',
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Anomaly detection                                                  */
  /* ------------------------------------------------------------------ */

  recomputeAnomaly(shopId: string, period: string): AnomalyFlag {
    const delivs = this.deliveries.filter((d) => d.shop_id === shopId);
    const txns = this.transactions.filter((t) => t.shop_id === shopId);
    const txIds = new Set(txns.map((t) => t.id));
    const confs = this.confirmations.filter((c) => txIds.has(c.transaction_id));

    const totalDispatched = delivs.reduce((s, d) => s + d.dispatched_qty, 0);
    const totalWeighed = delivs.reduce((s, d) => s + d.weighed_qty, 0);
    const weightVar = totalDispatched > 0 ? (totalDispatched - totalWeighed) / totalDispatched : 0;
    const weightVariancePct = Math.round(weightVar * 1000) / 10;

    const confirmRate = txns.length > 0 ? confs.filter((c) => c.confirmed).length / txns.length : 1;

    let velocity = 0;
    if (txns.length > 8) {
      const hourCounts: { [h: number]: number } = {};
      txns.forEach((t) => {
        const h = new Date(t.timestamp).getHours();
        hourCounts[h] = (hourCounts[h] ?? 0) + 1;
      });
      velocity = Math.max(...Object.values(hourCounts));
    }

    let trust_score = 1.0;
    const signals: string[] = [];
    if (weightVar > 0.05) {
      trust_score -= 0.3;
      signals.push(
        `e-Balance delivery shortfall ${weightVariancePct}% (dispatched ${totalDispatched}kg, received ${totalWeighed}kg)`,
      );
    }
    if (confirmRate < 0.7 && txns.length > 2) {
      trust_score -= 0.25;
      signals.push(
        `Low citizen confirmation rate ${Math.round(confirmRate * 100)}% across ${txns.length} transactions`,
      );
    }
    if (velocity > 10) {
      trust_score -= 0.15;
      signals.push(`Transaction velocity spike: ${velocity} sales in a single hour`);
    }
    trust_score = Math.max(0, Math.round(trust_score * 100) / 100);

    const shop = this.getShopById(shopId);
    const reasoning =
      signals.length > 0
        ? `Audit Flag (${shop?.name ?? shopId}): Trust Score ${trust_score}/1.0. Issues: ${signals.join('. ')}.`
        : `${shop?.name ?? shopId} operating normally. Trust Score ${trust_score}/1.0. All signals within acceptable range.`;

    const existing = this.anomalyFlags.find((f) => f.shop_id === shopId && f.period === period);
    const flag: AnomalyFlag = {
      id: existing?.id ?? this.nextId++,
      shop_id: shopId,
      period,
      trust_score,
      reasoning,
      created_at: new Date().toISOString(),
      signals_used: {
        weight_variance_pct: weightVariancePct,
        citizen_confirmation_ratio: Math.round(confirmRate * 100) / 100,
        transaction_velocity_score: velocity,
      },
      is_flagged: trust_score < 0.7,
    };
    if (existing) Object.assign(existing, flag);
    else this.anomalyFlags.push(flag);
    return flag;
  }

  /** Eagerly compute anomalies for every shop in the registry. */
  getAllAnomalies(period: string): AnomalyFlag[] {
    return this.shops.map((s) => this.recomputeAnomaly(s.id, period));
  }

  /* ------------------------------------------------------------------ */
  /* Month-end carryover                                                */
  /* ------------------------------------------------------------------ */

  executeMonthEndReconciliation(period: string): {
    carried_forward: number;
    from_period: string;
    to_period: string;
  } {
    const rows = this.stockLedger.filter((r) => r.period === period);
    const [y, m] = period.split('-').map(Number);
    const nextPeriod = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    let count = 0;
    for (const row of rows) {
      const calc_closing = row.opening + row.received - row.sold;
      row.closing = calc_closing;
      const exists = this.stockLedger.find(
        (r) =>
          r.shop_id === row.shop_id && r.commodity_id === row.commodity_id && r.period === nextPeriod,
      );
      if (!exists) {
        this.stockLedger.push({
          id: this.nextId++,
          shop_id: row.shop_id,
          commodity_id: row.commodity_id,
          period: nextPeriod,
          opening: calc_closing,
          received: 0,
          sold: 0,
          closing: calc_closing,
        });
        count++;
      }
    }
    return { carried_forward: count, from_period: period, to_period: nextPeriod };
  }

  /* ------------------------------------------------------------------ */
  /* Supply optimization                                                */
  /* ------------------------------------------------------------------ */

  getOptimizationVectors(taluk?: string) {
    const shops = taluk ? this.shops.filter((s) => s.taluk === taluk) : this.shops;
    return shops
      .map((s) => {
        const ledger = this.stockLedger.filter(
          (r) => r.shop_id === s.id && r.period === '2026-09',
        );
        const pending = this.unfulfilledRequests.filter(
          (r) => r.shop_id === s.id && r.status === 'pending',
        ).length;
        const forecast = this.forecasts.find(
          (f) => f.shop_id === s.id && f.commodity_id === 'comm-matta' && f.period === '2026-10',
        );
        const mattaLedger = ledger.find((r) => r.commodity_id === 'comm-matta');
        const daysLeft =
          mattaLedger && mattaLedger.sold > 0
            ? Math.round(mattaLedger.closing / (mattaLedger.sold / 30))
            : 30;
        const focusedRow = ledger.find((r) => r.closing <= 0);
        const comm = focusedRow ? this.getCommodityById(focusedRow.commodity_id) : undefined;
        return {
          shop: s,
          commodity_id: comm?.id ?? 'comm-matta',
          commodity_name: comm?.name ?? 'Matta Rice',
          current_stock: focusedRow?.closing ?? mattaLedger?.closing ?? 0,
          pending_requests: pending,
          forecast_qty: forecast?.predicted_qty ?? 700,
          days_until_stockout: daysLeft,
          priority:
            mattaLedger && mattaLedger.closing < 60
              ? 'CRITICAL'
              : pending > 0
                ? 'HIGH'
                : 'NORMAL',
          recommendation: `Allocate ${forecast?.predicted_qty ?? 700}kg for Oct. ${pending > 0 ? `${pending} households waiting.` : ''} ${daysLeft < 7 ? 'URGENT: ' + daysLeft + ' days until stockout.' : ''}`,
        };
      })
      .sort((a, b) => b.pending_requests - a.pending_requests);
  }

  /* ------------------------------------------------------------------ */
  /* Government analytics (for /api/analytics + /gov dashboard)         */
  /* ------------------------------------------------------------------ */

  /** Top buyers in the period: which ration cards spent the most quantity. */
  getTopBuyers(period = '2026-09', limit = 5) {
    const ledgerById = new Map(this.stockLedger.map((r) => [`${r.shop_id}::${r.commodity_id}`, r]));
    const byCard = new Map<string, number>();
    for (const t of this.transactions) {
      const r = ledgerById.get(`${t.shop_id}::${t.commodity_id}`);
      if (!r || r.period !== period) continue;
      byCard.set(t.card_id, (byCard.get(t.card_id) ?? 0) + t.qty);
    }
    return [...byCard.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([card_id, total_qty]) => {
        const card = this.getCardById(card_id);
        const shop = card ? this.getShopById(card.shop_id) : undefined;
        const members = this.getMembersByCard(card_id);
        return {
          card_id,
          shop_id: card?.shop_id,
          shop_name: shop?.name,
          district: shop?.district,
          total_qty: Math.round(total_qty * 10) / 10,
          member_count: members.length,
          head_name: members[0]?.name,
        };
      });
  }

  /** Aggregate quantity sold per commodity (statewide). */
  getCommodityPopularity(period = '2026-09') {
    const sold = new Map<string, number>();
    const ledgerByKey = new Map(
      this.stockLedger.map((r) => [`${r.shop_id}::${r.commodity_id}::${r.period}`, r]),
    );
    for (const t of this.transactions) {
      const r = ledgerByKey.get(`${t.shop_id}::${t.commodity_id}::${period}`);
      if (!r) continue;
      sold.set(t.commodity_id, (sold.get(t.commodity_id) ?? 0) + t.qty);
    }
    return this.commodities.map((c) => ({
      commodity_id: c.id,
      name: c.name,
      unit: c.unit,
      total_sold: Math.round((sold.get(c.id) ?? 0) * 10) / 10,
    }));
  }

  /** Aggregate stock and pressure per taluk — what the supplier cares about. */
  getTalukSummary() {
    const taluks = new Map<string, { shops: number; total_closing: number; low_items: number; pending_demand: number; commodity_set: Set<string> }>();
    for (const s of this.shops) {
      const cur =
        taluks.get(s.taluk) ?? { shops: 0, total_closing: 0, low_items: 0, pending_demand: 0, commodity_set: new Set<string>() };
      cur.shops += 1;
      const rows = this.stockLedger.filter((r) => r.shop_id === s.id && r.period === '2026-09');
      for (const r of rows) {
        cur.total_closing += r.closing;
        cur.commodity_set.add(r.commodity_id);
        if (r.closing <= 0) cur.low_items += 1;
      }
      cur.pending_demand += this.unfulfilledRequests.filter(
        (u) => u.shop_id === s.id && u.status === 'pending',
      ).length;
      taluks.set(s.taluk, cur);
    }
    return [...taluks.entries()].map(([taluk, v]) => ({
      taluk,
      shops: v.shops,
      total_closing: Math.round(v.total_closing),
      low_items: v.low_items,
      pending_demand: v.pending_demand,
      commodities: v.commodity_set.size,
    }));
  }

  /** District breakdown used for the pie chart. */
  getDistrictDistribution() {
    const dist = new Map<string, { shops: number; families: number; total_closing: number }>();
    for (const s of this.shops) {
      const cur = dist.get(s.district) ?? { shops: 0, families: 0, total_closing: 0 };
      cur.shops += 1;
      cur.families += this.rationCards.filter((c) => c.shop_id === s.id).length;
      cur.total_closing += this.stockLedger
        .filter((r) => r.shop_id === s.id && r.period === '2026-09')
        .reduce((sum, r) => sum + r.closing, 0);
      dist.set(s.district, cur);
    }
    return [...dist.entries()].map(([district, v]) => ({
      district,
      shops: v.shops,
      families: v.families,
      total_closing: Math.round(v.total_closing),
    }));
  }

  /** Family-level SMS fan-out reach (statewide totals). */
  getSmsStats() {
    const kindCounts = this.smsOutbox.reduce<Record<string, number>>((acc, s) => {
      acc[s.kind ?? 'sale'] = (acc[s.kind ?? 'sale'] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total: this.smsOutbox.length,
      sale_alerts: kindCounts.sale ?? 0,
      arrival_alerts: kindCounts.arrival ?? 0,
      shortfall_alerts: kindCounts.shortfall ?? 0,
      households_reached: new Set(this.smsOutbox.map((s) => s.card_id)).size,
    };
  }

  getForecastMatrix() {
    // For the bar chart on supplier/gov portal: aggregate current vs forecast.
    const currentByKey = new Map<string, number>();
    for (const r of this.stockLedger) {
      if (r.period !== '2026-09') continue;
      currentByKey.set(r.commodity_id, (currentByKey.get(r.commodity_id) ?? 0) + r.sold);
    }
    const forecastByKey = new Map<string, number>();
    for (const f of this.forecasts) {
      if (f.period !== '2026-10') continue;
      forecastByKey.set(
        f.commodity_id,
        (forecastByKey.get(f.commodity_id) ?? 0) + f.predicted_qty,
      );
    }
    return this.commodities.map((c) => ({
      commodity: c.name,
      current: Math.round(currentByKey.get(c.id) ?? 0),
      forecast: Math.round(forecastByKey.get(c.id) ?? 0),
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Supply chain approval chain                                       */
  /* ------------------------------------------------------------------ */

  getSupplyOrders(filter?: { shop_id?: string; taluk?: string; status?: SupplyOrderStatus }): SupplyOrder[] {
    return this.supplyOrders.filter((o) => {
      if (filter?.shop_id && o.shop_id !== filter.shop_id) return false;
      if (filter?.taluk && o.taluk !== filter.taluk) return false;
      if (filter?.status && o.status !== filter.status) return false;
      return true;
    });
  }

  createSupplyOrder(input: {
    shop_id: string;
    commodity_id: string;
    allocated_qty: number;
    period: string;
    rationale?: string;
    actor?: string;
  }): SupplyOrder {
    const shop = this.getShopById(input.shop_id);
    const comm = this.getCommodityById(input.commodity_id);
    const id = `so-${String(Date.now()).slice(-6)}`;
    const order: SupplyOrder = {
      id,
      shop_id: input.shop_id,
      shop_name: shop?.name,
      district: shop?.district,
      taluk: shop?.taluk,
      commodity_id: input.commodity_id,
      commodity_name: comm?.name,
      period: input.period,
      allocated_qty: input.allocated_qty,
      rationale: input.rationale,
      created_by: input.actor ?? 'gov',
      created_at: new Date().toISOString(),
      status: 'gov_directive',
      approvals: [
        {
          stage: 'gov_directive',
          actor: input.actor ?? 'Gov (Directorate)',
          at: new Date().toISOString(),
          note: input.rationale,
        },
      ],
    };
    this.supplyOrders.unshift(order);
    return order;
  }

  advanceSupplyOrder(
    id: string,
    nextStatus: SupplyOrderStatus,
    actor: string,
    note?: string
  ): SupplyOrder | null {
    const order = this.supplyOrders.find((o) => o.id === id);
    if (!order) return null;
    order.status = nextStatus;
    order.approvals.push({
      stage: nextStatus,
      actor,
      at: new Date().toISOString(),
      note,
    });
    return order;
  }

  /**
   * Count orders by status — used by the dashboard summary cards.
   */
  supplyOrderCounts(): Record<SupplyOrderStatus, number> {
    const init: Record<string, number> = {
      gov_directive: 0,
      supplier_approved: 0,
      in_transit: 0,
      shop_received: 0,
      staff_approved: 0,
      rejected: 0,
      cancelled: 0,
    };
    for (const o of this.supplyOrders) init[o.status] = (init[o.status] ?? 0) + 1;
    return init as Record<SupplyOrderStatus, number>;
  }

  /* ------------------------------------------------------------------ */
  /* Stock ledger inline cell edits                                   */
  /* ------------------------------------------------------------------ */

  updateStockCell(
    shop_id: string,
    commodity_id: string,
    period: string,
    field: 'opening' | 'received' | 'sold' | 'closing',
    value: number
  ): { row: StockLedgerRow; previous: number; new_value: number } | null {
    const row = this.getLedgerRow(shop_id, commodity_id, period);
    if (!row) return null;
    const previous = row[field];
    row[field] = Math.max(0, Number(value) || 0);
    // Auto-recompute closing = opening + received - sold if user changed any of those
    if (field !== 'closing' && (field === 'opening' || field === 'received' || field === 'sold')) {
      row.closing = Math.max(0, row.opening + row.received - row.sold);
    }
    this.recomputeAnomaly(shop_id, period);
    return { row, previous, new_value: row[field] };
  }
}

// Singleton - persists across requests in dev mode
const globalStore = globalThis as typeof globalThis & { pdsStore?: PdsDataStore };
if (!globalStore.pdsStore) globalStore.pdsStore = new PdsDataStore();
export const store = globalStore.pdsStore;
export { haversine };
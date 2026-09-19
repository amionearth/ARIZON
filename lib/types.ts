// ==============================================================================
// KERALA SMART PDS (Arizon) - TYPE DEFINITIONS
// ==============================================================================

export type Role = 'customer' | 'seller' | 'supplier' | 'gov';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

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
  source: 'epos' | 'manual_override';
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
  period: string; // YYYY-MM
  opening: number;
  received: number;
  sold: number;
  closing: number;
}

export interface StockItemWithDetails extends StockLedgerRow {
  commodity_name: string;
  unit: string;
  status: StockStatus;
  shop_name: string;
}

export interface UnfulfilledRequest {
  id: number;
  card_id: string;
  shop_id: string;
  commodity_id: string;
  status: 'pending' | 'notified';
  requested_at: string;
}

export interface AnomalyFlag {
  id: number;
  shop_id: string;
  period: string;
  trust_score: number;
  reasoning: string;
  created_at: string;
}

export interface SmsOutboxEntry {
  id: number;
  card_id: string;
  phone_number: string;
  message: string;
  sent_at: string;
}

// Tool types & payloads
export interface NearbyShopResult {
  shop_id: string;
  name: string;
  district: string;
  taluk: string;
  distance_km: number;
  stock_status: StockStatus;
  available_commodities?: {
    commodity_id: string;
    name: string;
    closing: number;
    unit: string;
    status: StockStatus;
  }[];
}

export interface DeliveryLogResult {
  delivery_id: string;
  mismatch_flag: boolean;
  variance_pct: number;
  updated_closing: number;
  sms_sent_to_subscribers: number;
}

export interface ReconciliationResult {
  shop_id: string;
  shop_name: string;
  period: string;
  items: {
    commodity_id: string;
    commodity_name: string;
    opening: number;
    received: number;
    sold: number;
    recorded_closing: number;
    calculated_closing: number;
    variance_pct: number;
    is_discrepant: boolean;
  }[];
}

export interface AnomalyDetectionResult {
  shop_id: string;
  shop_name: string;
  period: string;
  trust_score: number;
  reasoning: string;
  signals_used: {
    weight_variance_pct: number;
    citizen_confirmation_ratio: number;
    transaction_velocity_score: number;
  };
  is_flagged: boolean;
}

export interface DemandForecastResult {
  shop_id: string;
  shop_name: string;
  commodity_id: string;
  commodity_name: string;
  horizon_months: number;
  historical_monthly_avg: number;
  unfulfilled_demand: number;
  predicted_qty: number;
  basis: string;
}

export interface SupplyOptimizationResult {
  region: string;
  recommendations: {
    shop_id: string;
    shop_name: string;
    commodity_id: string;
    commodity_name: string;
    current_stock: number;
    pending_demand: number;
    recommended_dispatch_qty: number;
    urgency: 'CRITICAL' | 'MODERATE' | 'NORMAL';
    rationale: string;
  }[];
  total_required_dispatch_kg: number;
}

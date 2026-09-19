// lib/tools.ts - All AI tool definitions with role scoping
import { tool } from 'ai'
import { z } from 'zod'
import { store } from './data'
import type { Role } from './data'

export const allTools = {
  get_stock: tool({
    description: 'Get current stock levels for a shop. Returns ledger with opening, received, sold, closing balances.',
    parameters: z.object({
      shop_id: z.string().describe('Shop ID e.g. shop-402'),
      commodity_id: z.string().optional().describe('Optional commodity filter e.g. comm-matta'),
      period: z.string().optional().describe('Period YYYY-MM, defaults to 2026-09'),
    }),
    execute: async ({ shop_id, commodity_id, period = '2026-09' }) => {
      const rows = store.getLedger(shop_id, period)
      const filtered = commodity_id ? rows.filter(r => r.commodity_id === commodity_id) : rows
      const result = filtered.map(r => {
        const comm = store.getCommodityById(r.commodity_id)
        return { ...r, commodity_name: comm?.name, unit: comm?.unit }
      })
      const shop = store.getShopById(shop_id)
      return { shop: shop?.name ?? shop_id, period, stock: result }
    },
  }),

  get_nearby_shops: tool({
    description: 'Find nearby ration shops with their stock status. Uses GPS coordinates.',
    parameters: z.object({
      lat: z.number().describe('Latitude'),
      lon: z.number().describe('Longitude'),
      commodity_id: z.string().optional().describe('Filter by commodity e.g. comm-matta for Matta Rice'),
    }),
    execute: async ({ lat, lon, commodity_id }) => {
      const shops = store.getNearbyShops(lat, lon, commodity_id)
      return { shops: shops.slice(0, 6), commodity_filter: commodity_id }
    },
  }),

  log_delivery: tool({
    description: 'Log a goods delivery to a shop. Compares dispatched vs e-Balance weighed quantity and flags mismatches over 5%. Auto-updates stock ledger and notifies waiting subscribers.',
    parameters: z.object({
      shop_id: z.string(),
      commodity_id: z.string(),
      dispatched_qty: z.number().describe('Quantity dispatched from warehouse'),
      weighed_qty: z.number().describe('Actual weight on e-Balance scale at shop'),
    }),
    execute: async ({ shop_id, commodity_id, dispatched_qty, weighed_qty }) => {
      const result = store.logDelivery(shop_id, commodity_id, dispatched_qty, weighed_qty)
      const comm = store.getCommodityById(commodity_id)
      const shop = store.getShopById(shop_id)
      return {
        ...result,
        shop: shop?.name,
        commodity: comm?.name,
        message: result.mismatch_flag
          ? `⚠️ MISMATCH: ${result.variance_pct}% shortfall detected. Anomaly logged for Taluk audit. Stock updated with actual weighed quantity.`
          : `✅ Delivery verified. Stock updated with ${weighed_qty}${comm?.unit ?? 'kg'}.`,
      }
    },
  }),

  record_unfulfilled_request: tool({
    description: 'Record that a citizen wants an item that is currently out of stock. They will be SMS-notified when it arrives.',
    parameters: z.object({
      card_id: z.string(),
      shop_id: z.string(),
      commodity_id: z.string(),
    }),
    execute: async ({ card_id, shop_id, commodity_id }) => {
      const id = store.addUnfulfilledRequest(card_id, shop_id, commodity_id)
      const comm = store.getCommodityById(commodity_id)
      const members = store.getMembersByCard(card_id)
      return {
        subscription_id: id,
        commodity: comm?.name,
        members_count: members.length,
        message: `Registered! All ${members.length} family members on Card #${card_id} will receive SMS when ${comm?.name ?? commodity_id} arrives.`,
      }
    },
  }),

  record_sale: tool({
    description: 'Process a biometric e-POS sale. Auto-deducts stock and broadcasts SMS to all family members.',
    parameters: z.object({
      card_id: z.string(),
      shop_id: z.string(),
      commodity_id: z.string(),
      qty: z.number(),
    }),
    execute: async ({ card_id, shop_id, commodity_id, qty }) => {
      const result = store.recordSale(card_id, shop_id, commodity_id, qty)
      const comm = store.getCommodityById(commodity_id)
      return {
        ...result,
        commodity: comm?.name,
        message: `Sale processed. ${result.sms_broadcast_count} family members notified via SMS. New closing stock: ${result.new_closing}${comm?.unit ?? 'kg'}.`,
      }
    },
  }),

  detect_anomaly: tool({
    description: 'Run multi-signal anti-leakage check on a shop. Cross-checks e-Balance weight, citizen confirmations, and transaction velocity. Returns trust score 0-1 with plain-language reasoning.',
    parameters: z.object({
      shop_id: z.string(),
      period: z.string().optional().default('2026-09'),
    }),
    execute: async ({ shop_id, period = '2026-09' }) => {
      return store.recomputeAnomaly(shop_id, period)
    },
  }),

  compute_reconciliation: tool({
    description: 'Compute month-end reconciliation: Closing = Opening + Received - Sold. Flags discrepancies.',
    parameters: z.object({
      shop_id: z.string().optional().describe('Specific shop, or omit for all shops'),
      period: z.string().optional().default('2026-09'),
    }),
    execute: async ({ shop_id, period = '2026-09' }) => {
      if (shop_id) return { reconciliation: store.computeReconciliation(shop_id, period) }
      return { reconciliation: store.getAllReconciliation(period) }
    },
  }),

  forecast_demand: tool({
    description: 'Get AI demand forecast for a shop and commodity for upcoming months.',
    parameters: z.object({
      shop_id: z.string(),
      commodity_id: z.string().optional(),
      horizon_months: z.number().optional().default(3),
    }),
    execute: async ({ shop_id, commodity_id }) => {
      const forecasts = store.forecasts.filter(f =>
        f.shop_id === shop_id && (!commodity_id || f.commodity_id === commodity_id)
      )
      const shop = store.getShopById(shop_id)
      return { shop: shop?.name, forecasts }
    },
  }),

  optimize_supply: tool({
    description: 'Calculate optimal stock allocation vectors for taluk supply officers based on citizen demand and current stock.',
    parameters: z.object({
      taluk: z.string().optional().describe('Taluk name to filter, or omit for all'),
    }),
    execute: async ({ taluk }) => {
      return { vectors: store.getOptimizationVectors(taluk), period: '2026-10' }
    },
  }),

  generate_report: tool({
    description: 'Generate executive audit report summarizing state-wide PDS performance, anomalies, and recommendations.',
    parameters: z.object({
      period: z.string().optional().default('2026-09'),
      scope: z.enum(['state', 'district', 'shop']).optional().default('state'),
    }),
    execute: async ({ period = '2026-09', scope = 'state' }) => {
      const recon = store.getAllReconciliation(period)
      const anomalies = store.getAllAnomalies(period)
      const shortfalls = recon.filter(r => r.status === 'SHORTFALL')
      const flagged = anomalies.filter(a => a.is_flagged)
      const totalSms = store.smsOutbox.length
      return {
        period, scope,
        summary: {
          total_shops: store.shops.length,
          flagged_shops: flagged.length,
          shortfall_entries: shortfalls.length,
          sms_broadcasts: totalSms,
          avg_trust_score: Math.round(anomalies.reduce((s, a) => s + a.trust_score, 0) / anomalies.length * 100) / 100,
        },
        flagged_shops: flagged.map(a => ({ shop: store.getShopById(a.shop_id)?.name ?? a.shop_id, trust_score: a.trust_score, reasoning: a.reasoning })),
        shortfalls: shortfalls.map(s => ({ shop: s.shop_name, commodity: s.commodity_name, variance: s.variance_pct + '%' })),
        narrative: `State-Wide PDS Audit Report — ${period}\n\nOf ${store.shops.length} Fair Price Shops monitored, ${flagged.length} shops flagged with Trust Score below 0.70. ${shortfalls.length} commodity ledger entries show reconciliation shortfalls. ${totalSms} household SMS alerts dispatched this period. Immediate field inspection recommended for: ${flagged.map(a => store.getShopById(a.shop_id)?.name ?? a.shop_id).join(', ')}.`,
      }
    },
  }),
}

export const ROLE_TOOLS: Record<Role, (keyof typeof allTools)[]> = {
  customer: ['get_stock', 'get_nearby_shops', 'record_unfulfilled_request'],
  seller: ['get_stock', 'log_delivery', 'record_sale', 'detect_anomaly'],
  supplier: ['get_stock', 'forecast_demand', 'compute_reconciliation', 'optimize_supply'],
  gov: ['get_stock', 'get_nearby_shops', 'log_delivery', 'record_sale', 'record_unfulfilled_request', 'detect_anomaly', 'compute_reconciliation', 'forecast_demand', 'optimize_supply', 'generate_report'],
}

export function getRoleScopedTools(role: Role) {
  const allowed = ROLE_TOOLS[role] ?? ROLE_TOOLS.customer
  return Object.fromEntries(allowed.filter(k => k in allTools).map(k => [k, allTools[k as keyof typeof allTools]]))
}

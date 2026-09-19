// app/api/supply-orders/route.ts
// Multi-stage supply chain approval API.
//
// Stages (in order):
//   gov_directive -> supplier_approved -> in_transit -> shop_received -> staff_approved
//
// Each role performs ONE step. Steps are recorded on the order's `approvals`
// array so the full audit trail is preserved.

import { NextRequest } from 'next/server';
import { store } from '@/lib/data';
import type { SupplyOrderStatus } from '@/lib/data';

export const dynamic = 'force-dynamic';

const STAGE_FOR_ACTION: Record<string, SupplyOrderStatus> = {
  supplier_approve: 'supplier_approved',
  mark_in_transit: 'in_transit',
  shop_receive: 'shop_received',
  staff_approve: 'staff_approved',
  cancel: 'cancelled',
  reject: 'rejected',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const shop_id = searchParams.get('shop_id') ?? undefined;
    const taluk = searchParams.get('taluk') ?? undefined;
    const status = (searchParams.get('status') as SupplyOrderStatus | null) ?? undefined;
    const orders = store.getSupplyOrders({ shop_id, taluk, status: status ?? undefined });
    return Response.json({
      orders,
      counts: store.supplyOrderCounts(),
      total: orders.length,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string | undefined;

    // Special case: create new directive (gov action)
    if (!action || action === 'create_directive') {
      const { shop_id, commodity_id, allocated_qty, period, rationale, actor } = body ?? {};
      if (!shop_id || !commodity_id || !allocated_qty || !period) {
        return Response.json({ error: 'Missing required fields for directive creation' }, { status: 400 });
      }
      const order = store.createSupplyOrder({
        shop_id,
        commodity_id,
        allocated_qty: Number(allocated_qty),
        period,
        rationale,
        actor,
      });
      return Response.json({ success: true, order });
    }

    // Otherwise: advance existing order
    const { id, actor, note, weighed_qty } = body ?? {};
    if (!id || !actor) {
      return Response.json({ error: 'Missing id or actor for stage transition' }, { status: 400 });
    }
    const nextStatus = STAGE_FOR_ACTION[action];
    if (!nextStatus) {
      return Response.json({ error: `Unknown action "${action}"` }, { status: 400 });
    }
    const order = store.advanceSupplyOrder(id, nextStatus, actor, note);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

    // Side effect: when staff approves, finalize the ledger update.
    // (The actual physical delivery was already captured by /api/deliveries;
    // staff_approved is the final sign-off that locks the receipt.)
    return Response.json({ success: true, order });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

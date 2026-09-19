// app/api/stock/[shop_id]/[commodity_id]/route.ts
// Inline cell-edit endpoint for the seller ledger.
// PATCH /api/stock/:shop_id/:commodity_id  body: { period, field, value }

import { NextRequest } from 'next/server';
import { store } from '@/lib/data';

export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS = new Set(['opening', 'received', 'sold', 'closing']);

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ shop_id: string; commodity_id: string }> },
) {
  try {
    const { shop_id, commodity_id } = await ctx.params;
    const body = await req.json();
    const period = String(body.period ?? '2026-09');
    const field = String(body.field ?? '');
    const value = Number(body.value);

    if (!ALLOWED_FIELDS.has(field)) {
      return Response.json(
        { error: `field must be one of: ${[...ALLOWED_FIELDS].join(', ')}` },
        { status: 400 },
      );
    }
    if (!Number.isFinite(value) || value < 0) {
      return Response.json({ error: 'value must be a non-negative number' }, { status: 400 });
    }

    const result = store.updateStockCell(shop_id, commodity_id, period, field as any, value);
    if (!result) {
      return Response.json({ error: 'Ledger row not found for that shop / commodity / period' }, { status: 404 });
    }

    // Mirror row into the "ledger changed" audit trail so the gov heatmap reflects it.
    store.recomputeAnomaly(shop_id, period);

    return Response.json({
      success: true,
      shop_id,
      commodity_id,
      period,
      field,
      previous: result.previous,
      new_value: result.new_value,
      row: result.row,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

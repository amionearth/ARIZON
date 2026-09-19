// app/api/reconciliation/route.ts
import { NextRequest } from 'next/server';
import { store } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reconciliation = store.getAllReconciliationGrouped('2026-09');
  return Response.json({ reconciliation });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const period = body?.period ?? '2026-09';
    const result = store.executeMonthEndReconciliation(period);
    return Response.json({
      success: true,
      rows_carried_forward: result.carried_forward,
      ledgers_carried_forward: result.carried_forward,
      from_period: result.from_period,
      to_period: result.to_period,
      message: `Month-End Reconciliation complete! ${result.carried_forward} commodity ledgers carried forward from ${result.from_period} into opening balance of ${result.to_period}.`,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
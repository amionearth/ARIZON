// app/api/anomaly/route.ts
import { NextRequest } from 'next/server';
import { store } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get('shop_id');
    const period = req.nextUrl.searchParams.get('period') ?? '2026-09';
    if (shopId) {
      const report = store.recomputeAnomaly(shopId, period);
      return Response.json({
        ...report,
        shop_name: store.getShopById(shopId)?.name,
      });
    }
    const reports = store.getAllAnomalies(period).map((r) => ({
      ...r,
      shop_name: store.getShopById(r.shop_id)?.name,
    }));
    return Response.json({ reports });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
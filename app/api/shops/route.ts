// app/api/shops/route.ts
import { NextRequest } from 'next/server';
import { store } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const lat = parseFloat(searchParams.get('lat') ?? '9.9887');
    const lon = parseFloat(searchParams.get('lon') ?? '76.2906');
    const commodity = searchParams.get('commodity') ?? searchParams.get('commodity_id') ?? undefined;
    const shopId = searchParams.get('shop_id');

    if (shopId) {
      const shop = store.getShopById(shopId);
      const ledger = store
        .getLedger(shopId, '2026-09')
        .map((r) => {
          const c = store.getCommodityById(r.commodity_id);
          return {
            ...r,
            commodity_name: c?.name,
            unit: c?.unit,
            status:
              r.closing <= 0 ? 'OUT_OF_STOCK' : r.closing < 60 ? 'LOW_STOCK' : 'IN_STOCK',
          };
        });
      const stock = ledger.map((l) => ({
        commodity_id: l.commodity_id,
        commodity_name: l.commodity_name,
        unit: l.unit,
        opening: l.opening,
        received: l.received,
        sold: l.sold,
        closing: l.closing,
        status: l.status,
      }));
      return Response.json({ shop, stock });
    }

    const shops = store.getNearbyShops(lat, lon, commodity);
    // Surface as both `nearby` (legacy UI) and `shops` for direct consumers.
    return Response.json({ nearby: shops, shops, total: shops.length });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
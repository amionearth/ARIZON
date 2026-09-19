// app/api/deliveries/route.ts
import { NextRequest } from 'next/server';
import { store } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    deliveries: store.deliveries
      .slice()
      .reverse()
      .slice(0, 50)
      .map((d) => ({
        ...d,
        commodity_name: store.getCommodityById(d.commodity_id)?.name,
        shop_name: store.getShopById(d.shop_id)?.name,
      })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { shop_id, commodity_id, dispatched_qty, weighed_qty } = await req.json();
    if (
      !shop_id ||
      !commodity_id ||
      dispatched_qty === undefined ||
      weighed_qty === undefined
    ) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const result = store.logDelivery(
      shop_id,
      commodity_id,
      Number(dispatched_qty),
      Number(weighed_qty),
    );
    const comm = store.getCommodityById(commodity_id);
    const shop = store.getShopById(shop_id);
    return Response.json({
      ...result,
      shop_name: shop?.name,
      commodity_name: comm?.name,
      message: result.mismatch_flag
        ? `Mismatch ${result.variance_pct}% flagged. Stock updated with actual weighed quantity (${result.updated_closing}${comm?.unit ?? 'kg'}).`
        : `Verified at scale. Stock updated to ${result.updated_closing}${comm?.unit ?? 'kg'}.`,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
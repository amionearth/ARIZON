// app/api/transactions/route.ts
import { NextRequest } from 'next/server';
import { store } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cardId = searchParams.get('card_id');
  const shopId = searchParams.get('shop_id');

  if (cardId) {
    const txns = store.getTransactionsByCard(cardId);
    return Response.json({ transactions: txns });
  }
  if (shopId) {
    return Response.json({ transactions: store.getTransactionsByShop(shopId) });
  }
  return Response.json({ transactions: store.transactions.slice(-30) });
}

export async function POST(req: NextRequest) {
  try {
    const { card_id, shop_id, commodity_id, qty, requested_qty } = await req.json();
    if (!card_id || !shop_id || !commodity_id || qty === undefined) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }
    const result = store.recordSale(
      card_id,
      shop_id,
      commodity_id,
      Number(qty),
      requested_qty !== undefined ? Number(requested_qty) : undefined,
    );
    const comm = store.getCommodityById(commodity_id);
    const shop = store.getShopById(shop_id);
    return Response.json({
      ...result,
      commodity_name: comm?.name,
      shop_name: shop?.name,
      unit: comm?.unit,
      new_closing_stock: result.new_closing,
      sms_broadcast_count: result.sms_broadcast_count,
      message: `Sale recorded. New closing balance: ${result.new_closing}${comm?.unit ?? 'kg'}. SMS dispatched to ${result.sms_broadcast_count} family members.`,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
// app/api/analytics/route.ts
// Government / supplier analytics endpoint: feeds the dashboard charts and tiles.
import { NextRequest } from 'next/server';
import { store } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') ?? '2026-09';

    const taluks = store.getTalukSummary();
    const districts = store.getDistrictDistribution();
    const commodities = store.getCommodityPopularity(period);
    const topBuyers = store.getTopBuyers(period, 5);
    const forecast = store.getForecastMatrix();
    const smsStats = store.getSmsStats();

    // Where to focus next: taluk with the most pending requests
    const focusTaluks = [...taluks]
      .sort((a, b) => b.pending_demand - a.pending_demand || b.low_items - a.low_items)
      .slice(0, 3);

    // Most popular commodity
    const topCommodity = [...commodities].sort((a, b) => b.total_sold - a.total_sold)[0];

    return Response.json({
      period,
      summary: {
        total_shops: store.shops.length,
        total_families: store.rationCards.length,
        total_card_members: store.cardMembers.length,
        total_transactions: store.transactions.length,
        total_deliveries: store.deliveries.length,
        total_shortfall_notices: store.shortageNotices.length,
        sms: smsStats,
      },
      taluks,
      districts,
      commodities,
      topBuyers,
      forecast,
      focusTaluks,
      topCommodity,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
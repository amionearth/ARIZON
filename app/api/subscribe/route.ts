import { NextRequest } from 'next/server'
import { store } from '@/lib/data'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const { card_id, shop_id, commodity_id } = await req.json()
    const id = store.addUnfulfilledRequest(card_id, shop_id, commodity_id)
    const members = store.getMembersByCard(card_id)
    return Response.json({ success: true, subscription_id: id, members_count: members.length })
  } catch (e) { return Response.json({ error: String(e) }, { status: 500 }) }
}

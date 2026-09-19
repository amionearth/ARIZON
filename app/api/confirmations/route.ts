import { NextRequest } from 'next/server'
import { store } from '@/lib/data'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const { transaction_id, confirmed } = await req.json()
    store.addConfirmation(transaction_id, !!confirmed)
    return Response.json({ success: true, message: confirmed ? 'Purchase confirmed. Trust score updated.' : 'Transaction flagged as unauthorised. Anomaly score updated for government review.' })
  } catch (e) { return Response.json({ error: String(e) }, { status: 500 }) }
}

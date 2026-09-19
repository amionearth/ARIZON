// app/api/sms/route.ts
import { store } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    outbox: store.smsOutbox.slice().reverse().slice(0, 100),
    total: store.smsOutbox.length,
    stats: store.getSmsStats(),
  });
}
// app/api/admin/ai/key/route.ts
// Separate endpoint so the API key can be rotated without touching the
// rest of the settings. The key is never returned in clear text.

import { NextRequest } from 'next/server';
import { aiControl } from '@/lib/ai-control';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, actor } = await req.json();
    if (typeof apiKey !== 'string') {
      return Response.json({ error: 'apiKey must be a string' }, { status: 400 });
    }
    const settings = aiControl.updateSettings({ apiKey: apiKey.trim() }, actor ?? 'gov');
    return Response.json({
      success: true,
      settings: { ...settings, apiKey: aiControl.maskKey(settings.apiKey) },
      keyLength: settings.apiKey.length,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE() {
  const settings = aiControl.updateSettings({ apiKey: '' }, 'gov');
  return Response.json({
    success: true,
    cleared: true,
    settings: { ...settings, apiKey: '' },
  });
}

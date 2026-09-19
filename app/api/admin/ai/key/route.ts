// app/api/admin/ai/key/route.ts
// Separate endpoint so the API key can be rotated without touching the
// rest of the settings. The key is never returned in clear text.

import { NextRequest } from 'next/server';
import { aiControl } from '@/lib/ai-control';
import { requireGovernmentSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const denied = await requireGovernmentSession();
  if (denied) return denied;
  try {
    const { apiKey, actor } = await req.json();
    if (typeof apiKey !== 'string') {
      return Response.json({ error: 'apiKey must be a string' }, { status: 400 });
    }
    const settings = aiControl.updateSettings({ apiKey: apiKey.trim() }, actor ?? 'gov');
    const { apiKey: _apiKey, ...publicSettings } = settings;
    return Response.json({
      success: true,
      settings: publicSettings,
      hasApiKey: Boolean(settings.apiKey),
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE() {
  const denied = await requireGovernmentSession();
  if (denied) return denied;
  const settings = aiControl.updateSettings({ apiKey: '' }, 'gov');
  const { apiKey: _apiKey, ...publicSettings } = settings;
  return Response.json({
    success: true,
    cleared: true,
    settings: publicSettings,
    hasApiKey: false,
  });
}

// app/api/admin/ai/route.ts
// Government-facing AI control panel.
//
// GET    — read current settings + recent request log
// POST   — update settings (or reset / test connection)
// DELETE — disable AI entirely

import { NextRequest } from 'next/server';
import { aiControl } from '@/lib/ai-control';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = aiControl.getSettings();
  return Response.json({
    settings: { ...s, apiKey: aiControl.maskKey(s.apiKey) },
    rawKeyLength: s.apiKey.length,
    logs: aiControl.getLogs(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action ?? 'update';

    if (action === 'test') {
      const settings = aiControl.getSettings();
      const start = Date.now();
      try {
        if (!settings.apiKey) {
          aiControl.log({
            at: new Date().toISOString(),
            role: 'gov',
            query: '[connection-test]',
            provider: settings.provider,
            model: settings.model,
            status: 'error',
            latency_ms: 0,
            note: 'No API key configured',
          });
          return Response.json({
            success: false,
            message: 'No API key configured. Add one and try again.',
          });
        }
        const res = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 4,
          }),
        });
        const latency = Date.now() - start;
        const text = await res.text();
        let parsed: any = null;
        try { parsed = JSON.parse(text); } catch { /* ignore */ }
        if (res.ok) {
          aiControl.log({
            at: new Date().toISOString(),
            role: 'gov',
            query: '[connection-test]',
            provider: settings.provider,
            model: settings.model,
            status: 'success',
            latency_ms: latency,
            note: `HTTP ${res.status}`,
          });
          return Response.json({ success: true, latency_ms: latency, message: 'Connection OK.' });
        }
        aiControl.log({
          at: new Date().toISOString(),
          role: 'gov',
          query: '[connection-test]',
          provider: settings.provider,
          model: settings.model,
          status: 'error',
          latency_ms: latency,
          note: `HTTP ${res.status}: ${text.slice(0, 120)}`,
        });
        return Response.json({
          success: false,
          latency_ms: latency,
          message: `HTTP ${res.status}: ${parsed?.error?.message ?? text.slice(0, 200)}`,
        });
      } catch (e: any) {
        const latency = Date.now() - start;
        aiControl.log({
          at: new Date().toISOString(),
          role: 'gov',
          query: '[connection-test]',
          provider: settings.provider,
          model: settings.model,
          status: 'error',
          latency_ms: latency,
          note: String(e?.message ?? e),
        });
        return Response.json({
          success: false,
          latency_ms: latency,
          message: `Network error: ${String(e?.message ?? e)}`,
        });
      }
    }

    if (action === 'reset') {
      const settings = aiControl.resetSettings(body.actor ?? 'gov');
      return Response.json({ success: true, settings: { ...settings, apiKey: aiControl.maskKey(settings.apiKey) } });
    }

    // update
    const patch = body.patch ?? body;
    delete patch.apiKey; // don't accept raw key here — use /api/admin/ai/key
    const settings = aiControl.updateSettings(patch, body.actor ?? 'gov');
    return Response.json({
      success: true,
      settings: { ...settings, apiKey: aiControl.maskKey(settings.apiKey) },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE() {
  const settings = aiControl.updateSettings({ enabled: false }, 'gov');
  return Response.json({
    success: true,
    disabled: true,
    settings: { ...settings, apiKey: aiControl.maskKey(settings.apiKey) },
  });
}

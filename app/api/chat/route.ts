// app/api/chat/route.ts
import { streamText } from 'ai';
import { getActiveAI } from '@/lib/ai';
import { aiControl } from '@/lib/ai-control';
import { getRoleScopedTools } from '@/lib/tools';
import { store } from '@/lib/data';
import type { Role } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, role = 'customer', shopId, lang = 'en' } = await req.json();
    const validRole = (
      ['customer', 'seller', 'supplier', 'gov'].includes(role) ? role : 'customer'
    ) as Role;
    const tools = getRoleScopedTools(validRole);

    const systemPrompt = buildSystemPrompt(validRole, shopId, lang);
    const ai = getActiveAI();
    const lastMsg = messages[messages.length - 1]?.content ?? '';

    // Universal pre-prompt tagging on input message
    const taggedMessages = messages.map((m: any, idx: number) => {
      if (idx === messages.length - 1 && m.role === 'user') {
        return {
          ...m,
          content: `[ARIZON PRE-PROMPT: Role=${validRole.toUpperCase()} | Scope=${shopId ?? 'Statewide'} | Period=2026-09 | Lang=${lang}]\n${m.content}`,
        };
      }
      return m;
    });

    if (ai.enabled) {
      const start = Date.now();
      try {
        const result: any = streamText({
          model: ai.provider(ai.model) as any,
          system: systemPrompt,
          messages: taggedMessages,
          tools,
          maxSteps: 5,
        });
        const latency = Date.now() - start;
        aiControl.log({
          at: new Date().toISOString(),
          role: validRole,
          query: lastMsg.slice(0, 120),
          provider: ai.provider.toString().slice(0, 30),
          model: ai.model,
          status: 'success',
          latency_ms: latency,
        });
        if (result?.toDataStreamResponse) return result.toDataStreamResponse();
        if (result?.toTextStreamResponse) return result.toTextStreamResponse();
        if (result?.textStream) {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of result.textStream) {
                  controller.enqueue(encoder.encode(String(chunk)));
                }
              } catch (e) {
                console.error('textStream error:', e);
              } finally {
                controller.close();
              }
            },
          });
          return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
        // Shape we didn't expect: drop to local rule
      } catch (err) {
        const latency = Date.now() - start;
        aiControl.log({
          at: new Date().toISOString(),
          role: validRole,
          query: lastMsg.slice(0, 120),
          provider: ai.provider.toString().slice(0, 30),
          model: ai.model,
          status: 'error',
          latency_ms: latency,
          note: String((err as Error)?.message ?? err).slice(0, 120),
        });
        console.error('AI streaming failed; falling back to local rule:', err);
      }
    } else {
      aiControl.log({
        at: new Date().toISOString(),
        role: validRole,
        query: lastMsg.slice(0, 120),
        provider: ai.enabled ? 'active' : 'disabled',
        model: ai.model,
        status: 'fallback',
        latency_ms: 0,
        note: ai.enabled ? '' : 'AI disabled in settings',
      });
    }

    const localResponse = await handleLocalQuery(lastMsg, validRole, shopId, lang);
    return Response.json({ role: 'assistant', content: localResponse });
  } catch (err) {
    console.error('Chat route error:', err);
    return Response.json(
      { error: 'Chat service temporarily unavailable' },
      { status: 500 },
    );
  }
}

function buildSystemPrompt(role: Role, shopId?: string, lang = 'en'): string {
  const langNote =
    lang === 'ml' ? 'Respond in Malayalam (മലയാളം) script when the user writes in Malayalam.' : '';
  const commoditiesList = store.commodities.map((c) => `${c.name} (${c.id})`).join(', ');
  const flaggedShops = store.getAllAnomalies('2026-09').filter((a) => a.is_flagged);

  return `[=== ARIZON UNIVERSAL SOVEREIGN GROUND-TRUTH PRE-PROMPT ===]
[SYSTEM JURISDICTION]: Government of Kerala — Department of Civil Supplies & Consumer Affairs.
[TEMPORAL ANCHOR]: September 2026 (Monthly Ledger Period: 2026-09).
[STAKEHOLDER ACTOR]: ${role.toUpperCase()}
[FOCAL SCOPE]: ${shopId ? `Fair Price Shop ${shopId}` : 'Statewide Kerala aePDS'}
[LANGUAGE PROFILE]: ${lang === 'ml' ? 'Malayalam (മലയാളം)' : 'English / Bilingual'}
[CORE DIRECTIVE]: You are the AriZon AI Agent powered by Kerala's Sovereign Multi-Model Gateway. You enforce zero-leakage transparency, accurate stock reporting, and anti-diversion monitoring. ${langNote}
[GROUND TRUTH DATABASE STATE]:
- Fair Price Shops Monitored: 6 active shops (Kaloor FPS #402, Fort Kochi FPS #114, Palarivattom FPS #308, Kazhakkoottam FPS #012, Aluva FPS #501, Thrippunithura FPS #215).
- Official Ration Commodities: ${commoditiesList}.
- Anti-Leakage Flags: ${flaggedShops.length} flagged shops (Shop #402 Kaloor under investigation for 15% scale weight discrepancy).
- 3-Tier Supply Chain: State Directives -> TSO Godown Approval & Dispatch -> FPS Dealer Scale Weighing -> Department Inspector Sign-Off.
- Multi-Member Household SMS: Every sale/delivery sends automated alerts to ALL Aadhaar-linked family members on the ration card.
[ROLE OPERATING BOUNDS]:
- Customer: Help cardholders locate stock, subscribe to "Notify Me" arrival alerts, verify entitlements.
- Seller: Assist FPS dealers with electronic scale receipt, e-POS biometric sales, ledger reconciliation, burn rates.
- Supplier: Guide Taluk Supply Officers in godown dispatch planning, AI optimization vectors, festival surge quotas.
- Gov: Deliver state-wide audit summaries, multi-signal trust scores (S1 scale weight, S2 citizen confirmation, S3 biometric velocity), reconciliation matrices.
[INSTRUCTION]: Always use tool calls to fetch real data before answering stock questions. Never hallucinate stock. Always maintain consistency with this ground-truth state.
[=== END UNIVERSAL PRE-PROMPT ===]`;
}

async function handleLocalQuery(
  msg: string,
  role: Role,
  shopId?: string,
  lang = 'en',
): Promise<string> {
  const lower = msg.toLowerCase();

  if (lower.includes('stock') || lower.includes('rice') || lower.includes('matta') || lower.includes('അരി')) {
    const shop = shopId ? store.getShopById(shopId) : store.shops[0];
    const ledger = store.getLedger(shop?.id ?? 'shop-402', '2026-09');
    const lines = ledger
      .map((r) => {
        const c = store.getCommodityById(r.commodity_id);
        return `${c?.name}: ${r.closing}${c?.unit} (${r.closing <= 0 ? '❌ Out' : r.closing < 60 ? '⚠️ Low' : '✅ In Stock'})`;
      })
      .join('\n');
    return lang === 'ml'
      ? `${shop?.name ?? 'കടയിലെ'} ഇപ്പോഴത്തെ സ്റ്റോക്ക്:\n${lines}`
      : `Current stock at ${shop?.name ?? 'shop'}:\n${lines}`;
  }

  if (lower.includes('nearby') || lower.includes('near') || lower.includes('അടുത്ത്')) {
    const shops = store.getNearbyShops(9.9887, 76.2906, undefined);
    const lines = shops
      .slice(0, 4)
      .map((s) => `${s.name} — ${s.distance_km}km — ${s.stock_status}`)
      .join('\n');
    return lang === 'ml' ? `അടുത്തുള്ള കടകൾ:\n${lines}` : `Nearby shops:\n${lines}`;
  }

  if (lower.includes('anomaly') || lower.includes('leakage') || lower.includes('trust')) {
    const anomalies = store.getAllAnomalies('2026-09');
    const flagged = anomalies.filter((a) => a.is_flagged);
    if (flagged.length === 0) return 'All shops are operating within normal parameters. No anomalies detected.';
    return `${flagged.length} shop(s) flagged:\n${flagged.map((a) => `• ${store.getShopById(a.shop_id)?.name ?? a.shop_id}: Trust Score ${a.trust_score}/1.0 — ${a.reasoning}`).join('\n')}`;
  }

  if (lower.includes('reconcil')) {
    const recon = store.getAllReconciliation('2026-09');
    const shortfalls = recon.filter((r) => r.status === 'SHORTFALL');
    return shortfalls.length > 0
      ? `${shortfalls.length} reconciliation shortfalls found:\n${shortfalls.map((r) => `• ${r.shop_name} - ${r.commodity_name}: ${r.variance_pct}% variance`).join('\n')}`
      : 'All stock ledgers reconcile correctly. No shortfalls detected.';
  }

  if (lower.includes('forecast') || lower.includes('predict')) {
    const forecasts = store.forecasts.slice(0, 4);
    return `Demand forecasts for October 2026:\n${forecasts
      .map((f) => {
        const s = store.getShopById(f.shop_id);
        const c = store.getCommodityById(f.commodity_id);
        return `• ${s?.name ?? f.shop_id}: ${c?.name ?? f.commodity_id} — ${f.predicted_qty}kg (${f.basis})`;
      })
      .join('\n')}`;
  }

  if (lower.includes('top') && (lower.includes('commodit') || lower.includes('bought'))) {
    const comms = store.getCommodityPopularity('2026-09').sort((a, b) => b.total_sold - a.total_sold);
    const top = comms[0];
    return top
      ? `Most-bought commodity this month: ${top.name} — ${top.total_sold}${top.unit} sold state-wide.`
      : 'No transactions yet.';
  }

  const defaults: Record<Role, string> = {
    customer:
      lang === 'ml'
        ? 'നിങ്ങളുടെ അടുത്തുള്ള കടകളിൽ സ്റ്റോക്ക് ലഭ്യമാണ്. "Notify Me" ബട്ടൺ ഉപയോഗിച്ച് SMS അലർട്ട് ലഭിക്കൂ.'
        : 'I can help you find nearby shops and check stock availability. Try asking "Is rice available near Kaloor?"',
    seller:
      'I can help you check your stock levels, log deliveries, and process sales. Try asking "How much rice do I have left?"',
    supplier:
      'I can help with demand forecasts and supply optimization. Try "Optimize stock for Kanayannur taluk".',
    gov: 'I can run anomaly detection, reconciliation analysis, and generate audit reports. Try "Show anomalies for September".',
  };
  return defaults[role];
}
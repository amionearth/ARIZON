'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  TrendingUp,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  MapPin,
  BarChart3,
  LineChart as LineIcon,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { Navbar } from '@/components/Navbar';
import { AgentChat } from '@/components/AgentChat';
import MobileTabBar, { TabSection } from '@/components/MobileTabBar';
import { Language, makeT } from '@/lib/translations';

interface OptimizationVector {
  shop_name?: string;
  commodity_name?: string;
  current_stock?: number;
  pending_demand?: number;
  recommended_dispatch_qty?: number;
  urgency?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'MODERATE';
  rationale?: string;
  recommendation?: string;
}

interface OptimizationResult {
  region: string;
  recommendations: OptimizationVector[];
  total_required_dispatch_kg: number;
}

interface Delivery {
  id: string;
  shop_id: string;
  shop_name?: string;
  commodity_id: string;
  commodity_name?: string;
  dispatched_qty: number;
  weighed_qty: number;
  timestamp: string;
}

const REQ = '#A56B14'; // accent-deep
const ALLOC = '#2F5233'; // authority

export default function SupplierPortal() {
  const [lang, setLang] = useState<Language>('en');
  const t = makeT(lang);

  const [selectedTaluk, setSelectedTaluk] = useState('Kanayannur');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [loadingOpt, setLoadingOpt] = useState(false);
  const [forecastData, setForecastData] = useState<{ commodity: string; current: number; forecast: number }[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');

  const fetchDeliveries = async () => {
    try {
      const res = await fetch('/api/deliveries');
      const data = await res.json();
      setDeliveries(Array.isArray(data.deliveries) ? data.deliveries : []);
    } catch {
      setDeliveries([]);
    }
  };

  const fetchForecast = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setForecastData(Array.isArray(data.forecast) ? data.forecast : []);
    } catch {
      setForecastData([]);
    }
  };

  const runOptimization = async () => {
    setLoadingOpt(true);
    try {
      const ana = await fetch('/api/analytics').then((r) => r.json());
      const vectors = (ana.focusTaluks ?? []).map((taluk: any) => {
        const tlist = (ana.taluks ?? []).find((x: any) => x.taluk === taluk.taluk);
        const topComm = [...(ana.commodities ?? [])].sort(
          (a: any, b: any) => b.total_sold - a.total_sold,
        )[0];
        return {
          shop_name: `${taluk.taluk} Consolidated`,
          commodity_name: topComm?.name ?? 'Matta Rice',
          current_stock: tlist?.total_closing ?? 0,
          pending_demand: tlist?.pending_demand ?? 0,
          recommended_dispatch_qty: Math.max(200, (taluk.low_items ?? 0) * 100),
          urgency:
            (tlist?.pending_demand ?? 0) > 0 || (tlist?.low_items ?? 0) > 0
              ? 'CRITICAL'
              : 'MODERATE',
          rationale: `${taluk.low_items} commodity shortages and ${taluk.pending_demand} pending citizen requests in this taluk.`,
        };
      });

      const total = vectors.reduce(
        (s: number, v: OptimizationVector) => s + (v.recommended_dispatch_qty ?? 0),
        0,
      );

      setOptimization({
        region: selectedTaluk,
        recommendations: vectors,
        total_required_dispatch_kg: total,
      });

      // Plain-language AI summary
      if (vectors.length > 0) {
        const critical = vectors.filter((v) => v.urgency === 'CRITICAL').length;
        setAiSummary(
          critical > 0
            ? `Arizon AI Agent: ${critical} taluk${critical === 1 ? '' : 's'} flagged CRITICAL — focus next dispatch on ${vectors.find((v) => v.urgency === 'CRITICAL')?.commodity_name ?? 'grain'}. Total recommended immediate dispatch: ${total} kg.`
            : `Arizon AI Agent: All taluks within normal parameters. Maintain scheduled dispatch cadence.`,
        );
      } else {
        setAiSummary('Arizon AI Agent: No critical shortfalls detected. Continue routine dispatch.');
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingOpt(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchForecast();
  }, []);

  useEffect(() => {
    runOptimization();
  }, [selectedTaluk]);

  // Build a simple 3-month projection line chart for the top commodity
  const projectionLine = forecastData.slice(0, 3).map((f) => ({
    name: f.commodity,
    current: f.current,
    projected: Math.round(f.forecast * 1.05),
    forecast: f.forecast,
  }));

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0">
      <Navbar lang={lang} onLanguageChange={setLang} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="surface-strong p-6 sm:p-8 bg-gradient-to-br from-white to-[var(--canvas-deep)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="eyebrow">{lang === 'ml' ? 'താലൂക്ക് സപ്ലൈ' : 'Taluk Supply Office'}</p>
            <h1 className="mt-2 font-serif font-bold text-2xl sm:text-4xl text-[var(--ink)] tracking-tight">
              {t.supplier_title}
            </h1>
            <p className="mt-2 text-base text-[var(--ink-soft)] leading-relaxed max-w-2xl">
              {t.supplier_subtitle}
            </p>
          </div>
          <div className="bg-white border border-[var(--rule-strong)] p-3.5 rounded-lg min-w-[260px]">
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5 uppercase tracking-wider">
              {lang === 'ml' ? 'താലൂക്ക് ഗോഡൗൺ' : 'Taluk Godown'}
            </label>
            <select
              value={selectedTaluk}
              onChange={(e) => setSelectedTaluk(e.target.value)}
              className="input"
            >
              <option value="Kanayannur">Kanayannur Taluk</option>
              <option value="Fort Kochi">Fort Kochi Taluk</option>
              <option value="Aluva">Aluva Taluk</option>
              <option value="Thiruvananthapuram">TVM Taluk</option>
            </select>
          </div>
        </div>

        {/* AI summary strip — plain language first */}
        <div className="surface p-5 border-l-4 border-l-[var(--authority)] flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[var(--authority)] shrink-0 mt-0.5" />
          <div>
            <p className="eyebrow">{lang === 'ml' ? 'AI സംഗ്രഹം' : 'AI Summary'}</p>
            <p className="text-base text-[var(--ink)] mt-1 leading-relaxed">
              {aiSummary || (lang === 'ml' ? 'AI സംഗ്രഹം തയ്യാറാകുന്നു...' : 'AI summary loading...')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Demand chart */}
            <TabSection id="demand">
              <div className="surface p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[var(--authority)]" />
                    <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                      {lang === 'ml' ? 'നിലവിലെ സ്റ്റോക്ക് vs റീഓർഡർ പ്രാശനം' : 'Current stock vs reorder threshold'}
                    </h2>
                  </div>
                  <span className="text-[11px] bg-[#EAF1E5] text-[var(--authority)] px-2 py-0.5 rounded-full font-bold border border-[#B7CFB7]">
                    {lang === 'ml' ? 'AI പ്രോജക്ഷൻ' : 'AI projection'}
                  </span>
                </div>
                <p className="text-sm text-[var(--ink-soft)]">
                  {lang === 'ml'
                    ? 'നിലവിലെ വിൽപ്പന വേഗത്തിൽ ഓണം/ഫെസ്റ്റിവൽ സീസൺ മൾട്ടിപ്ലയർ ഉൾപ്പെടുത്തി കണക്കാക്കിയ ഒക്ടോബർ ആവശ്യം.'
                    : 'Aggregates current sales velocity + Onam festival multipliers + pending citizen stockout requests.'}
                </p>
                <div className="h-64 w-full text-sm tabular-nums">
                  {forecastData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[var(--ink-soft)]">
                      {lang === 'ml' ? 'ലോഡ് ചെയ്യുന്നു...' : 'Loading...'}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="#E4D9C0" strokeDasharray="3 3" />
                        <XAxis dataKey="commodity" tick={{ fontSize: 11, fill: '#6B5D45' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6B5D45' }} />
                        <Tooltip
                          contentStyle={{
                            background: '#FFFFFF',
                            border: '1px solid #C9B994',
                            borderRadius: 8,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="current" name={lang === 'ml' ? 'സെപ്റ്റംബർ (വിറ്റത്)' : 'Sep Sold'} fill={ALLOC} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="forecast" name={lang === 'ml' ? 'ഒക്ടോബർ (AI)' : 'Oct Forecast'} fill={REQ} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </TabSection>

            {/* 3-month forecast line */}
            <TabSection id="forecast">
              <div className="surface p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
                  <div className="flex items-center gap-2">
                    <LineIcon className="w-5 h-5 text-[var(--authority)]" />
                    <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                      {t.forecast_title}
                    </h2>
                  </div>
                  <span className="text-[11px] bg-[#FAEFD9] text-[var(--accent-deep)] px-2 py-0.5 rounded-full font-bold border border-[#D9C28E]">
                    Q4 2026 Trend
                  </span>
                </div>
                <div className="h-56 w-full text-sm tabular-nums">
                  {projectionLine.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[var(--ink-soft)]">
                      {lang === 'ml' ? 'ലോഡ് ചെയ്യുന്നു...' : 'Loading...'}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={projectionLine} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="#E4D9C0" strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B5D45' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6B5D45' }} />
                        <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #C9B994', borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="current" name={lang === 'ml' ? 'നിലവിലെ' : 'Current'} stroke={ALLOC} strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="projected" name={lang === 'ml' ? 'പ്രോജക്ട്' : 'Projected'} stroke={REQ} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </TabSection>

            {/* Dispatch schedule */}
            <TabSection id="dispatch">
              <div className="surface p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[var(--authority)]" />
                    <h2 className="font-serif font-bold text-lg text-[var(--ink)]">{t.dispatch_schedule}</h2>
                  </div>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {lang === 'ml' ? 'വ്യത്യാസ പരിധി' : 'Variance threshold'}: 5.0%
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm tabular-nums">
                    <thead>
                      <tr className="border-b border-[var(--rule-strong)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold">
                        <th className="py-2.5 px-3">Delivery ID</th>
                        <th className="py-2.5 px-3">Shop</th>
                        <th className="py-2.5 px-3">Commodity</th>
                        <th className="py-2.5 px-3 text-right">Dispatched</th>
                        <th className="py-2.5 px-3 text-right">Scale Weighed</th>
                        <th className="py-2.5 px-3 text-right">Variance</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--rule)]">
                      {deliveries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-[var(--ink-soft)]">
                            {lang === 'ml' ? 'ഡിസ്പാച്ചുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല.' : 'No dispatches recorded yet.'}
                          </td>
                        </tr>
                      ) : (
                        deliveries.map((del) => {
                          const diff = Math.abs(del.dispatched_qty - del.weighed_qty);
                          const varPct =
                            del.dispatched_qty > 0 ? Math.round((diff / del.dispatched_qty) * 1000) / 10 : 0;
                          const isMismatch = varPct > 5.0;
                          return (
                            <tr key={del.id} className="hover:bg-[var(--canvas)]">
                              <td className="py-3 px-3 font-mono text-[var(--ink-soft)]">{del.id}</td>
                              <td className="py-3 px-3 text-[var(--ink)]">{del.shop_name ?? del.shop_id}</td>
                              <td className="py-3 px-3 text-[var(--ink)]">{del.commodity_name ?? del.commodity_id}</td>
                              <td className="py-3 px-3 text-right text-[var(--ink-soft)]">{del.dispatched_qty} kg</td>
                              <td className="py-3 px-3 text-right text-[var(--ink)] font-bold">{del.weighed_qty} kg</td>
                              <td className={`py-3 px-3 text-right font-bold ${isMismatch ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                                {varPct}%
                              </td>
                              <td className="py-3 px-3">
                                {isMismatch ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1D9CF] text-[var(--danger)] border border-[#D89F8B]">
                                    <AlertCircle className="w-3 h-3" /> {lang === 'ml' ? 'ഫ്ലാഗ്' : 'Mismatch'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F0DD] text-[var(--success)] border border-[#B7CFB7]">
                                    <CheckCircle2 className="w-3 h-3" /> {lang === 'ml' ? 'സ്ഥിരീകരിച്ചു' : 'Verified'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabSection>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Optimizer */}
            <TabSection id="optimize">
              <div className="surface p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--authority)]" />
                    <div>
                      <h2 className="font-serif font-bold text-lg text-[var(--ink)]">{t.optimizer_title}</h2>
                      <p className="text-xs text-[var(--ink-soft)]">{t.optimizer_desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={runOptimization}
                    disabled={loadingOpt}
                    className="btn-primary text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {loadingOpt ? '…' : t.generate_opt}
                  </button>
                </div>

                {optimization && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#EAF1E5] border border-[#B7CFB7] flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--authority)]">
                        {lang === 'ml' ? 'ആകെ അടിയന്തര ഡിസ്പാച്ച്' : 'Total Recommended Immediate Dispatch'}
                      </span>
                      <span className="font-mono font-bold text-[var(--authority)] text-base tabular-nums">
                        {optimization.total_required_dispatch_kg} kg
                      </span>
                    </div>

                    <div className="space-y-2">
                      {optimization.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-lg border text-sm space-y-1.5 ${
                            rec.urgency === 'CRITICAL' || rec.urgency === 'HIGH'
                              ? 'bg-[#F1D9CF] border-[#D89F8B]'
                              : 'bg-[var(--canvas)] border-[var(--rule)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--ink)]">{rec.shop_name}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--canvas-deep)] text-[var(--ink-soft)]">
                                {rec.commodity_name}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                rec.urgency === 'CRITICAL' || rec.urgency === 'HIGH'
                                  ? 'bg-[var(--danger)] text-white'
                                  : 'bg-[var(--warn)] text-white'
                              }`}
                            >
                              {rec.urgency}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-[var(--ink-soft)] tabular-nums">
                            <span>Balance: <strong>{rec.current_stock ?? 0} kg</strong></span>
                            <span>Pending: <strong>{rec.pending_demand ?? 0}</strong></span>
                            <span className="font-bold text-[var(--authority)]">
                              +{rec.recommended_dispatch_qty ?? 0} kg
                            </span>
                          </div>
                          <p className="text-xs text-[var(--ink-soft)] italic">
                            &quot;{rec.rationale ?? rec.recommendation}&quot;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabSection>

            <TabSection id="chat">
              <AgentChat
                role="supplier"
                lang={lang}
                title={lang === 'ml' ? 'AI ഏജന്റ് — സപ്ലൈ കോർ' : 'Arizon AI Agent — Supply Core'}
                placeholder={lang === 'ml' ? 'AI ഏജന്റിനോട് ഗോഡൗൺ ഡിസ്പാച്ച് ആസൂത്രണം ചെയ്യാൻ പറയൂ...' : 'Ask the AI Agent to plan godown dispatches or run taluk demand forecasts...'}
                presetPrompts={[
                  { label: lang === 'ml' ? 'ഡിമാൻഡ് ഫോർകാസ്റ്റ്' : 'Forecast Demand', query: 'Forecast demand for Matta Rice at Kaloor FPS #402 for next month' },
                  { label: lang === 'ml' ? 'ഒപ്റ്റിമൈസ്' : 'Optimize', query: 'Run AI supply optimization vectors for Kanayannur taluk' },
                  { label: lang === 'ml' ? 'റീകൺസിലിയേഷൻ' : 'Reconciliation', query: 'Compute reconciliation for all shops in Ernakulam' },
                ]}
              />
            </TabSection>
          </div>
        </div>
      </main>

      <MobileTabBar
        tabs={[
          { id: 'demand', label: lang === 'ml' ? 'ഡിമാൻഡ്' : 'Demand', icon: BarChart3 },
          { id: 'dispatch', label: lang === 'ml' ? 'ഡിസ്പാച്ച്' : 'Dispatch', icon: Truck },
          { id: 'forecast', label: lang === 'ml' ? 'ഫോർകാസ്റ്റ്' : 'Forecast', icon: TrendingUp },
          { id: 'chat', label: 'Chat', icon: MessageSquare },
        ]}
      />
    </div>
  );
}

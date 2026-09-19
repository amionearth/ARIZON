'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Scale,
  AlertOctagon,
  CheckCircle2,
  Mail,
  RefreshCw,
  Sparkles,
  Play,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  ScrollText,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Navbar } from '@/components/Navbar';
import { AgentChat } from '@/components/AgentChat';
import MobileTabBar, { TabSection } from '@/components/MobileTabBar';
import { Language, makeT } from '@/lib/translations';

interface ReconciliationResult {
  shop_id: string;
  shop_name: string;
  district: string;
  taluk: string;
  period: string;
  items: {
    commodity_id: string;
    commodity_name: string;
    unit: string;
    opening: number;
    received: number;
    sold: number;
    recorded_closing: number;
    calculated_closing: number;
    variance_pct: number;
    is_discrepant: boolean;
  }[];
}

interface AnomalyReport {
  shop_id: string;
  shop_name?: string;
  trust_score: number;
  reasoning: string;
  is_flagged: boolean;
  signals_used: {
    weight_variance_pct: number;
    citizen_confirmation_ratio: number;
    transaction_velocity_score: number;
  };
}

interface SmsOutboxEntry {
  id: number;
  card_id: string;
  phone_number: string;
  message: string;
  sent_at: string;
  kind?: 'sale' | 'arrival' | 'shortfall';
}

interface Analytics {
  summary?: {
    total_shops: number;
    total_families: number;
    total_card_members: number;
    total_transactions: number;
    total_deliveries: number;
    sms?: { total: number; sale_alerts: number; arrival_alerts: number; shortfall_alerts: number; households_reached: number };
  };
  commodities?: { name: string; total_sold: number; unit: string }[];
  districts?: { district: string; shops: number; families: number; total_closing: number }[];
  topBuyers?: { card_id: string; shop_name?: string; head_name?: string; total_qty: number }[];
  focusTaluks?: { taluk: string; pending_demand: number; low_items: number; total_closing: number }[];
  forecast?: { commodity: string; current: number; forecast: number }[];
}

const PIE = ['#2F5233', '#C98A2B', '#B3462C', '#4C7A3D', '#B8860B', '#6B5D45'];

export default function GovernmentPortal() {
  const [lang, setLang] = useState<Language>('en');
  const t = makeT(lang);

  const [reconciliation, setReconciliation] = useState<ReconciliationResult[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AnomalyReport | null>(null);
  const [smsOutbox, setSmsOutbox] = useState<SmsOutboxEntry[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [monthEndResult, setMonthEndResult] = useState<any>(null);
  const [briefing, setBriefing] = useState<string>('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rec, anom, sms, ana] = await Promise.all([
        fetch('/api/reconciliation').then((r) => r.json()),
        fetch('/api/anomaly').then((r) => r.json()),
        fetch('/api/sms').then((r) => r.json()),
        fetch('/api/analytics').then((r) => r.json()),
      ]);

      setReconciliation(Array.isArray(rec.reconciliation) ? rec.reconciliation : []);
      const reports = Array.isArray(anom.reports) ? anom.reports : [];
      setAnomalies(reports);
      const flagged = reports.find((r: AnomalyReport) => r.is_flagged);
      setSelectedAudit((prev) => prev ?? flagged ?? reports[0] ?? null);

      setSmsOutbox(Array.isArray(sms.outbox) ? sms.outbox : []);
      setAnalytics(ana);

      // Compose "Today's AI Briefing"
      const flaggedCount = reports.filter((r: AnomalyReport) => r.is_flagged).length;
      const topBuyer = (ana.topBuyers ?? [])[0];
      const topCommodity = [...(ana.commodities ?? [])].sort((a: any, b: any) => b.total_sold - a.total_sold)[0];
      const totalSms = ana.summary?.sms?.total ?? 0;
      const households = ana.summary?.sms?.households_reached ?? 0;
      const lines: string[] = [];
      lines.push(
        flaggedCount > 0
          ? `${flaggedCount} shop${flaggedCount === 1 ? '' : 's'} flagged CRITICAL (Trust Score < 0.70). Immediate field audit recommended.`
          : 'All shops operating within normal trust parameters.',
      );
      if (topCommodity) {
        lines.push(
          `Most-purchased commodity this month: ${topCommodity.name} (${topCommodity.total_sold} ${topCommodity.unit} sold state-wide).`,
        );
      }
      if (topBuyer) {
        lines.push(
          `Highest-volume cardholder: ${topBuyer.head_name ?? topBuyer.card_id} at ${topBuyer.shop_name ?? '-'} — ${topBuyer.total_qty} kg.`,
        );
      }
      lines.push(
        `Household reach: ${households} families received ${totalSms} SMS alerts (sale / arrival / shortfall).`,
      );
      setBriefing(lines.join(' '));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteMonthEnd = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: '2026-09' }),
      });
      const data = await res.json();
      setMonthEndResult(data);
      fetchAll();
      setTimeout(() => setMonthEndResult(null), 8000);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const summary = analytics?.summary;
  const smsStats = summary?.sms;
  const commodityData = analytics?.commodities ?? [];
  const topBuyers = analytics?.topBuyers ?? [];
  const focusTaluks = analytics?.focusTaluks ?? [];
  const forecast = analytics?.forecast ?? [];

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0">
      <Navbar lang={lang} onLanguageChange={setLang} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Banner */}
        <div className="surface-strong p-6 sm:p-8 bg-gradient-to-br from-white to-[var(--canvas-deep)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="eyebrow">
              {lang === 'ml' ? 'സിവിൽ സപ്ലൈസ് ഡയറക്ടറേറ്റ്' : 'Civil Supplies Directorate'}
            </p>
            <h1 className="mt-2 font-serif font-bold text-2xl sm:text-4xl text-[var(--ink)] tracking-tight">
              {t.gov_dash_title}
            </h1>
            <p className="mt-2 text-base text-[var(--ink-soft)] leading-relaxed max-w-2xl">
              {t.gov_dash_subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleExecuteMonthEnd}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              <Play className="w-4 h-4" /> {t.run_reconciliation}
            </button>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="btn-primary text-sm"
            >
              <RefreshCw className="w-4 h-4" /> {t.refresh}
            </button>
          </div>
        </div>

        {/* Today's AI Briefing — plain language first */}
        <TabSection id="briefing">
          <div className="surface p-5 sm:p-6 bg-[var(--authority)] text-white border-[var(--authority-deep)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <p className="eyebrow text-[#C8E1CB]">
                  {lang === 'ml' ? 'ഇന്നത്തെ AI ബ്രീഫിംഗ്' : "Today's AI Briefing"}
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/15 font-bold">
                Sept 2026
              </span>
            </div>
            <p className="mt-3 font-serif text-lg sm:text-xl leading-relaxed">
              {briefing || (lang === 'ml' ? 'AI ബ്രീഫിംഗ് തയ്യാറാകുന്നു...' : 'AI briefing loading...')}
            </p>

            {/* KPI mini-row */}
            {summary && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                {[
                  { label: 'FPS Tracked', value: summary.total_shops },
                  { label: 'Families', value: summary.total_families },
                  { label: 'Members', value: summary.total_card_members },
                  { label: 'Sales', value: summary.total_transactions },
                  { label: 'Deliveries', value: summary.total_deliveries },
                  { label: 'SMS Sent', value: smsStats?.total ?? 0 },
                ].map((kpi) => (
                  <div key={kpi.label} className="p-3 rounded-lg bg-white/10 border border-white/15">
                    <div className="text-[10px] uppercase tracking-wider text-[#C8E1CB] font-bold">
                      {kpi.label}
                    </div>
                    <div className="font-mono font-bold text-xl tabular-nums">{kpi.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabSection>

        {monthEndResult && (
          <div className="p-4 rounded-lg bg-[#F4E9D0] border border-[#D9C28E] text-[var(--warn)] flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              {lang === 'ml'
                ? `മാസാന്ത റീകൺസിലിയേഷൻ പൂർത്തിയായി! ${monthEndResult.rows_carried_forward} വരികൾ ${monthEndResult.from_period} മുതൽ ${monthEndResult.to_period} ബാലൻസിലേക്ക് മാറ്റി.`
                : `Month-End Reconciliation complete! ${monthEndResult.rows_carried_forward} commodity ledgers carried forward from ${monthEndResult.from_period} to opening balance of ${monthEndResult.to_period}.`}
            </span>
          </div>
        )}

        {/* Heatmap */}
        <TabSection id="heatmap">
          <div className="surface p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-[var(--danger)]" />
                <h2 className="font-serif font-bold text-xl text-[var(--ink)]">{t.heatmap_title}</h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-full bg-[#E6F0DD] text-[var(--success)] border border-[#B7CFB7]">
                  ≥ 0.70: {lang === 'ml' ? 'സ്ഥിരീകരിച്ചു' : 'Verified'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#F1D9CF] text-[var(--danger)] border border-[#D89F8B]">
                  &lt; 0.70: {lang === 'ml' ? 'അനോമലി' : 'Anomaly'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {anomalies.map((a) => {
                const isLowTrust = a.trust_score < 0.7;
                const isSelected = selectedAudit?.shop_id === a.shop_id;
                return (
                  <div
                    key={a.shop_id}
                    onClick={() => setSelectedAudit(a)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[#FAEFD9]'
                        : isLowTrust
                          ? 'bg-[#F1D9CF] border-[#D89F8B]'
                          : 'bg-[#E6F0DD] border-[#B7CFB7]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--ink)]">{a.shop_name ?? a.shop_id}</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          isLowTrust ? 'bg-[var(--danger)] text-white' : 'bg-[var(--success)] text-white'
                        }`}
                      >
                        {a.trust_score}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-[11px] text-[var(--ink-soft)] tabular-nums">
                      <div className="flex justify-between">
                        <span>Scale ($S_1$):</span>
                        <span
                          className={`font-mono font-bold ${
                            a.signals_used.weight_variance_pct > 5 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                          }`}
                        >
                          {a.signals_used.weight_variance_pct}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confirm ($S_2$):</span>
                        <span
                          className={`font-mono font-bold ${
                            a.signals_used.citizen_confirmation_ratio < 0.7
                              ? 'text-[var(--danger)]'
                              : 'text-[var(--success)]'
                          }`}
                        >
                          {Math.round(a.signals_used.citizen_confirmation_ratio * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Velocity ($S_3$):</span>
                        <span className="font-mono font-bold">{a.signals_used.transaction_velocity_score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedAudit && (
              <div className="p-5 rounded-lg bg-[var(--authority)] text-white border-[var(--authority-deep)]">
                <div className="flex items-center justify-between border-b border-white/15 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C8E1CB]" />
                    <span className="text-xs font-bold text-[#C8E1CB] uppercase tracking-wider">
                      {t.plain_reasoning} · {selectedAudit.shop_name ?? selectedAudit.shop_id}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      selectedAudit.trust_score < 0.7 ? 'bg-[var(--danger)]' : 'bg-[var(--success)]'
                    }`}
                  >
                    Trust: {selectedAudit.trust_score} / 1.0
                  </span>
                </div>
                <p className="text-sm leading-relaxed mt-3">{selectedAudit.reasoning}</p>
              </div>
            )}
          </div>
        </TabSection>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie: commodity distribution */}
          <TabSection id="commodities">
            <div className="surface p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--authority)]" />
                  <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                    {lang === 'ml' ? 'ഉൽപ്പന്ന വിതരണം' : 'Commodity Distribution'}
                  </h2>
                </div>
                <span className="text-[10px] bg-[#EAF1E5] text-[var(--authority)] px-2 py-0.5 rounded-full font-bold border border-[#B7CFB7]">
                  Live
                </span>
              </div>
              <div className="h-64 w-full text-sm">
                {commodityData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[var(--ink-soft)]">
                    {lang === 'ml' ? 'ലോഡ് ചെയ്യുന്നു...' : 'Loading...'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={commodityData}
                        dataKey="total_sold"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {commodityData.map((_, idx) => (
                          <Cell key={idx} fill={PIE[idx % PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #C9B994', borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabSection>

          {/* Bar: forecast */}
          <TabSection id="forecast">
            <div className="surface p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--authority)]" />
                  <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                    {lang === 'ml' ? 'വിൽപ്പന vs പ്രവചനം' : 'Sold vs Forecast'}
                  </h2>
                </div>
              </div>
              <div className="h-64 w-full text-sm tabular-nums">
                {forecast.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[var(--ink-soft)]">
                    {lang === 'ml' ? 'ലോഡ് ചെയ്യുന്നു...' : 'Loading...'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#E4D9C0" strokeDasharray="3 3" />
                      <XAxis dataKey="commodity" tick={{ fontSize: 10, fill: '#6B5D45' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6B5D45' }} />
                      <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #C9B994', borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="current" name={lang === 'ml' ? 'സെപ്റ്റംബർ' : 'Sep Sold'} fill="#2F5233" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="forecast" name={lang === 'ml' ? 'ഒക്ടോബർ AI' : 'Oct AI'} fill="#C98A2B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabSection>
        </div>

        {/* Focus taluks + top buyers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="surface p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
                <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                  {lang === 'ml' ? 'ശ്രദ്ധ ആവശ്യമായ താലൂക്കുകൾ' : 'Taluks Needing Focus'}
                </h2>
              </div>
            </div>
            <div className="space-y-2">
              {focusTaluks.length === 0 ? (
                <div className="text-sm text-[var(--ink-soft)]">{lang === 'ml' ? 'എല്ലാ താലൂക്കുകളും സാധാരണ നിലയിൽ.' : 'All taluks within normal parameters.'}</div>
              ) : (
                focusTaluks.map((t) => (
                  <div
                    key={t.taluk}
                    className="p-3 rounded-lg bg-[#F1D9CF] border border-[#D89F8B] flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-bold text-[var(--ink)]">{t.taluk} Taluk</div>
                      <div className="text-[11px] text-[var(--ink-soft)]">{t.shops} shops · {t.low_items} commodity shortfalls</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[var(--danger)] font-bold tabular-nums">{t.pending_demand} pending</div>
                      <div className="text-[10px] text-[var(--ink-soft)] tabular-nums">{t.total_closing} kg closing</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="surface p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--success)]" />
                <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                  {lang === 'ml' ? 'ഏറ്റവും കൂടുതൽ വാങ്ങിയവർ' : 'Top Buyers'}
                </h2>
              </div>
            </div>
            <div className="space-y-2">
              {topBuyers.length === 0 ? (
                <div className="text-sm text-[var(--ink-soft)]">{lang === 'ml' ? 'വിൽപ്പന ഇല്ല.' : 'No transactions yet.'}</div>
              ) : (
                topBuyers.map((b, idx) => (
                  <div
                    key={b.card_id}
                    className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--rule)] flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[var(--authority)] text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-[var(--ink)]">{b.head_name ?? b.card_id}</div>
                        <div className="text-[11px] text-[var(--ink-soft)]">
                          {b.card_id} · {b.shop_name ?? '-'}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-[var(--authority)] tabular-nums">{b.total_qty} kg</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Reconciliation matrix */}
        <TabSection id="reconciliation">
          <div className="surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
              <div>
                <h2 className="font-serif font-bold text-xl text-[var(--ink)] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[var(--authority)]" />
                  {t.reconcile_matrix_title}
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-1">
                  Closing = (Opening + Weighed Received) − e-POS Sold · Discrepancies &gt; 5 kg flagged.
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--ink-soft)]">Period: September 2026</span>
            </div>

            <div className="space-y-6">
              {reconciliation.length === 0 ? (
                <div className="text-sm text-[var(--ink-soft)]">Loading reconciliation matrix…</div>
              ) : (
                reconciliation.map((rec) => (
                  <div key={rec.shop_id} className="space-y-2">
                    <div className="flex items-center justify-between bg-[var(--canvas)] border border-[var(--rule)] px-4 py-2 rounded-lg text-sm font-bold">
                      <span className="text-[var(--ink)]">
                        {rec.shop_name} ({rec.shop_id})
                      </span>
                      <span className="font-normal">
                        {rec.items.some((i) => i.is_discrepant) ? (
                          <span className="text-[var(--danger)] font-bold">⚠ Ledger Discrepancy</span>
                        ) : (
                          <span className="text-[var(--success)] font-bold">✓ In Balance</span>
                        )}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm tabular-nums">
                        <thead>
                          <tr className="border-b border-[var(--rule-strong)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold">
                            <th className="py-2 px-3">Item</th>
                            <th className="py-2 px-3 text-right">Open</th>
                            <th className="py-2 px-3 text-right">Recv</th>
                            <th className="py-2 px-3 text-right">Sold</th>
                            <th className="py-2 px-3 text-right">Recorded</th>
                            <th className="py-2 px-3 text-right">Calculated</th>
                            <th className="py-2 px-3 text-right">Var</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--rule)]">
                          {rec.items.map((item) => (
                            <tr key={item.commodity_id} className="hover:bg-[var(--canvas)]">
                              <td className="py-2.5 px-3 font-bold text-[var(--ink)]">{item.commodity_name}</td>
                              <td className="py-2.5 px-3 text-right text-[var(--ink-soft)]">{item.opening}</td>
                              <td className="py-2.5 px-3 text-right text-[var(--success)] font-bold">+{item.received}</td>
                              <td className="py-2.5 px-3 text-right text-[var(--danger)] font-bold">−{item.sold}</td>
                              <td className="py-2.5 px-3 text-right text-[var(--ink)] font-bold">{item.recorded_closing}</td>
                              <td className="py-2.5 px-3 text-right text-[var(--accent-deep)] font-bold">{item.calculated_closing}</td>
                              <td className={`py-2.5 px-3 text-right font-bold ${item.variance_pct > 5 ? 'text-[var(--danger)]' : 'text-[var(--ink-soft)]'}`}>
                                {item.variance_pct}%
                              </td>
                              <td className="py-2.5 px-3">
                                {item.is_discrepant ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1D9CF] text-[var(--danger)] border border-[#D89F8B]">
                                    SHORTFALL
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F0DD] text-[var(--success)] border border-[#B7CFB7]">
                                    BALANCED
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabSection>

        {/* SMS outbox + chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--rule)] pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[var(--authority)]" />
                <div>
                  <h2 className="font-serif font-bold text-lg text-[var(--ink)]">{t.sms_outbox_title}</h2>
                  <p className="text-xs text-[var(--ink-soft)]">{t.sms_outbox_desc}</p>
                </div>
              </div>
              <button
                onClick={fetchAll}
                className="text-xs text-[var(--authority)] hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> {t.refresh}
              </button>
            </div>

            {smsStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm tabular-nums">
                <div className="p-3 rounded-lg bg-[#E6F0DD] border border-[#B7CFB7]">
                  <div className="text-[10px] uppercase font-bold text-[var(--success)]">Sale alerts</div>
                  <div className="text-lg font-black">{smsStats.sale_alerts}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#EAF1E5] border border-[#B7CFB7]">
                  <div className="text-[10px] uppercase font-bold text-[var(--authority)]">Arrival alerts</div>
                  <div className="text-lg font-black">{smsStats.arrival_alerts}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#F1D9CF] border border-[#D89F8B]">
                  <div className="text-[10px] uppercase font-bold text-[var(--danger)]">Shortfall alerts</div>
                  <div className="text-lg font-black">{smsStats.shortfall_alerts}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#F4E9D0] border border-[#D9C28E]">
                  <div className="text-[10px] uppercase font-bold text-[var(--warn)]">Households</div>
                  <div className="text-lg font-black">{smsStats.households_reached}</div>
                </div>
              </div>
            )}

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {smsOutbox.length === 0 ? (
                <div className="text-sm text-[var(--ink-soft)]">
                  No SMS dispatched yet. Process a sale in the Seller portal to see fan-out.
                </div>
              ) : (
                smsOutbox.slice(0, 12).map((sms) => (
                  <div
                    key={sms.id}
                    className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--rule)] text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[var(--ink-soft)]">{sms.card_id}</span>
                        <span className="text-[var(--success)] font-bold">{sms.phone_number}</span>
                        {sms.kind && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                              sms.kind === 'sale'
                                ? 'bg-[#E6F0DD] text-[var(--success)] border border-[#B7CFB7]'
                                : sms.kind === 'arrival'
                                  ? 'bg-[#EAF1E5] text-[var(--authority)] border border-[#B7CFB7]'
                                  : 'bg-[#F1D9CF] text-[var(--danger)] border border-[#D89F8B]'
                            }`}
                          >
                            {sms.kind}
                          </span>
                        )}
                      </div>
                      <span className="text-[var(--ink-soft)]">
                        {new Date(sms.sent_at).toLocaleTimeString('en-GB')}
                      </span>
                    </div>
                    <p className="text-[var(--ink)] text-sm leading-relaxed">&quot;{sms.message}&quot;</p>
                    <div className="text-[10px] text-[var(--ink-soft)] flex items-center gap-2 pt-0.5">
                      <span>DLT Header: GOVKER-PDS</span>
                      <span>· Status: Delivered to Family Device</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <TabSection id="chat">
              <AgentChat
                role="gov"
                lang={lang}
                title={lang === 'ml' ? 'AI ഏജന്റ് — സിവിൽ സപ്ലൈസ് ഡയറക്ടറേറ്റ്' : 'Arizon AI Agent — Directorate'}
                placeholder={lang === 'ml' ? 'AI ഏജന്റിനോട് ചോദിക്കൂ...' : 'Query any shop anomaly, generate leakage audits, or trigger multi-signal checks...'}
                presetPrompts={[
                  { label: 'Audit #402', query: 'Audit Shop #402 Kaloor and explain anomaly rationale' },
                  { label: 'State Summary', query: 'Generate state reconciliation summary for September 2026' },
                  { label: 'Trust Checks', query: 'Explain the 3 signals used to compute trust score for PDS shops' },
                  { label: 'Top Commodity', query: 'Which commodity is being bought the most across Kerala?' },
                ]}
              />
            </TabSection>
          </div>
        </div>
      </main>

      <MobileTabBar
        tabs={[
          { id: 'briefing', label: lang === 'ml' ? 'ബ്രീഫിംഗ്' : 'Briefing', icon: Sparkles },
          { id: 'heatmap', label: lang === 'ml' ? 'ഹീറ്റ്മാപ്പ്' : 'Heatmap', icon: AlertOctagon },
          { id: 'reconciliation', label: lang === 'ml' ? 'ലെഡ്ജർ' : 'Ledger', icon: ScrollText },
          { id: 'chat', label: 'Chat', icon: MessageSquare },
        ]}
      />
    </div>
  );
}

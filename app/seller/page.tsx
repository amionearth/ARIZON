'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Scale,
  PackageCheck,
  AlertTriangle,
  Send,
  RefreshCw,
  CheckCircle2,
  PhoneCall,
  Edit3,
  UploadCloud,
  FileSpreadsheet,
  Download,
  X,
  Boxes,
  ScrollText,
  ShoppingBag,
  MessageSquare,
  Truck,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { EditableCell } from '@/components/EditableCell';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import { Navbar } from '@/components/Navbar';
import { StockBadge } from '@/components/StockBadge';
import { AgentChat } from '@/components/AgentChat';
import MobileTabBar, { TabSection } from '@/components/MobileTabBar';
import { Language, makeT } from '@/lib/translations';

interface StockItem {
  commodity_id: string;
  commodity_name: string;
  unit: string;
  opening: number;
  received: number;
  sold: number;
  closing: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface DeliveryResult {
  delivery_id: string;
  mismatch_flag: boolean;
  variance_pct: number;
  updated_closing: number;
  sms_sent_to_subscribers: number;
  commodity_name?: string;
  message: string;
}

interface SaleResult {
  transaction_id: string;
  new_closing_stock: number;
  sms_broadcast_count: number;
  commodity_name?: string;
  unit?: string;
  shortfall?: number;
  shortage?: number;
  message: string;
}

interface UploadPreviewRow {
  shop_id: string;
  shop_name?: string;
  commodity_id: string;
  commodity_name?: string;
  unit?: string;
  period: string;
  opening: number;
  received: number;
  sold: number;
  closing: number;
  storage_capacity?: number;
  previous: { opening: number; received: number; sold: number; closing: number } | null;
}

interface UploadPreviewResponse {
  action?: 'preview' | 'commit';
  rows?: UploadPreviewRow[];
  invalid?: { row: number; reason: string }[];
  parse_errors?: string[];
  committed?: number;
  summary?: { total_rows: number; valid_rows: number; invalid_rows: number; period_counts: Record<string, number> };
  error?: string;
}

export default function SellerPortal() {
  const [lang, setLang] = useState<Language>('en');
  const t = makeT(lang);

  const [selectedShopId, setSelectedShopId] = useState('shop-402');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [goodsCommId, setGoodsCommId] = useState('comm-matta');
  const [dispatchedQty, setDispatchedQty] = useState('');
  const [weighedQty, setWeighedQty] = useState('');
  const [deliveryResult, setDeliveryResult] = useState<DeliveryResult | null>(null);

  const [simCardId, setSimCardId] = useState('card-KL048821');
  const [simCommId, setSimCommId] = useState('comm-matta');
  const [simQty, setSimQty] = useState('10');
  const [simResult, setSimResult] = useState<SaleResult | null>(null);

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualCommId, setManualCommId] = useState('comm-wheat');
  const [manualQty, setManualQty] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualSuccess, setManualSuccess] = useState(false);

  // Excel upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<UploadPreviewResponse | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // 3-Tier Consignment Supply Orders State
  const [shopSupplyOrders, setShopSupplyOrders] = useState<any[]>([]);
  const [orderActionBusy, setOrderActionBusy] = useState<string | null>(null);
  const [sellerOrderMsg, setSellerOrderMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops?shop_id=${selectedShopId}`);
      const data = await res.json();
      const list: StockItem[] = data.stock ?? [];
      setStockItems(Array.isArray(list) ? list : []);
    } catch {
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopSupplyOrders = async (shopId: string) => {
    try {
      const res = await fetch(`/api/supply-orders?shop_id=${encodeURIComponent(shopId)}`);
      const data = await res.json();
      setShopSupplyOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setShopSupplyOrders([]);
    }
  };

  const handleAdvanceShopOrder = async (orderId: string, action: 'shop_receive' | 'staff_approve') => {
    setOrderActionBusy(orderId);
    setSellerOrderMsg(null);
    try {
      const isReceive = action === 'shop_receive';
      const res = await fetch('/api/supply-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          id: orderId,
          actor: isReceive ? `FPS Dealer (${selectedShopId})` : 'Civil Supplies On-Site Inspector',
          note: isReceive
            ? 'Physical gross weight matched on e-Balance scale'
            : 'Departmental physical ledger sign-off & biometric counter-signature complete',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSellerOrderMsg({
          text: isReceive
            ? `Consignment ${orderId} received & weighed at scale! Awaiting on-site inspector final sign-off.`
            : `Consignment ${orderId} officially approved by Inspector! Ledger balance permanently updated.`,
          ok: true,
        });
        fetchStock();
        fetchShopSupplyOrders(selectedShopId);
      } else {
        setSellerOrderMsg({ text: data.error ?? 'Action failed', ok: false });
      }
    } catch (e: any) {
      setSellerOrderMsg({ text: e.message, ok: false });
    } finally {
      setOrderActionBusy(null);
      setTimeout(() => setSellerOrderMsg(null), 5000);
    }
  };

  useAutoRefresh(() => {
    fetchStock();
    fetchShopSupplyOrders(selectedShopId);
  }, 10000);

  useEffect(() => {
    fetchStock();
    fetchShopSupplyOrders(selectedShopId);
  }, [selectedShopId]);

  const handleGoodsReceived = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchedQty || !weighedQty) return;
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: selectedShopId,
          commodity_id: goodsCommId,
          dispatched_qty: parseFloat(dispatchedQty),
          weighed_qty: parseFloat(weighedQty),
        }),
      });
      const data: DeliveryResult = await res.json();
      setDeliveryResult(data);
      fetchStock();
      setDispatchedQty('');
      setWeighedQty('');
    } catch {
      /* ignore */
    }
  };

  const handleSimulatedSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQty) return;
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: simCardId,
          shop_id: selectedShopId,
          commodity_id: simCommId,
          qty: parseFloat(simQty),
          requested_qty: parseFloat(simQty),
        }),
      });
      const data: SaleResult = await res.json();
      setSimResult(data);
      fetchStock();
    } catch {
      /* ignore */
    }
  };

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQty || !manualNote) return;
    setManualSuccess(true);
    setTimeout(() => setManualSuccess(false), 4000);
    setManualQty('');
    setManualNote('');
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/api/stock?action=template';
    link.download = `arizon-stock-template-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    setUploadPreview(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setUploadFile(null);
      return;
    }
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      setUploadError('Please select an .xlsx, .xls, or .csv file exported from the Arizon template.');
      setUploadFile(null);
      return;
    }
    setUploadFile(f);
  };

  const uploadExcel = async (action: 'preview' | 'commit') => {
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      const res = await fetch(`/api/stock?action=${action}`, { method: 'POST', body: fd });
      const data: UploadPreviewResponse = await res.json();
      if (!res.ok || data.error) {
        setUploadError(data.error ?? `Upload failed (${res.status})`);
      } else {
        setUploadPreview(data);
        if (action === 'commit') {
          setUploadSuccess(
            lang === 'ml'
              ? `${data.committed ?? data.rows?.length ?? 0} സ്റ്റോക്ക് ലെഡ്ജർ വരികൾ സമർപ്പിച്ചു. AI ഏജന്റ് ട്രസ്റ്റ് സ്കോർ പുനഃകണക്കാക്കി.`
              : `Committed ${data.committed ?? data.rows?.length ?? 0} stock ledger rows. AI Agent recomputed trust scores.`,
          );
          fetchStock();
        }
      }
    } catch (e: any) {
      setUploadError(e?.message ?? 'Upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  const resetUpload = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadError(null);
    setUploadSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openingTotal = stockItems.reduce((s, i) => s + i.opening, 0);
  const receivedTotal = stockItems.reduce((s, i) => s + i.received, 0);
  const soldTotal = stockItems.reduce((s, i) => s + i.sold, 0);
  const closingTotal = stockItems.reduce((s, i) => s + i.closing, 0);

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0">
      <Navbar lang={lang} onLanguageChange={setLang} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="surface-strong p-6 sm:p-8 bg-gradient-to-br from-white to-[var(--canvas-deep)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="eyebrow">{lang === 'ml' ? 'റേഷൻ വ്യാപാരി' : 'FPS Dealer'}</p>
            <h1 className="mt-2 font-serif font-bold text-2xl sm:text-4xl text-[var(--ink)] tracking-tight">
              {t.seller_title}
            </h1>
            <p className="mt-2 text-base text-[var(--ink-soft)] leading-relaxed max-w-2xl">
              {t.seller_subtitle}
            </p>
          </div>
          <div className="bg-white border border-[var(--rule-strong)] p-3.5 rounded-lg min-w-[260px]">
            <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5 uppercase tracking-wider">
              {t.shop_select}
            </label>
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="input"
            >
              <option value="shop-402">Kaloor FPS #402 (Kanayannur)</option>
              <option value="shop-114">Fort Kochi FPS #114 (Kochi)</option>
              <option value="shop-308">Palarivattom FPS #308 (Kanayannur)</option>
              <option value="shop-012">Kazhakkoottam FPS #012 (TVM)</option>
              <option value="shop-501">Aluva FPS #501 (Aluva)</option>
              <option value="shop-215">Thrippunithura FPS #215 (Kanayannur)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Stock ledger */}
            <TabSection id="ledger">
              <div className="surface overflow-hidden">
                <div className="authority-strip px-5 sm:px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-[var(--authority)]" />
                    <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                      {t.stock_ledger_title}
                    </h2>
                  </div>
                  <button
                    onClick={fetchStock}
                    className="text-xs text-[var(--authority)] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> {t.refresh}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--rule-strong)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold">
                        <th className="py-2.5 px-4">Commodity</th>
                        <th className="py-2.5 px-3 text-right">{t.opening}</th>
                        <th className="py-2.5 px-3 text-right">{t.received}</th>
                        <th className="py-2.5 px-3 text-right">{t.sold_epos}</th>
                        <th className="py-2.5 px-3 text-right">{t.closing_balance}</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--rule)] tabular-nums">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-[var(--ink-soft)]">
                            {lang === 'ml' ? 'ലോഡ് ചെയ്യുന്നു...' : 'Loading ledger…'}
                          </td>
                        </tr>
                      ) : stockItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-[var(--ink-soft)]">
                            {lang === 'ml'
                              ? 'ഈ കടയിൽ സെപ്റ്റംബർ 2026-ൽ സ്റ്റോക്ക് ഇല്ല.'
                              : 'No stock entries for this shop in September 2026.'}
                          </td>
                        </tr>
                      ) : (
                        stockItems.map((item) => (
                          <tr key={item.commodity_id} className="hover:bg-[var(--canvas)]">
                            <td className="py-3 px-4 font-bold text-[var(--ink)]">{item.commodity_name}</td>
                            <td className="py-3 px-3 text-right text-[var(--ink-soft)]">
                              <EditableCell
                                shop_id={selectedShopId}
                                commodity_id={item.commodity_id}
                                period="2026-09"
                                field="opening"
                                value={item.opening}
                                unit={item.unit}
                                onSaved={() => fetchStock()}
                              />
                            </td>
                            <td className="py-3 px-3 text-right text-[var(--success)] font-semibold">
                              <EditableCell
                                shop_id={selectedShopId}
                                commodity_id={item.commodity_id}
                                period="2026-09"
                                field="received"
                                value={item.received}
                                unit={item.unit}
                                onSaved={() => fetchStock()}
                              />
                            </td>
                            <td className="py-3 px-3 text-right text-[var(--danger)] font-semibold">
                              <EditableCell
                                shop_id={selectedShopId}
                                commodity_id={item.commodity_id}
                                period="2026-09"
                                field="sold"
                                value={item.sold}
                                unit={item.unit}
                                onSaved={() => fetchStock()}
                              />
                            </td>
                            <td className="py-3 px-3 text-right text-[var(--ink)] font-bold">
                              <EditableCell
                                shop_id={selectedShopId}
                                commodity_id={item.commodity_id}
                                period="2026-09"
                                field="closing"
                                value={item.closing}
                                unit={item.unit}
                                onSaved={() => fetchStock()}
                              />
                            </td>
                            <td className="py-3 px-3">
                              <StockBadge status={item.status} lang={lang} size="sm" />
                            </td>
                          </tr>
                        ))
                      )}
                      {stockItems.length > 0 && (
                        <tr className="bg-[var(--canvas)] border-t-2 border-[var(--rule-strong)] font-bold text-[var(--ink)]">
                          <td className="py-3 px-4 text-xs uppercase tracking-wider">
                            {lang === 'ml' ? 'ആകെ' : 'Totals'}
                          </td>
                          <td className="py-3 px-3 text-right text-sm">{openingTotal}</td>
                          <td className="py-3 px-3 text-right text-sm text-[var(--success)]">+{receivedTotal}</td>
                          <td className="py-3 px-3 text-right text-sm text-[var(--danger)]">−{soldTotal}</td>
                          <td className="py-3 px-3 text-right text-base">{closingTotal}</td>
                          <td className="py-3 px-3"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabSection>

            {/* Goods Received & 3-Tier Consignment Verification */}
            <TabSection id="goods">
              <div className="surface p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[var(--authority)]" />
                    <div>
                      <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                        {lang === 'ml' ? 'ചരക്ക് വരവ് & 3-ഘട്ട പരിശോധന' : 'Consignment Deliveries & 3-Tier Scale Verification'}
                      </h2>
                      <p className="text-sm text-[var(--ink-soft)]">
                        Verify transit consignments via e-Balance digital scale and record official departmental staff sign-off.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      fetchStock();
                      fetchShopSupplyOrders(selectedShopId);
                    }}
                    className="text-xs text-[var(--authority)] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> {t.refresh}
                  </button>
                </div>

                {/* Feedback message */}
                {sellerOrderMsg && (
                  <div
                    className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                      sellerOrderMsg.ok
                        ? 'bg-[#E6F0DD] text-[var(--success)] border-[#B7CFB7]'
                        : 'bg-[#F1D9CF] text-[var(--danger)] border-[#D89F8B]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{sellerOrderMsg.text}</span>
                  </div>
                )}

                {/* Active Consignments Awaiting Shopkeeper / Staff Sign-Off */}
                <div className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--rule)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)] flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[var(--authority)]" />
                      {lang === 'ml' ? 'ഈ കടയിലേക്കുള്ള സപ്ലൈ കൺസൈൻമെന്റുകൾ' : 'Consignments Assigned to This Shop'}
                    </h3>
                    <span className="text-[11px] font-mono text-[var(--ink-soft)]">
                      {shopSupplyOrders.length} records
                    </span>
                  </div>

                  {shopSupplyOrders.length === 0 ? (
                    <div className="text-xs text-[var(--ink-soft)] text-center py-4 bg-white rounded-lg border border-[var(--rule)]">
                      No state consignments active for {selectedShopId}. Issue one from the Government portal to test 3-tier delivery.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {shopSupplyOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-3.5 rounded-lg bg-white border border-[var(--rule)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[var(--ink)]">{order.id}</span>
                              <span className="font-bold text-[var(--authority)]">{order.commodity_name ?? order.commodity_id}</span>
                              <span className="font-black text-sm tabular-nums text-[var(--ink)]">
                                {order.allocated_qty} kg
                              </span>
                            </div>
                            <div className="text-xs text-[var(--ink-soft)] mt-0.5 flex items-center gap-2">
                              <span>Period: {order.period}</span>
                              {order.rationale && <span>· &ldquo;{order.rationale}&rdquo;</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {order.status === 'in_transit' && (
                              <button
                                onClick={() => handleAdvanceShopOrder(order.id, 'shop_receive')}
                                disabled={orderActionBusy === order.id}
                                className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                              >
                                <Scale className="w-3.5 h-3.5" />
                                {orderActionBusy === order.id ? 'Weighing…' : 'Weigh & Receive (Scale)'}
                              </button>
                            )}

                            {order.status === 'shop_received' && (
                              <button
                                onClick={() => handleAdvanceShopOrder(order.id, 'staff_approve')}
                                disabled={orderActionBusy === order.id}
                                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                                {orderActionBusy === order.id ? 'Signing…' : 'Staff Final Sign-Off'}
                              </button>
                            )}

                            {order.status === 'staff_approved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F0DD] text-[var(--success)] border border-[#B7CFB7]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified & Locked in Ledger
                              </span>
                            )}

                            {order.status === 'gov_directive' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Awaiting TSO Godown Dispatch
                              </span>
                            )}

                            {order.status === 'supplier_approved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                Staged at Godown
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--rule)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-2">
                    {lang === 'ml' ? 'നേരിട്ടുള്ള റസീപ്റ്റ് രേഖപ്പെടുത്തൽ' : 'Direct Scale Receipt Simulator (Ad-Hoc Consignment)'}
                  </h3>
                </div>

                <form onSubmit={handleGoodsReceived} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                        Commodity
                      </label>
                      <select
                        value={goodsCommId}
                        onChange={(e) => setGoodsCommId(e.target.value)}
                        className="input"
                      >
                        <option value="comm-matta">Matta Rice</option>
                        <option value="comm-kuruva">Kuruva Rice</option>
                        <option value="comm-wheat">Wheat</option>
                        <option value="comm-sugar">Fortified Sugar</option>
                        <option value="comm-kerosene">Kerosene</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                        {t.dispatch_qty}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="e.g. 1000"
                        value={dispatchedQty}
                        onChange={(e) => setDispatchedQty(e.target.value)}
                        className="input font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                        {t.scale_qty}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="e.g. 850 (or 1000)"
                        value={weighedQty}
                        onChange={(e) => setWeighedQty(e.target.value)}
                        className="input font-mono"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full">
                    <Scale className="w-4 h-4" />
                    {t.submit_receipt}
                  </button>
                </form>

                {deliveryResult && (
                  <div
                    className={`p-4 rounded-lg border text-base space-y-2 ${
                      deliveryResult.mismatch_flag
                        ? 'bg-[#F1D9CF] border-[#D89F8B] text-[var(--danger)]'
                        : 'bg-[#E6F0DD] border-[#B7CFB7] text-[var(--success)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {deliveryResult.mismatch_flag ? (
                        <>
                          <AlertTriangle className="w-5 h-5" />
                          {t.mismatch_alert} ({deliveryResult.variance_pct}%)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          {t.match_success}
                        </>
                      )}
                    </div>
                    <div className="text-sm space-y-0.5 tabular-nums">
                      <div>Delivery ID: <span className="font-mono">{deliveryResult.delivery_id}</span></div>
                      <div>Updated Closing: {deliveryResult.updated_closing}</div>
                      <div>Subscribers Notified: {deliveryResult.sms_sent_to_subscribers}</div>
                      <div className="font-sans italic">{deliveryResult.message}</div>
                    </div>
                  </div>
                )}
              </div>
            </TabSection>

            {/* Excel Upload */}
            <TabSection id="upload">
              <div className="surface p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-[var(--authority)]" />
                    <div>
                      <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                        {lang === 'ml' ? 'ബൾക്ക് സ്റ്റോക്ക് അപ്‌ലോഡ് — എക്സൽ' : 'Bulk Stock Upload — Excel'}
                      </h2>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {lang === 'ml'
                          ? 'Arizon ടെംപ്ലേറ്റ് ഡൗൺലോഡ് ചെയ്ത് പൂരിപ്പിച്ച് അപ്‌ലോഡ് ചെയ്യൂ.'
                          : 'Download the Arizon template, fill opening / received / sold / closing rows in Excel, then upload.'}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleDownloadTemplate} className="btn-secondary text-xs">
                    <Download className="w-3.5 h-3.5" /> Template
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <label className="flex-1 cursor-pointer flex items-center gap-2 input">
                    <UploadCloud className="w-5 h-5 text-[var(--authority)] shrink-0" />
                    <span className="text-sm font-semibold text-[var(--ink-soft)] truncate">
                      {uploadFile ? uploadFile.name : lang === 'ml' ? '.xlsx / .csv ഫയൽ തിരഞ്ഞെടുക്കൂ' : 'Click to choose .xlsx / .xls / .csv file'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelected}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => uploadExcel('preview')}
                    disabled={!uploadFile || uploadLoading}
                    className="btn-secondary text-xs"
                  >
                    {uploadLoading && uploadPreview?.action !== 'commit' ? lang === 'ml' ? 'വിശകലനം...' : 'Parsing…' : lang === 'ml' ? 'വ്യത്യാസം കാണുക' : 'Preview Diff'}
                  </button>
                  {uploadFile && (
                    <button
                      type="button"
                      onClick={resetUpload}
                      className="btn-ghost text-xs"
                      aria-label="Clear upload"
                    >
                      <X className="w-3.5 h-3.5" /> {lang === 'ml' ? 'മായ്ക്കുക' : 'Clear'}
                    </button>
                  )}
                </div>

                {uploadError && (
                  <div className="p-3 rounded-lg bg-[#F1D9CF] border border-[#D89F8B] text-[var(--danger)] text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}
                {uploadSuccess && (
                  <div className="p-3 rounded-lg bg-[#E6F0DD] border border-[#B7CFB7] text-[var(--success)] text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                {uploadPreview && uploadPreview.rows && uploadPreview.rows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-[var(--ink-soft)]">
                        {uploadPreview.summary && (
                          <>
                            {lang === 'ml' ? 'വ്യത്യാസം' : 'Preview'}:{' '}
                            <strong>{uploadPreview.summary.valid_rows}</strong> {lang === 'ml' ? 'വരികൾ' : 'rows ready'}
                          </>
                        )}
                      </div>
                      {uploadPreview.action !== 'commit' && (
                        <button
                          type="button"
                          onClick={() => uploadExcel('commit')}
                          disabled={uploadLoading || (uploadPreview.invalid?.length ?? 0) > 0}
                          className="btn-primary text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {lang === 'ml' ? 'സമർപ്പിക്കുക' : 'Commit'} {uploadPreview.rows.length}
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-lg border border-[var(--rule)]">
                      <table className="w-full text-left text-xs tabular-nums">
                        <thead className="sticky top-0 bg-[var(--canvas)]">
                          <tr className="text-[var(--ink-soft)] uppercase tracking-wider">
                            <th className="py-2 px-2">Shop</th>
                            <th className="py-2 px-2">Commodity</th>
                            <th className="py-2 px-2">Period</th>
                            <th className="py-2 px-2 text-right">Open</th>
                            <th className="py-2 px-2 text-right">Recv</th>
                            <th className="py-2 px-2 text-right">Sold</th>
                            <th className="py-2 px-2 text-right">Close</th>
                            <th className="py-2 px-2 text-right">Δ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--rule)]">
                          {uploadPreview.rows.map((r, i) => {
                            const delta = r.closing - (r.previous?.closing ?? 0);
                            return (
                              <tr key={i} className="hover:bg-[#FAEFD9]">
                                <td className="py-1.5 px-2 text-[var(--ink)]">{r.shop_name ?? r.shop_id}</td>
                                <td className="py-1.5 px-2 text-[var(--ink)]">{r.commodity_name ?? r.commodity_id}</td>
                                <td className="py-1.5 px-2">{r.period}</td>
                                <td className="py-1.5 px-2 text-right">{r.opening}</td>
                                <td className="py-1.5 px-2 text-right text-[var(--success)]">{r.received}</td>
                                <td className="py-1.5 px-2 text-right text-[var(--danger)]">{r.sold}</td>
                                <td className="py-1.5 px-2 text-right font-bold">{r.closing}</td>
                                <td className={`py-1.5 px-2 text-right font-bold ${delta === 0 ? 'text-[var(--ink-soft)]' : delta > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                                  {delta > 0 ? '+' : ''}{delta}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </TabSection>

            {/* Fallback Manual Adjustment */}
            <details className="surface">
              <summary className="cursor-pointer p-4 text-sm font-bold text-[var(--ink)] flex items-center gap-2 list-none">
                <Edit3 className="w-4 h-4 text-[var(--authority)]" />
                {lang === 'ml' ? 'മാനുവൽ സ്റ്റോക്ക് ക്രമീകരണം (അടിയന്തരം മാത്രം)' : 'Fallback Manual Stock Adjustment (Emergency Only)'}
              </summary>
              <form onSubmit={handleManualAdjustment} className="mt-3 p-4 pt-3 border-t border-[var(--rule)] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={manualCommId}
                    onChange={(e) => setManualCommId(e.target.value)}
                    className="input"
                  >
                    <option value="comm-wheat">Wheat</option>
                    <option value="comm-sugar">Sugar</option>
                    <option value="comm-kerosene">Kerosene</option>
                  </select>
                  <input
                    type="number"
                    placeholder={lang === 'ml' ? 'ക്രമീകരിച്ച ക്ലോസിംഗ്' : 'Corrected Closing Qty'}
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ml' ? 'കാരണം (ഉദാ: ചോർച്ച)' : 'Audit Reason'}
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="input"
                  />
                </div>
                <button type="submit" className="btn-secondary text-sm">
                  {lang === 'ml' ? 'സമർപ്പിക്കുക' : 'Submit Fallback Adjustment'}
                </button>
                {manualSuccess && (
                  <span className="text-sm text-[var(--success)] font-semibold ml-3">
                    {lang === 'ml' ? 'ഓഡിറ്റ് ട്രെയിലിൽ രേഖപ്പെടുത്തി!' : 'Manual update recorded to audit trail!'}
                  </span>
                )}
              </form>
            </details>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5 space-y-6">
            {/* e-POS Simulator */}
            <TabSection id="sell">
              <div className="surface p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[var(--rule)]">
                  <ShoppingBag className="w-5 h-5 text-[var(--authority)]" />
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[var(--ink)]">{t.epos_sim_title}</h2>
                    <p className="text-sm text-[var(--ink-soft)]">{t.epos_sim_desc}</p>
                  </div>
                </div>

                <form onSubmit={handleSimulatedSale} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1 block">
                      {lang === 'ml' ? 'റേഷൻ കാർഡ് ഐഡി' : 'Ration Card ID'}
                    </label>
                    <input
                      type="text"
                      value={simCardId}
                      onChange={(e) => setSimCardId(e.target.value)}
                      className="input font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1 block">
                        {lang === 'ml' ? 'ഉൽപ്പന്നം' : 'Item'}
                      </label>
                      <select
                        value={simCommId}
                        onChange={(e) => setSimCommId(e.target.value)}
                        className="input"
                      >
                        <option value="comm-matta">Matta Rice</option>
                        <option value="comm-wheat">Wheat</option>
                        <option value="comm-sugar">Fortified Sugar</option>
                        <option value="comm-kerosene">Kerosene</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1 block">
                        {lang === 'ml' ? 'അളവ് (kg)' : 'Sale Qty (kg)'}
                      </label>
                      <input
                        type="number"
                        value={simQty}
                        onChange={(e) => setSimQty(e.target.value)}
                        className="input font-mono"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full">
                    <Send className="w-3.5 h-3.5" />
                    {t.simulate_sale}
                  </button>
                </form>

                {simResult && (
                  <div className="p-3.5 rounded-lg bg-[#EAF1E5] border border-[#B7CFB7] text-sm space-y-1.5">
                    <div className="font-bold text-[var(--authority)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {lang === 'ml' ? 'e-POS വിൽപ്പന രേഖപ്പെടുത്തി!' : 'e-POS Sale Recorded'}
                    </div>
                    <div className="text-xs text-[var(--ink-soft)] space-y-0.5 tabular-nums">
                      <div>Txn ID: <span className="font-mono">{simResult.transaction_id}</span></div>
                      <div>Remaining: {simResult.new_closing_stock} {simResult.unit ?? 'kg'}</div>
                      <div className="font-bold text-[var(--success)] flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" />
                        {lang === 'ml'
                          ? `${simResult.sms_broadcast_count} കുടുംബാംഗങ്ങൾക്ക് SMS അയച്ചു!`
                          : `Multi-Member SMS Broadcast to ${simResult.sms_broadcast_count} family numbers!`}
                      </div>
                      {(simResult.shortfall ?? 0) > 0 && (
                        <div className="font-bold text-[var(--danger)]">
                          {lang === 'ml'
                            ? `${simResult.shortfall ?? 0} kg കുറവ് — ഹ്രസ്ഫോൾഡ് SMS അയച്ചു.`
                            : `Shortfall of ${simResult.shortfall ?? 0}${simResult.unit ?? 'kg'} — shortfall SMS sent.`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabSection>

            <TabSection id="chat">
              <AgentChat
                role="seller"
                lang={lang}
                title={t.seller_ai_title}
                placeholder={t.seller_ai_placeholder}
                presetPrompts={[
                  { label: lang === 'ml' ? 'അരി എത്ര ബാക്കി?' : 'How much rice left?', query: 'How much rice do I have left at Kaloor FPS #402?' },
                  { label: lang === 'ml' ? 'ബേൺ റേറ്റ്' : 'Burn Rate', query: 'Analyze my stock burn rate and advise when sugar will be replenished' },
                  { label: lang === 'ml' ? 'റീക്വസിഷൻ' : 'Taluk Requisition', query: 'What restock quantities should I request from Kanayannur Taluk godown?' },
                ]}
              />
            </TabSection>
          </div>
        </div>
      </main>

      <MobileTabBar
        tabs={[
          { id: 'ledger', label: lang === 'ml' ? 'ലെഡ്ജർ' : 'Ledger', icon: ScrollText },
          { id: 'goods', label: lang === 'ml' ? 'സ്വീകൃതി' : 'Received', icon: PackageCheck },
          { id: 'sell', label: lang === 'ml' ? 'വിൽപ്പന' : 'Sell', icon: ShoppingBag },
          { id: 'upload', label: lang === 'ml' ? 'അപ്‌ലോഡ്' : 'Upload', icon: UploadCloud },
        ]}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Bell,
  CheckCircle2,
  AlertCircle,
  Users,
  CreditCard,
  History,
  Phone,
  Check,
  X,
  Clock,
  Truck,
  PackageCheck,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { StockBadge } from '@/components/StockBadge';
import { AgentChat } from '@/components/AgentChat';
import MobileTabBar, { TabSection } from '@/components/MobileTabBar';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import { Language, makeT } from '@/lib/translations';
import { getSessionCardId, logout } from '@/app/actions/auth';
import { recordUnfulfilledRequest } from '@/app/actions/notify';
import { useRouter } from 'next/navigation';

interface NearbyShop {
  shop_id: string;
  name: string;
  district: string;
  taluk: string;
  distance_km: number;
  stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  available_commodities: {
    commodity_id: string;
    name: string;
    closing: number;
    unit: string;
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  }[];
}

interface TxnRow {
  id: string;
  commodity_id: string;
  commodity_name?: string;
  qty: number;
  unit?: string;
  shop_name?: string;
  timestamp: string;
  confirmation_status: 'PENDING' | 'CONFIRMED' | 'DISPUTED';
}

interface LastDelivery {
  id: string;
  shop_id: string;
  shop_name?: string;
  commodity_id: string;
  commodity_name?: string;
  dispatched_qty: number;
  weighed_qty: number;
  timestamp: string;
  variance_pct: number;
}

interface SmsRow {
  id: number;
  card_id: string;
  phone_number: string;
  message: string;
  sent_at: string;
  kind?: 'sale' | 'arrival' | 'shortfall';
}

export default function CustomerPortal() {
  const [lang, setLang] = useState<Language>('en');
  const t = makeT(lang);
  const router = useRouter();

  const [lat, setLat] = useState(9.9886);
  const [lon, setLon] = useState(76.2905);
  const [selectedLocality, setSelectedLocality] = useState('Kaloor');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [nearbyShops, setNearbyShops] = useState<NearbyShop[]>([]);
  const [transactions, setTransactions] = useState<TxnRow[]>([]);
  const [lastDelivery, setLastDelivery] = useState<LastDelivery | null>(null);
  const [smsReceipts, setSmsReceipts] = useState<SmsRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCardId, setActiveCardId] = useState('card-KL048821');

  const demoCards: Record<string, any> = {
    'card-KL048821': {
      id: 'card-KL048821',
      category: lang === 'ml' ? 'PHH (പിങ്ക് കാർഡ്)' : 'PHH (Priority Household)',
      shop_id: 'shop-402',
      shop_name: 'Kaloor FPS #402',
      members: [
        { name: 'Rajan Pillai', relation: 'Head of Household', phone: '+91 98765 43210' },
        { name: 'Suma Rajan', relation: 'Spouse', phone: '+91 98765 43211' },
        { name: 'Arjun Rajan', relation: 'Son', phone: '+91 98765 43212' },
      ],
      monthly_quota: [
        { item: 'Matta Rice', quota: '20 kg', used: '15 kg', remaining: '5 kg' },
        { item: 'Wheat', quota: '8 kg', used: '5 kg', remaining: '3 kg' },
        { item: 'Fortified Sugar', quota: '2 kg', used: '0 kg', remaining: '2 kg (Shop Stockout)' },
      ],
    },
    'card-KL041234': {
      id: 'card-KL041234',
      category: lang === 'ml' ? 'AAY (മഞ്ഞ കാർഡ്)' : 'AAY (Antyodaya Anna Yojana)',
      shop_id: 'shop-402',
      shop_name: 'Kaloor FPS #402',
      members: [
        { name: 'Mary Thomas', relation: 'Head of Household', phone: '+91 98765 00001' },
        { name: 'Biju Thomas', relation: 'Son', phone: '+91 98765 00002' },
      ],
      monthly_quota: [
        { item: 'Matta Rice', quota: '28 kg', used: '25 kg', remaining: '3 kg' },
        { item: 'Wheat', quota: '7 kg', used: '0 kg', remaining: '7 kg' },
        { item: 'Fortified Sugar', quota: '1 kg', used: '0 kg', remaining: '1 kg (Shop Stockout)' },
      ],
    },
  };
  const demoCard = demoCards[activeCardId] ?? demoCards['card-KL048821'];

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionCard = await getSessionCardId();
        if (sessionCard && demoCards[sessionCard]) setActiveCardId(sessionCard);
        else if (sessionCard) setActiveCardId(sessionCard);
      } catch {
        /* ignore */
      }
    }
    loadSession();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* ignore */
    }
    router.push('/login');
  };

  const fetchNearby = async () => {
    setLoading(true);
    try {
      const url = `/api/shops?lat=${lat}&lon=${lon}${selectedCommodity ? `&commodity=${selectedCommodity}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      const list = data.nearby ?? data.shops ?? [];
      setNearbyShops(Array.isArray(list) ? list : []);
    } catch {
      setNearbyShops([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchContext = async () => {
    try {
      const [txRes, delRes, smsRes] = await Promise.all([
        fetch(`/api/transactions?card_id=${encodeURIComponent(demoCard.id)}`),
        fetch(`/api/deliveries`),
        fetch(`/api/sms`),
      ]);
      const txData = await txRes.json();
      const delData = await delRes.json();
      const smsData = await smsRes.json();
      const txList: TxnRow[] = txData.transactions ?? [];
      setTransactions(Array.isArray(txList) ? txList : []);
      const delList: any[] = delData.deliveries ?? [];
      const shopDel = delList.find((d) => d.shop_id === demoCard.shop_id);
      if (shopDel) setLastDelivery(shopDel);
      const smsList: SmsRow[] = (smsData.outbox ?? []).filter(
        (s: SmsRow) => s.card_id === demoCard.id,
      );
      setSmsReceipts(smsList.slice(0, 6));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [lat, lon, selectedCommodity]);

  useEffect(() => {
    fetchContext();
  }, [demoCard.id]);

  useAutoRefresh(() => {
    fetchNearby();
    fetchContext();
  }, 15000);

  const handleLocalityChange = (loc: string, newLat: number, newLon: number) => {
    setSelectedLocality(loc);
    setLat(newLat);
    setLon(newLon);
  };

  const handleSubscribe = async (shopId: string, commodityId: string, commName: string) => {
    try {
      const res = await recordUnfulfilledRequest(shopId, commodityId);
      if (res?.success) {
        setSubscriptions((prev) => ({ ...prev, [`${shopId}-${commodityId}`]: true }));
        setAlertMessage(
          lang === 'ml'
            ? `${commName} എത്തുമ്പോൾ ഈ കാർഡിലെ (${res.card_id}) എല്ലാ കുടുംബാംഗങ്ങൾക്കും SMS അറിയിപ്പ് ലഭിക്കും.`
            : `Subscribed! All registered family members under Card #${res.card_id} will receive an SMS arrival alert when ${commName} is weighed at the shop.`,
        );
        setTimeout(() => setAlertMessage(null), 6000);
      }
    } catch {
      /* ignore */
    }
  };

  const handleConfirmTransaction = async (txId: string, confirmed: boolean) => {
    try {
      await fetch('/api/confirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId, confirmed }),
      });
      fetchContext();
      setAlertMessage(
        confirmed
          ? lang === 'ml'
            ? 'വാങ്ങൽ സ്ഥിരീകരിച്ചു. PDS വാങ്ങൽ പരിശോധിച്ചതിന് നന്ദി.'
            : 'Transaction confirmed. Thank you for validating your PDS ration purchase.'
          : lang === 'ml'
            ? 'ഗോസ്റ്റ് ട്രാൻസാക്ഷൻ ഫ്ലാഗ് ചെയ്തു. സിവിൽ സപ്ലൈസ് പരാതി രേഖപ്പെടുത്തി.'
            : 'Ghost transaction flagged. Civil Supplies grievance recorded.',
      );
      setTimeout(() => setAlertMessage(null), 5000);
    } catch {
      /* ignore */
    }
  };

  const filteredShops = nearbyShops.filter((shop) =>
    [shop.name, shop.district, shop.taluk].some((v) =>
      v?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0">
      <Navbar lang={lang} onLanguageChange={setLang} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Banner */}
        <div className="surface-strong p-6 sm:p-8 bg-gradient-to-br from-white to-[var(--canvas-deep)]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="eyebrow">{lang === 'ml' ? 'പൗര പോർട്ടൽ' : 'Citizen Portal'}</p>
              <h1 className="mt-2 font-serif font-bold text-2xl sm:text-4xl text-[var(--ink)] tracking-tight">
                {t.cust_title}
              </h1>
              <p className="mt-2 text-base text-[var(--ink-soft)] leading-relaxed max-w-2xl">
                {t.cust_subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleLogout} className="btn-secondary text-sm">
                {lang === 'ml' ? 'ലോഗൗട്ട്' : 'Logout'}
              </button>
            </div>
          </div>
        </div>

        {alertMessage && (
          <div className="p-4 rounded-lg bg-[#E6F0DD] border border-[#B7CFB7] text-[var(--success)] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-base font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{alertMessage}</span>
            </div>
            <button onClick={() => setAlertMessage(null)} className="p-1 hover:bg-[#D4E5C9] rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: stock + bill + supply strip */}
          <div className="lg:col-span-8 space-y-6">
            {/* Ration Bill Card */}
            <TabSection id="bill">
              <div className="surface overflow-hidden">
                <div className="authority-strip px-5 sm:px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[var(--authority)]" />
                    <h2 className="font-serif font-bold text-lg sm:text-xl text-[var(--ink)]">
                      {lang === 'ml' ? 'റേഷൻ ബിൽ' : 'My Ration Bill'} · September 2026
                    </h2>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-bold">
                    {lang === 'ml' ? 'NFSA 2026' : 'NFSA 2026'}
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  {/* Cardholder header */}
                  <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-dashed border-[var(--rule-strong)]">
                    <div className="w-12 h-12 rounded-md bg-[var(--authority)] text-white flex items-center justify-center font-serif font-bold text-lg">
                      {demoCard.id.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <div className="font-serif font-bold text-base text-[var(--ink)]">
                        {demoCard.members[0].name}
                      </div>
                      <div className="text-xs text-[var(--ink-soft)] font-mono">
                        {demoCard.id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold">
                        {lang === 'ml' ? 'വിഭാഗം' : 'Category'}
                      </div>
                      <div className="text-xs font-bold text-[var(--danger)]">{demoCard.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-bold">
                        {lang === 'ml' ? 'കട' : 'Shop'}
                      </div>
                      <div className="text-xs font-bold text-[var(--ink)]">{demoCard.shop_name}</div>
                    </div>
                  </div>

                  {/* Bill table */}
                  <div className="mt-4">
                    <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider font-bold text-[var(--ink-soft)] pb-2 border-b border-[var(--rule-strong)]">
                      <div className="col-span-4">{lang === 'ml' ? 'ഉൽപ്പന്നം' : 'Item'}</div>
                      <div className="col-span-2 text-right">{lang === 'ml' ? 'അനുവദം' : 'Entitled'}</div>
                      <div className="col-span-2 text-right">{lang === 'ml' ? 'വാങ്ങിയത്' : 'Taken'}</div>
                      <div className="col-span-2 text-right">{lang === 'ml' ? 'ബാക്കി' : 'Balance'}</div>
                      <div className="col-span-2 text-right">{lang === 'ml' ? 'സ്റ്റോക്ക്' : 'Stock'}</div>
                    </div>

                    {demoCard.monthly_quota.map((q: any, idx: number) => {
                      const isOut = q.remaining.includes('Stockout');
                      return (
                        <div
                          key={idx}
                          className="bill-row py-3 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center"
                        >
                          <div className="col-span-4 font-bold text-base text-[var(--ink)]">{q.item}</div>
                          <div className="col-span-2 text-right tabular-nums text-[var(--ink)] sm:mt-0 mt-1">
                            <span className="sm:hidden text-[var(--ink-soft)] mr-2 text-xs uppercase">
                              {lang === 'ml' ? 'അനുവദം' : 'Entitled'}:
                            </span>
                            {q.quota}
                          </div>
                          <div className="col-span-2 text-right tabular-nums text-[var(--success)] font-semibold sm:mt-0 mt-1">
                            <span className="sm:hidden text-[var(--ink-soft)] mr-2 text-xs uppercase">
                              {lang === 'ml' ? 'വാങ്ങിയത്' : 'Taken'}:
                            </span>
                            {q.utilized}
                          </div>
                          <div
                            className={`col-span-2 text-right tabular-nums font-bold sm:mt-0 mt-1 ${
                              isOut ? 'text-[var(--danger)]' : 'text-[var(--ink)]'
                            }`}
                          >
                            <span className="sm:hidden text-[var(--ink-soft)] mr-2 text-xs uppercase">
                              {lang === 'ml' ? 'ബാക്കി' : 'Balance'}:
                            </span>
                            {q.remaining}
                          </div>
                          <div className="col-span-2 text-right sm:mt-0 mt-1">
                            <StockBadge
                              status={isOut ? 'OUT_OF_STOCK' : idx === 2 ? 'LOW_STOCK' : 'IN_STOCK'}
                              lang={lang}
                              size="sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Supply strip */}
                  {lastDelivery && (
                    <div className="mt-5 p-3.5 rounded-lg bg-[#EAF1E5] border border-[#B7CFB7] flex items-start gap-3">
                      <Truck className="w-5 h-5 text-[var(--authority)] shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-bold text-[var(--authority)]">
                          {lang === 'ml' ? 'അവസാന ഡെലിവറി' : 'Last delivery'}
                        </div>
                        <div className="text-[var(--ink)] mt-0.5">
                          {lang === 'ml'
                            ? `${lastDelivery.weighed_qty} kg ${lastDelivery.commodity_name} എത്തി, ${new Date(lastDelivery.timestamp).toLocaleDateString('en-IN')}.`
                            : `${lastDelivery.weighed_qty} kg ${lastDelivery.commodity_name} received on ${new Date(lastDelivery.timestamp).toLocaleDateString('en-IN')}.`}
                          {lastDelivery.variance_pct > 5 && (
                            <span className="ml-2 text-[var(--danger)] font-bold">
                              {lang === 'ml'
                                ? `(${lastDelivery.variance_pct}% കുറവ് — ഓഡിറ്റ് ഫ്ലാഗ്)`
                                : `(${lastDelivery.variance_pct}% shortfall — audit flagged)`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabSection>

            {/* Stock search */}
            <TabSection id="stock">
              <div className="surface p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--ink-faint)]" />
                    <input
                      type="text"
                      placeholder={t.search_shop}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10 text-base"
                    />
                  </div>
                  <select
                    value={selectedCommodity}
                    onChange={(e) => setSelectedCommodity(e.target.value)}
                    className="input text-base"
                  >
                    <option value="">{t.select_commodity}</option>
                    <option value="comm-matta">Matta Rice (മട്ട)</option>
                    <option value="comm-kuruva">Kuruva Rice (കുറുവ)</option>
                    <option value="comm-wheat">Wheat (ഗോതമ്പ്)</option>
                    <option value="comm-sugar">Fortified Sugar (പഞ്ചസാര)</option>
                    <option value="comm-kerosene">Kerosene (മണ്ണെണ്ണ)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
                  <span className="text-xs font-semibold text-[var(--ink-soft)] flex items-center gap-1 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-[var(--authority)]" /> {lang === 'ml' ? 'പ്രദേശം' : 'Locality'}:
                  </span>
                  {[
                    { name: 'Kaloor', ml: 'കലൂർ', lat: 9.9886, lon: 76.2905 },
                    { name: 'Fort Kochi', ml: 'ഫോർട്ട് കൊച്ചി', lat: 9.9631, lon: 76.2425 },
                    { name: 'Palarivattom', ml: 'പാലാരിവട്ടം', lat: 10.0017, lon: 76.3083 },
                    { name: 'Kazhakkoottam', ml: 'കഴക്കൂട്ടം', lat: 8.5721, lon: 76.8769 },
                  ].map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => handleLocalityChange(loc.name, loc.lat, loc.lon)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition shrink-0 border ${
                        selectedLocality === loc.name
                          ? 'bg-[var(--authority)] text-white border-[var(--authority)]'
                          : 'bg-white text-[var(--ink)] border-[var(--rule)] hover:bg-[var(--canvas-deep)]'
                      }`}
                    >
                      {lang === 'ml' ? loc.ml : loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </TabSection>

            {filteredShops.length > 0 && (
              <div className="space-y-4">
                {filteredShops.map((shop) => (
                  <div
                    key={shop.shop_id}
                    className="surface p-5 hover:border-[var(--accent)] transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--rule)]">
                      <div>
                        <h3 className="font-serif font-bold text-base text-[var(--ink)]">{shop.name}</h3>
                        <p className="text-xs text-[var(--ink-soft)]">
                          {shop.taluk} Taluk, {shop.district} District
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--canvas-deep)] text-[var(--ink)] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[var(--authority)]" />
                          {shop.distance_km} km
                        </span>
                        <StockBadge status={shop.stock_status} lang={lang} />
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                        {t.item_availability}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(shop.available_commodities ?? []).map((item) => {
                          const subKey = `${shop.shop_id}-${item.commodity_id}`;
                          const isSubbed = !!subscriptions[subKey];
                          return (
                            <div
                              key={item.commodity_id}
                              className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--rule)] flex flex-col gap-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-[var(--ink)]">{item.name}</span>
                                <StockBadge status={item.status} closing={item.closing} unit={item.unit} lang={lang} size="sm" />
                              </div>
                              {item.status !== 'IN_STOCK' && (
                                <button
                                  onClick={() => handleSubscribe(shop.shop_id, item.commodity_id, item.name)}
                                  disabled={isSubbed}
                                  className={`min-h-[44px] w-full px-2 rounded-md text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
                                    isSubbed
                                      ? 'bg-[#E6F0DD] text-[var(--success)] border border-[#B7CFB7]'
                                      : 'btn-primary'
                                  }`}
                                >
                                  <Bell className="w-3.5 h-3.5" />
                                  {isSubbed ? t.subscribed : t.notify_me}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: SMS receipts + agent chat */}
          <div className="lg:col-span-4 space-y-6">
            {/* SMS Receipts Panel */}
            <TabSection id="sms">
              <div className="surface p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-[var(--rule)]">
                  <MessageSquare className="w-5 h-5 text-[var(--authority)]" />
                  <h2 className="font-serif font-bold text-base text-[var(--ink)]">
                    {lang === 'ml' ? 'SMS രസീത്തുകൾ' : 'SMS Receipts'}
                  </h2>
                </div>
                <p className="text-xs text-[var(--ink-soft)] mt-2 mb-3">
                  {lang === 'ml'
                    ? 'ഓരോ വിൽപ്പനയും എല്ലാ ആധാർ-ലിങ്ക്ഡ് കുടുംബാംഗങ്ങൾക്കും അയയ്ക്കുന്നു.'
                    : 'Every sale alerts every Aadhaar-linked family member.'}
                </p>
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                  {smsReceipts.length === 0 ? (
                    <p className="text-xs text-[var(--ink-soft)] italic">
                      {lang === 'ml'
                        ? 'ഇതുവരെ SMS അയച്ചിട്ടില്ല. വിൽപ്പന നടത്തുമ്പോൾ ഇവിടെ കാണാം.'
                        : 'No SMS dispatched yet. Process a sale to see fan-out here.'}
                    </p>
                  ) : (
                    smsReceipts.map((sms) => (
                      <div
                        key={sms.id}
                        className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--rule)]"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[var(--ink-soft)]">{sms.phone_number}</span>
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
                          <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                        </div>
                        <p className="text-xs text-[var(--ink)] mt-1.5 leading-relaxed">
                          &quot;{sms.message}&quot;
                        </p>
                        <div className="text-[10px] text-[var(--ink-soft)] mt-1">
                          {new Date(sms.sent_at).toLocaleString('en-GB')} · GOVKER-PDS
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabSection>

            {/* Purchase history (compact) */}
            <TabSection id="history">
              <div className="surface p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-[var(--authority)]" />
                    <h2 className="font-serif font-bold text-base text-[var(--ink)]">
                      {t.purchase_history}
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                    {lang === 'ml' ? 'ഗോസ്റ്റ് ക്ലെയിം ട്രാക്കർ' : 'Ghost-claim tracker'}
                  </span>
                </div>
                <div className="space-y-2.5 mt-3">
                  {transactions.length === 0 ? (
                    <p className="text-xs text-[var(--ink-soft)] italic">
                      {lang === 'ml'
                        ? 'ഈ കാർഡിന് മുമ്പ് വാങ്ങലുകൾ ഇല്ല.'
                        : 'No prior transactions for this card.'}
                    </p>
                  ) : (
                    transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="p-3 rounded-lg bg-[var(--canvas)] border border-[var(--rule)]">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <div className="font-bold text-[var(--ink)]">{tx.commodity_name ?? tx.commodity_id}</div>
                            <div className="text-xs text-[var(--ink-soft)] tabular-nums">
                              {tx.qty} {tx.unit ?? 'kg'} · {tx.shop_name}
                            </div>
                            <div className="text-[10px] text-[var(--ink-soft)] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(tx.timestamp).toLocaleString('en-GB')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {tx.confirmation_status === 'CONFIRMED' ? (
                              <span className="text-xs font-bold text-[var(--success)] flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> {lang === 'ml' ? 'സ്ഥിരീകരിച്ചു' : 'Verified'}
                              </span>
                            ) : tx.confirmation_status === 'DISPUTED' ? (
                              <span className="text-xs font-bold text-[var(--danger)] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> {lang === 'ml' ? 'ഫ്ലാഗ്' : 'Flagged'}
                              </span>
                            ) : (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleConfirmTransaction(tx.id, true)}
                                  className="min-h-[40px] min-w-[40px] rounded-md bg-[var(--success)] hover:bg-[#3F6934] text-white text-xs font-semibold flex items-center justify-center gap-1 px-2"
                                >
                                  <Check className="w-3.5 h-3.5" /> {lang === 'ml' ? 'ശരി' : 'OK'}
                                </button>
                                <button
                                  onClick={() => handleConfirmTransaction(tx.id, false)}
                                  className="min-h-[40px] min-w-[40px] rounded-md bg-[var(--danger)] hover:bg-[#93391F] text-white text-xs font-semibold flex items-center justify-center gap-1 px-2"
                                >
                                  <X className="w-3.5 h-3.5" /> {lang === 'ml' ? 'ഫ്ലാഗ്' : 'Flag'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabSection>

            {/* Cardholder info (compact) */}
            <TabSection id="card">
              <div className="surface p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-[var(--rule)]">
                  <CreditCard className="w-5 h-5 text-[var(--authority)]" />
                  <h2 className="font-serif font-bold text-base text-[var(--ink)]">
                    {t.entitlement_title}
                  </h2>
                </div>
                <div className="space-y-2 text-sm mt-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">{t.card_number}:</span>
                    <span className="font-mono font-bold text-[var(--ink)]">{demoCard.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">{t.category}:</span>
                    <span className="font-bold text-[var(--danger)]">{demoCard.category}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--rule)]">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-soft)] flex items-center gap-1.5 mb-2">
                    <Phone className="w-3.5 h-3.5 text-[var(--authority)]" />
                    {t.family_members}
                  </div>
                  <div className="space-y-1.5">
                    {demoCard.members.map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[var(--canvas)] border border-[var(--rule)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[var(--ink)]">{m.name}</div>
                          <div className="text-[10px] text-[var(--ink-soft)]">{m.relation}</div>
                        </div>
                        <span className="font-mono text-[var(--authority)]">{m.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabSection>
          </div>
        </div>
      </main>

      {/* Floating chat bubble */}
      <AgentChat
        role="customer"
        lang={lang}
        title={t.chat_title}
        placeholder={t.chat_placeholder}
        presetPrompts={[
          { label: lang === 'ml' ? 'കലൂരിൽ അരി ഉണ്ടോ?' : 'Matta Rice at Kaloor?', query: 'Is Matta rice available near Kaloor?' },
          { label: lang === 'ml' ? 'കലൂരിൽ അരി ലഭ്യമാണോ?' : 'കലൂർ റേഷൻ കടയിൽ മട്ട അരി ലഭ്യമാണോ?', query: 'കലൂർ റേഷൻ കടയിൽ മട്ട അരി ലഭ്യമാണോ?' },
          { label: lang === 'ml' ? 'പഞ്ചസാര അറിയിപ്പ്' : 'Notify for Sugar', query: 'Notify me when fortified sugar arrives at Kaloor FPS #402' },
        ]}
      />

      <MobileTabBar
        tabs={[
          { id: 'stock', label: lang === 'ml' ? 'സ്റ്റോക്ക്' : 'Stock', icon: PackageCheck },
          { id: 'bill', label: lang === 'ml' ? 'ബിൽ' : 'My Bill', icon: FileText },
          { id: 'sms', label: 'SMS', icon: MessageSquare },
          { id: 'history', label: lang === 'ml' ? 'ചരിത്രം' : 'History', icon: History },
        ]}
      />
    </div>
  );
}

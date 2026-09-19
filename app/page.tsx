'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Users,
  Store,
  Scale,
  Bell,
  ArrowRight,
  Building2,
  Truck,
  ShieldCheck,
  Activity,
  TrendingUp,
  FileText,
  Languages,
} from 'lucide-react';
import { Language, makeT } from '@/lib/translations';

export default function HomePage() {
  const [lang, setLang] = useState<Language>('en');
  const t = makeT(lang);

  const stats = [
    {
      label: lang === 'ml' ? 'രേഷൻ കടകൾ' : 'Ration Shops Online',
      value: '14,200+',
      icon: <Store className="w-5 h-5" />,
    },
    {
      label: lang === 'ml' ? 'കുടുംബങ്ങൾ' : 'Families Covered',
      value: '95.9L',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: lang === 'ml' ? 'e-Balance സ്കെയിൽ' : 'e-Balance Verified',
      value: '100%',
      icon: <Scale className="w-5 h-5" />,
    },
    {
      label: lang === 'ml' ? 'SMS ഫാൻ-ഔട്ട്' : 'SMS Family Reach',
      value: '3.4M/yr',
      icon: <Bell className="w-5 h-5" />,
    },
  ];

  const portals = [
    {
      href: '/customer',
      title: lang === 'ml' ? 'ഉപഭോക്താവ്' : 'Customer',
      mlTitle: 'ഉപഭോക്താവ്',
      desc:
        lang === 'ml'
          ? 'അടുത്തുള്ള കടകളിലെ സ്റ്റോക്ക് പരിശോധിക്കുക. ലഭ്യമാകുമ്പോൾ SMS അലർട്ട് നേടുക.'
          : 'Find nearby ration shops, check live stock, and subscribe for arrival alerts.',
      icon: <Users className="w-6 h-6" />,
      badge: lang === 'ml' ? 'സൗജന്യ ലോഗിൻ' : 'Free Login',
    },
    {
      href: '/seller',
      title: lang === 'ml' ? 'വ്യാപാരി' : 'Seller (FPS Dealer)',
      mlTitle: 'വ്യാപാരി',
      desc:
        lang === 'ml'
          ? 'ഡെലിവറി ലോഗ് ചെയ്യുക, ബയോമെട്രിക് വിൽപ്പന നടത്തുക, SMS അയക്കുക.'
          : 'Log deliveries, process e-POS sales, broadcast household SMS alerts.',
      icon: <Store className="w-6 h-6" />,
      badge: 'e-Balance + e-POS',
    },
    {
      href: '/supplier',
      title: lang === 'ml' ? 'വിതരണക്കാരൻ' : 'Supplier (Taluk)',
      mlTitle: 'വിതരണക്കാരൻ',
      desc:
        lang === 'ml'
          ? 'താലൂക്ക് തലത്തിൽ AI ഡിമാൻഡ് പ്രവചനം, ഒപ്റ്റിമൽ വിതരണ വെക്ടർ.'
          : 'Taluk-level AI forecasts, optimal grain allocation vectors.',
      icon: <Truck className="w-6 h-6" />,
      badge: 'AI Agent Optimizer',
    },
    {
      href: '/gov',
      title: lang === 'ml' ? 'സർക്കാർ' : 'Government (Directorate)',
      mlTitle: 'സർക്കാർ',
      desc:
        lang === 'ml'
          ? 'മൾട്ടി-സിഗ്നൽ ട്രസ്റ്റ് സ്കോർ, ഓഡിറ്റ് ഇൻസ്പെക്ടർ, റിയൽ-ടൈം അനോമലി.'
          : 'Multi-signal trust scoring, audit inspector, real-time anomaly heatmap.',
      icon: <Building2 className="w-6 h-6" />,
      badge: '3-Signal Audit',
    },
  ];

  const features = [
    {
      icon: <Scale className="w-5 h-5 text-[var(--authority)]" />,
      title: lang === 'ml' ? 'e-Balance വെയിറ്റ് വെരിഫിക്കേഷൻ' : 'e-Balance Weight Verification',
      desc:
        lang === 'ml'
          ? 'ഗോഡൗണിൽ നിന്ന് അയച്ചതിനേക്കാൾ 5% കുറവ് വാങ്ങിയാൽ സ്വയം ഫ്ലാഗ്.'
          : 'Auto-flag when scale weight is >5% lower than warehouse dispatch.',
    },
    {
      icon: <Bell className="w-5 h-5 text-[var(--authority)]" />,
      title: lang === 'ml' ? 'മൾട്ടി-മെമ്പർ SMS ഫാൻ-ഔട്ട്' : 'Multi-Member SMS Fan-Out',
      desc:
        lang === 'ml'
          ? 'ഒരു വിൽപ്പന മുഴുവൻ കുടുംബത്തിലേക്കും SMS — ഗോസ്റ്റ് ക്ലെയിം ഇല്ലാതാക്കുന്നു.'
          : 'Every sale alerts every Aadhaar-linked family member — no ghost claims.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[var(--authority)]" />,
      title: lang === 'ml' ? '3-സിഗ്നൽ ട്രസ്റ്റ് എഞ്ചിൻ' : '3-Signal Trust Engine',
      desc:
        lang === 'ml'
          ? 'വെയിറ്റ്, സിറ്റിസൺ കൺഫർമേഷൻ, വെലോസിറ്റി — മൂന്ന് സിഗ്നലുകൾ ഒരുമിച്ച്.'
          : 'Weight variance + citizen confirmation + transaction velocity cross-check.',
    },
    {
      icon: <Activity className="w-5 h-5 text-[var(--authority)]" />,
      title: lang === 'ml' ? 'മാസാന്ത റീകൺസിലിയേഷൻ' : 'Month-End Auto Reconciliation',
      desc:
        lang === 'ml'
          ? 'Closing = Opening + Received − Sold. ബുക്ക് തെറ്റ് സ്വയം കണ്ടെത്തുന്നു.'
          : 'Closing = Opening + Received − Sold. Closes the book-fraud loop.',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-[var(--authority)]" />,
      title: lang === 'ml' ? 'AI ഡിമാൻഡ് ഫോർകാസ്റ്റ്' : 'AI Demand Forecast',
      desc:
        lang === 'ml'
          ? 'ഓണം/ഫെസ്റ്റിവൽ സീസൺ മൾട്ടിപ്ലയർ ഉൾപ്പെടുത്തി 3 മാസം മുന്നോട്ട്.'
          : '3-month horizon with Onam/festive multipliers baked in.',
    },
    {
      icon: <FileText className="w-5 h-5 text-[var(--authority)]" />,
      title: lang === 'ml' ? 'AI അസിസ്റ്റന്റ്' : 'Arizon AI Agent',
      desc:
        lang === 'ml'
          ? 'റോൾ-സ്കോപ്പ്ഡ് ടൂൾ കോളിംഗ് — ഓരോ പോർട്ടലിനും സ്വന്തം AI ബ്രെയിൻ.'
          : 'Role-scoped tool calling — each portal has its own AI brain.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Letterhead header */}
      <header className="authority-strip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-[var(--authority)] text-white flex items-center justify-center font-serif font-bold text-xl">
              അ
            </div>
            <div className="leading-tight">
              <div className="font-serif font-bold text-xl text-[var(--ink)]">
                {lang === 'ml' ? 'അരിസോൺ — സ്മാർട്ട് PDS' : 'Arizon — Smart PDS'}
              </div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)] font-semibold">
                {lang === 'ml'
                  ? 'കേരള സിവിൽ സപ്ലൈസ് & ഉപഭോക്തൃ കാര്യ വകുപ്പ്'
                  : 'Kerala Civil Supplies & Consumer Affairs Department'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
            className="min-h-[48px] px-4 inline-flex items-center gap-2 text-sm font-semibold rounded-md border border-[var(--authority)] text-[var(--authority)] hover:bg-[var(--authority)] hover:text-white transition"
            aria-label="Toggle language"
          >
            <Languages className="w-4 h-4" />
            {lang === 'ml' ? 'English' : 'മലയാളം'}
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — letterhead card, no dark gradient */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="surface-strong p-6 sm:p-10 lg:p-14 bg-gradient-to-br from-white to-[var(--canvas-deep)]">
            <p className="eyebrow mb-3">
              {lang === 'ml' ? 'SC-09 ഹാക്കത്തോൺ 2026' : 'SC-09 Hackathon 2026'}
            </p>
            <h1 className="font-serif font-bold text-3xl sm:text-5xl lg:text-6xl text-[var(--ink)] tracking-tight leading-[1.15] max-w-4xl">
              {lang === 'ml'
                ? 'റേഷൻ കടയിലെ സ്റ്റോക്ക് ഇനി വിരലറ്റത്ത്'
                : 'Ration Shop Stock, Now At Your Fingertips'}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[var(--ink-soft)] max-w-3xl leading-relaxed">
              {lang === 'ml'
                ? 'നിങ്ങളുടെ അടുത്തുള്ള കടയിൽ അരിയും പഞ്ചസാരയും ഉണ്ടോ? ലഭ്യമാകുമ്പോൾ അറിയണോ? കേരള PDS-ന്റെ 14,200+ കടകളെ ഒരൊറ്റ AI കോറിലൂടെ ബന്ധിപ്പിച്ച്, അഴിമതിയും ഗോസ്റ്റ് ക്ലെയിമും ഇല്ലാതാക്കുന്ന ഒരു സമ്പൂർണ്ണ വിശ്വസ്തത എഞ്ചിൻ.'
                : "See live stock at your nearest Fair Price Shop, get an SMS the moment your ration arrives, and let AI cross-check every kilogram from godown to your kitchen — closing the 28% leakage gap in Kerala's PDS."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">
                {lang === 'ml' ? 'പൗര ലോഗിൻ' : 'Citizen Login'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/gov" className="btn-secondary">
                {lang === 'ml' ? 'സർക്കാർ ഡാഷ്ബോർഡ്' : 'Government Dashboard'}
              </Link>
            </div>
          </div>
        </section>

        {/* Plain bordered metric cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="surface p-4 sm:p-5">
                <div className="flex items-center gap-2 text-[var(--authority)] eyebrow">
                  {s.icon}
                  {s.label}
                </div>
                <div className="mt-2 font-serif font-bold text-3xl sm:text-4xl text-[var(--ink)] tabular-nums">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Problem statement */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 surface p-6 sm:p-8">
              <p className="eyebrow text-[var(--danger)]">
                {lang === 'ml' ? 'യഥാർത്ഥ പ്രശ്നം' : 'The Real Problem'}
              </p>
              <h2 className="mt-3 font-serif font-bold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
                {lang === 'ml'
                  ? 'ഗോഡൗണിൽ നിന്ന് അടുക്കള വരെ — എവിടെ ആണ് ചോർച്ച?'
                  : 'From godown to kitchen — where is the leakage?'}
              </h2>
              <p className="mt-3 text-base text-[var(--ink-soft)] leading-relaxed">
                {lang === 'ml'
                  ? 'കേരളത്തിലെ 14,200+ റേഷൻ കടകളിൽ e-POS ബയോമെട്രിക് ഉണ്ട്, പക്ഷേ 28% ധാന്യം യഥാർത്ഥ ഗുണഭോക്താക്കളിൽ എത്തുന്നില്ല. ഡീലർമാർ രഹസ്യമായി കാർഡുടമകളുടെ ബയോമെട്രിക് ഉപയോഗിക്കുന്നു, ഗോഡൗണിൽ നിന്ന് കടയിലേക്കുള്ള യാത്രയിൽ 10-20% തിടുക്കുന്നു. ഗ്രാമീണ കുടുംബങ്ങൾ മണിക്കൂറുകളോളം യാത്ര ചെയ്ത് കടയിൽ എത്തിയാൽ, "സ്റ്റോക്ക് ഇല്ല" എന്ന മറുപടി.'
                  : 'Kerala has 14,200+ FPS with biometric e-POS — yet audits show ~28% of allocated grain never reaches genuine beneficiaries. Dealers run ghost transactions on unaware cards; 10–20% of dispatched grain vanishes in transit. Rural families lose half a day only to find the shop is out of stock.'}
              </p>
            </div>
            <div className="surface p-6 sm:p-8 bg-[var(--authority)] text-white border-[var(--authority-deep)]">
              <p className="eyebrow text-[#C8E1CB]">
                {lang === 'ml' ? 'ഞങ്ങളുടെ പരിഹാരം' : 'Our Solution'}
              </p>
              <h3 className="mt-3 font-serif font-bold text-xl">
                {lang === 'ml' ? 'ഒരൊറ്റ AI കോർ, നാല് പോർട്ടൽ' : 'One AI Core, Four Portals'}
              </h3>
              <ul className="mt-4 space-y-3 text-base">
                {[
                  lang === 'ml'
                    ? 'ഓരോ കടയിലെയും SKU-തല സ്റ്റോക്ക് ദൃശ്യമാക്കുന്നു.'
                    : 'SKU-level live stock at every shop.',
                  lang === 'ml'
                    ? 'e-Balance സ്കെയിൽ വെരിഫിക്കേഷൻ — 5% കുറവ് വാങ്ങിയാൽ ഫ്ലാഗ്.'
                    : 'e-Balance scale verification — auto-flag >5% variance.',
                  lang === 'ml'
                    ? 'ഒരു വിൽപ്പന — മുഴുവൻ കുടുംബത്തിലേക്കും SMS.'
                    : 'One sale, SMS to every Aadhaar-linked family member.',
                  lang === 'ml'
                    ? 'മാസാന്തം ബുക്ക് ഓട്ടോ-ക്ലോസ്.'
                    : 'Month-end book auto-close, fraud-proof.',
                ].map((line, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C8E1CB] shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Portal launcher */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-end justify-between mb-5">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[var(--ink)]">
              {lang === 'ml' ? 'നിങ്ങളുടെ പോർട്ടൽ തിരഞ്ഞെടുക്കൂ' : 'Choose Your Portal'}
            </h2>
            <span className="text-xs text-[var(--ink-soft)] hidden sm:inline">
              {lang === 'ml' ? 'റോൾ അനുസരിച്ച് വ്യത്യസ്ത AI ടൂൾസ്' : 'Role-scoped AI tools per portal'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {portals.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="group surface p-5 sm:p-6 hover:border-[var(--accent)] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-md bg-[var(--canvas-deep)] text-[var(--authority)] flex items-center justify-center">
                    {p.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-[var(--rule)] text-[var(--ink-soft)]">
                    {p.badge}
                  </span>
                </div>
                <div className="mt-4 font-serif font-bold text-lg sm:text-xl text-[var(--ink)]">
                  {p.title}
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed min-h-[3.5rem]">
                  {p.desc}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--authority)]">
                  {lang === 'ml' ? 'പ്രവേശിക്കുക' : 'Enter'}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Feature grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[var(--ink)] mb-5">
            {lang === 'ml' ? 'ശക്തി പകരുന്ന സംവിധാനങ്ങൾ' : 'Engineered For Trust'}
          </h2>
          <FadeInGrid>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="surface p-5 hover:border-[var(--accent)] transition"
                >
                  <div className="w-10 h-10 rounded-md bg-[#EAF1E5] flex items-center justify-center">
                    {f.icon}
                  </div>
                  <div className="mt-3 font-serif font-bold text-base text-[var(--ink)]">
                    {f.title}
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--ink-soft)] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </FadeInGrid>
        </section>

        {/* CTA strip */}
        <section className="bg-[var(--authority)] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl">
                {lang === 'ml'
                  ? 'ഇന്ന് തന്നെ സ്റ്റോക്ക് പരിശോധിച്ച് തുടങ്ങൂ'
                  : 'See Your Nearest Stock Right Now'}
              </h2>
              <p className="mt-2 text-base text-[#C8E1CB]">
                {lang === 'ml'
                  ? 'ഒരു 10-അക്ക റേഷൻ കാർഡ് നമ്പറും രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പറും മാത്രം. പാസ്‌വേഡ് ഇല്ല.'
                  : 'Just a 10-digit Ration Card ID and your registered mobile number. No password.'}
              </p>
            </div>
            <Link href="/login" className="btn-primary bg-[var(--accent)] border-[var(--accent-deep)] hover:bg-[var(--accent-deep)]">
              {lang === 'ml' ? 'ലോഗിൻ ചെയ്യൂ' : 'Login Now'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[var(--canvas-deep)] border-t border-[var(--rule)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-sm text-[var(--ink-soft)] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>
            © 2026 {lang === 'ml' ? 'കേരള സിവിൽ സപ്ലൈസ് വകുപ്പ്' : 'Kerala Civil Supplies Department'} ·{' '}
            {lang === 'ml' ? 'എല്ലാ അവകാശങ്ങളും സംരക്ഷിച്ചിരിക്കുന്നു' : 'All rights reserved'}
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--authority)]" />
            <span>{lang === 'ml' ? 'എൻക്രിപ്റ്റ് ചെയ്ത HTTP-Only സെഷൻ' : 'Encrypted HTTP-Only Session'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Tiny helper: reveal children on first scroll into view. Minimal motion —
 * a 600ms fade-up, only for marketing sections (per brief §3 motion rules).
 */
function FadeInGrid({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      {children}
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ShoppingCart, Store, Truck, Building2, Globe, Menu, X } from 'lucide-react';
import type { Language } from '@/lib/translations';

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLangToggle?: () => void;
}

export function Navbar({ lang, onLanguageChange, onLangToggle }: NavbarProps) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/customer', label: lang === 'ml' ? 'ഉപഭോക്താവ്' : 'Customer', icon: <ShoppingCart size={16} /> },
    { href: '/seller', label: lang === 'ml' ? 'വ്യാപാരി' : 'Seller', icon: <Store size={16} /> },
    { href: '/supplier', label: lang === 'ml' ? 'വിതരണക്കാരൻ' : 'Supplier', icon: <Truck size={16} /> },
    { href: '/gov', label: lang === 'ml' ? 'സർക്കാർ' : 'Government', icon: <Building2 size={16} /> },
  ];

  function handleToggle() {
    if (onLangToggle) onLangToggle();
    else onLanguageChange(lang === 'en' ? 'ml' : 'en');
  }

  return (
    <header className="bg-white border-b border-[var(--rule)]">
      {/* Letterhead strip */}
      <div className="authority-strip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-md bg-[var(--authority)] text-white flex items-center justify-center font-serif font-bold text-lg shrink-0">
              അ
            </div>
            <div className="leading-tight">
              <div className="font-serif font-bold text-lg text-[var(--ink)]">
                {lang === 'ml' ? 'അരിസോൺ' : 'Arizon'}
              </div>
              <div className="text-[11px] text-[var(--ink-soft)] font-medium tracking-wide uppercase">
                {lang === 'ml' ? 'കേരള PDS' : 'Kerala PDS'}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              className="min-h-[44px] min-w-[44px] px-3 inline-flex items-center justify-center gap-1.5 text-sm font-semibold rounded-md border border-[var(--authority)] text-[var(--authority)] hover:bg-[var(--authority)] hover:text-white transition"
              aria-label="Toggle language"
            >
              <Globe size={14} />
              <span className="hidden sm:inline">{lang === 'ml' ? 'English' : 'മലയാളം'}</span>
              <span className="sm:hidden">{lang === 'ml' ? 'EN' : 'ML'}</span>
            </button>
            <button
              className="md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-[var(--rule-strong)] text-[var(--ink)]"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary nav row — desktop tabs only, mobile collapses to hamburger above */}
      <nav className="hidden md:block bg-[var(--canvas)] border-t border-[var(--rule)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1">
          {links.map((l) => {
            const active = path?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-md text-sm font-semibold transition ${
                  active
                    ? 'text-[var(--authority)] bg-white border border-[var(--rule)]'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-white'
                }`}
              >
                {l.icon}
                {l.label}
              </Link>
            );
          })}
          <div className="ml-auto text-[11px] text-[var(--ink-soft)] hidden lg:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#EAF1E5] text-[var(--authority)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--authority)] animate-pulse" />
              {lang === 'ml' ? 'ലൈവ് e-POS' : 'Live e-POS'}
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-[var(--rule)] bg-white">
          <ul className="px-4 py-2 flex flex-col gap-1">
            {links.map((l) => {
              const active = path?.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`min-h-[48px] flex items-center gap-2 px-3 py-2 rounded-md text-base font-semibold ${
                      active
                        ? 'text-[var(--authority)] bg-[var(--canvas)]'
                        : 'text-[var(--ink)] hover:bg-[var(--canvas-deep)]'
                    }`}
                  >
                    {l.icon}
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Navbar;

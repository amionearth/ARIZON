'use client';
import { useEffect, useState, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MobileTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  tabs: MobileTab[];
  /**
   * If supplied, the tab bar scrolls to the section with this id (uses
   * document.getElementById). If omitted, the tabs call onTabChange.
   */
  scrollMode?: boolean;
  /** Called when the user taps a tab (used when scrollMode is false). */
  onTabChange?: (id: string) => void;
  /** Initial active tab id. */
  activeId?: string;
}

/**
 * Fixed bottom tab bar — appears below 768px. Big tap targets (>= 56px),
 * high-contrast labels, single accent for the active tab.
 */
export default function MobileTabBar({ tabs, scrollMode = true, onTabChange, activeId }: Props) {
  const [active, setActive] = useState(activeId ?? tabs[0]?.id ?? '');

  useEffect(() => {
    if (!scrollMode || !active) return;
    const el = document.getElementById(`tab-${active}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [active, scrollMode]);

  const handle = (id: string) => {
    setActive(id);
    onTabChange?.(id);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t safe-bottom"
      aria-label="Section navigation"
    >
      <ul className="grid grid-cols-4 gap-1 px-2 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => handle(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-[56px] flex flex-col items-center justify-center gap-0.5 rounded-lg transition ${
                  isActive
                    ? 'text-[var(--authority)] bg-[#EAF1E5]'
                    : 'text-[var(--ink-soft)] hover:bg-[var(--canvas-deep)]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[11px] font-semibold tracking-wide">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Helper component: section anchor. Wrap any block whose id you want the
 * tab bar to scroll to.
 */
export function TabSection({
  id,
  children,
  className = '',
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={`tab-${id}`} className={className} data-tab-section>
      {children}
    </section>
  );
}

'use client';
import { Bell, MessageCircle, Phone } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  primaryLabel: string;
  primaryIcon?: ReactNode;
  onPrimary?: () => void;
  secondaryLabel?: string;
  secondaryIcon?: ReactNode;
  onSecondary?: () => void;
  tertiaryLabel?: string;
  tertiaryIcon?: ReactNode;
  onTertiary?: () => void;
}

/**
 * Sticky bottom action bar — appears only on phone-sized viewports.
 * Always-visible primary action plus secondary quick actions so users
 * never have to scroll to the top to do the next thing.
 */
export function StickyActionBar({
  primaryLabel,
  primaryIcon,
  onPrimary,
  secondaryLabel,
  secondaryIcon,
  onSecondary,
  tertiaryLabel,
  tertiaryIcon,
  onTertiary,
}: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-[var(--rule-strong)] safe-bottom anim-slide-up"
      style={{ boxShadow: '0 -4px 18px rgba(36, 28, 16, 0.08)' }}
    >
      <div className="flex items-stretch px-3 pt-2 gap-2">
        {tertiaryLabel && (
          <button
            type="button"
            onClick={onTertiary}
            className="press min-h-[56px] flex-1 flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold bg-[var(--canvas)] text-[var(--ink)] border border-[var(--rule)]"
            aria-label={tertiaryLabel}
          >
            {tertiaryIcon ?? <Phone className="w-4 h-4" />}
            <span className="hidden xs:inline">{tertiaryLabel}</span>
          </button>
        )}
        {secondaryLabel && (
          <button
            type="button"
            onClick={onSecondary}
            className="press min-h-[56px] flex-1 flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold bg-[#EAF1E5] text-[var(--authority)] border border-[#B7CFB7]"
            aria-label={secondaryLabel}
          >
            {secondaryIcon ?? <Bell className="w-4 h-4" />}
            <span>{secondaryLabel}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          className="press min-h-[56px] flex-[1.5] flex items-center justify-center gap-2 rounded-lg text-base font-bold text-white anim-pulse-gold"
          style={{ background: 'var(--accent)' }}
          aria-label={primaryLabel}
        >
          {primaryIcon ?? <MessageCircle className="w-5 h-5" />}
          <span>{primaryLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default StickyActionBar;

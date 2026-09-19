'use client';
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Bell, X, Info } from 'lucide-react';

export type ToastKind = 'success' | 'warning' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  /** Auto-dismiss after this many ms (default 4500). Set 0 for sticky. */
  ttl?: number;
}

let listeners: Array<(t: Toast) => void> = [];
let nextId = 1;

/**
 * Fire a toast from anywhere (works outside React via subscription).
 * The <Toaster /> component listens and renders them as a fixed stack.
 */
export function pushToast(t: Omit<Toast, 'id'>) {
  const toast: Toast = { id: nextId++, ttl: 4500, ...t };
  listeners.forEach((l) => l(toast));
}

interface Props {
  /** Optional: render at top-right (default) or top-center. */
  position?: 'top-right' | 'top-center';
}

export function Toaster({ position = 'top-right' }: Props) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const onPush = (t: Toast) => {
      setItems((prev) => [...prev, t]);
      if (t.ttl && t.ttl > 0) {
        setTimeout(() => dismiss(t.id), t.ttl);
      }
    };
    listeners.push(onPush);
    return () => {
      listeners = listeners.filter((l) => l !== onPush);
    };
  }, [dismiss]);

  const left =
    position === 'top-center'
      ? '50%'
      : 'calc(100% - 1rem)';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 z-[100] flex flex-col gap-2 pointer-events-none"
      style={{
        right: position === 'top-right' ? '1rem' : 'auto',
        left: position === 'top-center' ? '50%' : 'auto',
        transform: position === 'top-center' ? 'translateX(-50%)' : 'none',
        maxWidth: 'min(360px, calc(100% - 2rem))',
      }}
    >
      {items.map((t) => {
        const palette = paletteFor(t.kind);
        return (
          <div
            key={t.id}
            className="pointer-events-auto anim-slide-right surface px-4 py-3 flex items-start gap-3"
            style={{ borderLeft: `4px solid ${palette.border}` }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: palette.bg, color: palette.icon }}
            >
              {palette.iconNode}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[var(--ink)]">{t.title}</div>
              {t.body && (
                <div className="text-xs text-[var(--ink-soft)] mt-0.5 leading-snug">{t.body}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="press min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--canvas-deep)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function paletteFor(kind: ToastKind) {
  switch (kind) {
    case 'success':
      return {
        border: '4C7A3D',
        bg: 'E6F0DD',
        icon: '4C7A3D',
        iconNode: <CheckCircle2 className="w-4 h-4" />,
      };
    case 'warning':
      return {
        border: 'B8860B',
        bg: 'F4E9D0',
        icon: 'B8860B',
        iconNode: <AlertTriangle className="w-4 h-4" />,
      };
    case 'error':
      return {
        border: 'B3462C',
        bg: 'F1D9CF',
        icon: 'B3462C',
        iconNode: <AlertTriangle className="w-4 h-4" />,
      };
    case 'info':
    default:
      return {
        border: 'C98A2B',
        bg: 'FAEFD9',
        icon: 'A56B14',
        iconNode: <Bell className="w-4 h-4" />,
      };
  }
}

export default Toaster;

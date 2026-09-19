'use client';
import { useEffect, useState } from 'react';

interface Props {
  /** ms epoch of last update */
  lastUpdatedAt: number;
  /** ms polling interval */
  intervalMs?: number;
  /** Show as "Live" when updated within `freshFor` ms (default 10s) */
  freshFor?: number;
}

function relTime(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const sec = Math.floor(diff / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

/**
 * Tiny chip showing whether the displayed data is "live" plus a
 * relative timestamp. Re-renders every 5s to keep the label honest.
 */
export function LiveBadge({ lastUpdatedAt, intervalMs = 5000, freshFor = 10000 }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  const fresh = Date.now() - lastUpdatedAt < freshFor;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
      style={{
        background: fresh ? '#EAF1E5' : 'var(--canvas)',
        color: fresh ? 'var(--authority)' : 'var(--ink-soft)',
        borderColor: fresh ? '#B7CFB7' : 'var(--rule)',
      }}
    >
      <span
        className="live-dot"
        style={{ background: fresh ? 'var(--success)' : 'var(--ink-faint)' }}
      />
      <span>{fresh ? 'Live' : 'Updated'} · {relTime(lastUpdatedAt)}</span>
    </span>
  );
}

export default LiveBadge;

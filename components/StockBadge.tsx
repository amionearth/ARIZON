'use client';
import type { Language } from '@/lib/translations';

type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

interface Props {
  status: StockStatus;
  closing?: number;
  unit?: string;
  lang?: Language;
  size?: 'sm' | 'md';
}

export function StockBadge({ status, closing, unit = 'kg', lang = 'en', size = 'md' }: Props) {
  const cfg: Record<StockStatus, { klass: string; label: string }> = {
    IN_STOCK: {
      klass: 'badge-in-stock',
      label: lang === 'ml' ? 'സ്റ്റോക്ക് ഉണ്ട്' : 'In Stock',
    },
    LOW_STOCK: {
      klass: 'badge-low-stock',
      label: lang === 'ml' ? 'കുറഞ്ഞ സ്റ്റോക്ക്' : 'Low Stock',
    },
    OUT_OF_STOCK: {
      klass: 'badge-out-stock',
      label: lang === 'ml' ? 'സ്റ്റോക്ക് ഇല്ല' : 'Out of Stock',
    },
  };
  const c = cfg[status];

  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const dotColor =
    status === 'IN_STOCK'
      ? 'bg-[var(--success)]'
      : status === 'LOW_STOCK'
        ? 'bg-[var(--warn)]'
        : 'bg-[var(--danger)]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${c.klass} ${padding}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} ${status === 'IN_STOCK' ? 'animate-pulse' : ''}`} />
      <span>{c.label}</span>
      {closing !== undefined && (
        <span className="font-normal opacity-80 tabular-nums">
          ({closing}
          {unit})
        </span>
      )}
    </span>
  );
}

export default StockBadge;

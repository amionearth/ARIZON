'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

interface Props {
  shop_id: string;
  commodity_id: string;
  period: string;
  field: 'opening' | 'received' | 'sold' | 'closing';
  value: number;
  unit?: string;
  onSaved?: (newValue: number, previous: number) => void;
}

/**
 * Inline-editable cell for the seller ledger. Click pencil to edit,
 * Enter to save, Esc to cancel. Persists to /api/stock/:shop/:commodity.
 */
export function EditableCell({ shop_id, commodity_id, period, field, value, unit, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  async function save() {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Must be a non-negative number');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/stock/${encodeURIComponent(shop_id)}/${encodeURIComponent(commodity_id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ period, field, value: parsed }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Save failed');
        return;
      }
      onSaved?.(data.new_value, data.previous);
      setEditing(false);
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setDraft(String(value));
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group inline-flex items-center gap-1 tabular-nums text-[var(--ink)] hover:bg-[var(--canvas-deep)] px-1.5 py-0.5 rounded transition min-w-[40px] justify-end"
        aria-label={`Edit ${field}`}
        title="Click to edit"
      >
        <span>
          {value}
          {unit ? <span className="text-[var(--ink-soft)] text-[10px] ml-0.5">{unit}</span> : null}
        </span>
        <Pencil className="w-3 h-3 text-[var(--ink-faint)] opacity-0 group-hover:opacity-100 transition" />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        type="number"
        step="0.1"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            save();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        disabled={busy}
        className="w-20 px-1.5 py-0.5 rounded border border-[var(--accent)] text-right tabular-nums bg-white font-bold focus:outline-none focus:ring-2 focus:ring-[#FAEFD9]"
      />
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="min-h-[28px] min-w-[28px] rounded bg-[var(--success)] hover:bg-[#3F6934] text-white flex items-center justify-center disabled:opacity-50"
        aria-label="Save"
      >
        <Check className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={busy}
        className="min-h-[28px] min-w-[28px] rounded bg-zinc-300 hover:bg-zinc-400 text-zinc-800 flex items-center justify-center disabled:opacity-50"
        aria-label="Cancel"
      >
        <X className="w-3 h-3" />
      </button>
      {error && <span className="text-[10px] text-[var(--danger)] font-bold ml-1">{error}</span>}
    </span>
  );
}

export default EditableCell;

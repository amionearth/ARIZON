'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader2, Sparkles } from 'lucide-react';
import type { Language } from '@/lib/translations';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  role: 'customer' | 'seller' | 'supplier' | 'gov';
  shopId?: string;
  lang?: Language;
  placeholder?: string;
  title?: string;
  presetPrompts?: { label: string; query: string }[];
}

/**
 * Floating chat bubble + full panel. Logic is identical to the previous
 * embedded widget — same POST to /api/chat, same role-scoped prompts —
 * but the surface is now a turmeric-gold bubble that opens into a warm
 * cream panel docked bottom-right. On mobile, full-screen.
 */
export function AgentChat({
  role,
  shopId,
  lang = 'en',
  placeholder,
  title,
  presetPrompts,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        lang === 'ml'
          ? `നമസ്കാരം! ഞാൻ Arizon AI ഏജന്റ് ആണ്. ${role === 'customer' ? 'നിങ്ങളുടെ അടുത്തുള്ള കടകളിലെ സ്റ്റോക്ക് നോക്കാം.' : 'എങ്ങനെ സഹായിക്കാം?'}`
          : `Hello! I'm the Arizon AI Agent. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    const newMsgs: Message[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, role, shopId, lang }),
      });
      const data = await res.json();
      const reply = data?.content ?? data?.text ?? data?.error ?? 'Sorry, no response was returned.';
      setMessages((prev) => [...prev, { role: 'assistant', content: String(reply) }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const queries: { label: string; query: string }[] = presetPrompts ?? [
    {
      label: lang === 'ml' ? 'അരി ലഭ്യമാണോ?' : 'Is rice available?',
      query: lang === 'ml' ? 'അടുത്തുള്ള കടയിൽ അരി ലഭ്യമാണോ?' : 'Is rice available near me?',
    },
    {
      label: lang === 'ml' ? 'സ്റ്റോക്ക് കാണിക്കൂ' : 'Show stock',
      query: lang === 'ml' ? 'ഈ കടയിലെ സ്റ്റോക്ക് കാണിക്കൂ' : 'Show current stock at this shop',
    },
    {
      label: lang === 'ml' ? 'അനോമലി പരിശോധിക്കൂ' : 'Check anomalies',
      query: lang === 'ml' ? 'അനോമലി പരിശോധിക്കൂ' : 'Run anomaly detection for this shop',
    },
  ];

  const headerTitle = title ?? (lang === 'ml' ? 'Arizon AI ഏജന്റ്' : 'Arizon AI Agent');
  const placeholderText = placeholder ?? (lang === 'ml' ? 'എന്തും ചോദിക്കൂ…' : 'Ask anything…');

  return (
    <>
      {/* Floating launcher bubble */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={lang === 'ml' ? 'AI സഹായി തുറക്കുക' : 'Open AI assistant'}
          className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-[0_4px_18px_rgba(165,107,20,0.35)] hover:bg-[var(--accent-deep)] active:scale-95 transition flex items-center justify-center"
        >
          <MessageCircle className="w-7 h-7" strokeWidth={2} />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--danger)] border-2 border-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-50 inset-0 md:inset-auto md:bottom-6 md:right-4 md:w-[380px] md:h-[560px] bg-white border border-[var(--rule-strong)] md:rounded-2xl shadow-[0_18px_50px_rgba(36,28,16,0.18)] flex flex-col overflow-hidden"
          role="dialog"
          aria-label={headerTitle}
        >
          {/* Header */}
          <div className="bg-[var(--authority)] text-white px-4 py-3 flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="flex-1 leading-tight">
              <div className="font-serif font-bold text-base">{headerTitle}</div>
              <div className="text-[11px] text-white/80 capitalize flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7CC576] animate-pulse" />
                {role} · {lang === 'ml' ? 'ഓൺലൈൻ' : 'online'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md hover:bg-white/15 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick prompts */}
          {queries.length > 0 && (
            <div className="px-3 py-2 border-b border-[var(--rule)] bg-[var(--canvas)] flex flex-wrap gap-1.5 shrink-0">
              {queries.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => send(q.query)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-white border border-[var(--rule)] text-[var(--ink)] font-medium hover:bg-[var(--canvas-deep)] inline-flex items-center gap-1"
                >
                  <Sparkles size={10} className="text-[var(--accent)]" />
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#EAF1E5] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={14} className="text-[var(--authority)]" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[var(--accent)] text-white rounded-tr-none'
                      : 'bg-[var(--canvas)] text-[var(--ink)] rounded-tl-none border border-[var(--rule)]'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                    <User size={14} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#EAF1E5] flex items-center justify-center">
                  <Bot size={14} className="text-[var(--authority)]" />
                </div>
                <div className="bg-[var(--canvas)] border border-[var(--rule)] rounded-xl px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-[var(--authority)]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-[var(--rule)] flex gap-2 bg-white shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={placeholderText}
              className="flex-1 input"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="min-h-[48px] min-w-[48px] rounded-md bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white transition disabled:opacity-40 flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AgentChat;

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Phone,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Language, makeT } from '@/lib/translations';
import { requestOTP, verifyOTP } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const t = makeT(lang);

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [cardId, setCardId] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<string | null>(null);

  const handleAutofill = (demoCard: string, demoPhone: string) => {
    setCardId(demoCard);
    setPhone(demoPhone);
    setError(null);
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestOTP(cardId, phone);
      if (res.success) {
        setMemberInfo(res.memberName ?? null);
        setSuccessMsg(res.message ?? 'OTP Sent successfully!');
        setStep('verify');
      } else {
        setError(res.error ?? 'Failed to request OTP');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await verifyOTP(cardId, otp);
      if (res.success) {
        setSuccessMsg('Authentication successful! Redirecting to Citizen Portal...');
        setTimeout(() => router.push('/customer'), 800);
      } else {
        setError(res.error ?? 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar lang={lang} onLanguageChange={setLang} />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-md w-full space-y-6">
          {/* Letterhead card */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-md bg-[var(--authority)] text-white font-serif font-bold text-3xl shadow-sm">
              അ
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
              {t.loginTitle}
            </h1>
            <p className="text-base text-[var(--ink-soft)] leading-relaxed">
              {t.loginSubtitle}
            </p>
          </div>

          <div className="surface p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-3.5 rounded-lg bg-[#F1D9CF] border border-[#D89F8B] text-[var(--danger)] text-base flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-lg bg-[#E6F0DD] border border-[#B7CFB7] text-[var(--success)] text-base flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {step === 'request' ? (
              <form onSubmit={handleRequestOTP} className="space-y-5">
                <div>
                  <label
                    htmlFor="card-id"
                    className="block text-sm font-bold text-[var(--ink)] mb-2 uppercase tracking-wider"
                  >
                    {lang === 'ml' ? 'റേഷൻ കാർഡ് നമ്പർ' : '10-Digit Ration Card ID'}
                  </label>
                  <div className="relative">
                    <CreditCard className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] pointer-events-none" />
                    <input
                      id="card-id"
                      type="text"
                      required
                      placeholder="e.g. card-KL048821 or KL048821"
                      value={cardId}
                      onChange={(e) => setCardId(e.target.value)}
                      className="input pl-12 font-mono text-lg"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-bold text-[var(--ink)] mb-2 uppercase tracking-wider"
                  >
                    {lang === 'ml' ? 'രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ' : 'Registered Mobile Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] pointer-events-none" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input pl-12 font-mono text-lg"
                    />
                  </div>
                  <p className="text-xs text-[var(--ink-soft)] mt-2">
                    {lang === 'ml'
                      ? 'സിവിൽ സപ്ലൈസ് ഡാറ്റാബേസിൽ ഈ കാർഡിന് കീഴിൽ രജിസ്റ്റർ ചെയ്തതായിരിക്കണം.'
                      : 'Must be registered under this card in the Civil Supplies Database.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !cardId.trim() || !phone.trim()}
                  className="btn-primary w-full text-base"
                >
                  {loading ? (
                    <span>{lang === 'ml' ? 'ഡാറ്റാബേസ് പരിശോധിക്കുന്നു...' : 'Verifying Database Record...'}</span>
                  ) : (
                    <>
                      <span>{t.requestOtp}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="p-4 rounded-lg bg-[var(--canvas)] border border-[var(--rule)] text-base text-[var(--ink)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--ink-soft)]">{lang === 'ml' ? 'കാർഡ്' : 'Card ID'}:</span>
                    <strong className="font-mono">{cardId}</strong>
                  </div>
                  {memberInfo && (
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[var(--ink-soft)]">{lang === 'ml' ? 'ഗുണഭോക്താവ്' : 'Beneficiary'}:</span>
                      <strong>{memberInfo}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-bold text-[var(--ink)] mb-2 uppercase tracking-wider"
                  >
                    {lang === 'ml' ? 'ഒ.ടി.പി നമ്പർ നൽകുക' : 'Enter 4-Digit OTP'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] pointer-events-none" />
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      required
                      autoFocus
                      placeholder="1234"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="input pl-12 text-2xl font-mono tracking-[0.5em] text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-[var(--ink-soft)] mt-2">
                    <span className="text-[var(--authority)] font-semibold">{t.demoOtpHint}</span>
                    <button
                      type="button"
                      onClick={() => setStep('request')}
                      className="underline hover:text-[var(--ink)]"
                    >
                      {t.changeCard}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp.trim()}
                  className="btn-primary w-full text-base"
                >
                  {loading ? (
                    <span>{lang === 'ml' ? 'സെഷൻ പരിശോധിക്കുന്നു...' : 'Verifying Session...'}</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t.verifyEnter}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick autofill presets */}
            <div className="pt-4 border-t border-[var(--rule)] space-y-2">
              <div className="text-xs font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                {lang === 'ml' ? 'ജഡ്ജി ഡെമോ കാർഡുകൾ' : 'Quick Autofill Demo Cards'}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofill('card-KL048821', '+919876543210')}
                  className="p-3 rounded-lg border border-[var(--rule)] hover:border-[var(--accent)] hover:bg-[#FAEFD9] text-left text-sm font-medium transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[var(--ink)]">Rajan Pillai</div>
                    <div className="text-xs text-[var(--ink-soft)] font-mono">card-KL048821</div>
                  </div>
                  <span className="text-[10px] bg-[#E6F0DD] text-[var(--success)] font-bold px-2 py-0.5 rounded-full border border-[#B7CFB7]">
                    PHH
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofill('card-KL041234', '+919876500001')}
                  className="p-3 rounded-lg border border-[var(--rule)] hover:border-[var(--accent)] hover:bg-[#FAEFD9] text-left text-sm font-medium transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[var(--ink)]">Mary Thomas</div>
                    <div className="text-xs text-[var(--ink-soft)] font-mono">card-KL041234</div>
                  </div>
                  <span className="text-[10px] bg-[#F4E9D0] text-[var(--warn)] font-bold px-2 py-0.5 rounded-full border border-[#D9C28E]">
                    AAY
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-[var(--ink-soft)] flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--authority)]" />
            <span>
              {lang === 'ml'
                ? 'എൻക്രിപ്റ്റ് ചെയ്ത HTTP-Only സെഷൻ · സിവിൽ സപ്ലൈസ് വകുപ്പ് കേരളം'
                : 'Encrypted HTTP-Only Session • Civil Supplies Dept Kerala'}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

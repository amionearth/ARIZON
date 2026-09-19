'use server';
import { cookies } from 'next/headers';
import { store } from '@/lib/data';

export async function requestOTP(cardId: string, phone: string) {
  try {
    const member = store.validateCardAndPhone(cardId.trim(), phone.trim());
    if (!member) {
      return {
        success: false,
        error:
          'Card ID and phone number do not match our records. Please check and try again.',
      };
    }
    const masked = phone.replace(/\d(?=\d{4})/g, '•');
    return {
      success: true,
      memberName: member.name,
      cardId,
      message: `OTP sent to ${masked}. For demo, use: 1234`,
    };
  } catch {
    return { success: false, error: 'Service unavailable. Please try again.' };
  }
}

export async function verifyOTP(cardId: string, otp: string) {
  if (otp !== '1234') {
    return { success: false, error: 'Invalid OTP. For demo use 1234.' };
  }
  const cookieStore = await cookies();
  cookieStore.set('pds_session', JSON.stringify({ cardId, role: 'customer' }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return { success: true, cardId };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('pds_session');
}

export async function getSession(): Promise<{ cardId: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const val = cookieStore.get('pds_session')?.value;
    if (!val) return null;
    return JSON.parse(val);
  } catch {
    return null;
  }
}

/**
 * Server-side helper: returns just the cardId of the logged-in user.
 * Returns null when no session. Pages import this and use it to query
 * the in-memory store on behalf of the cardholder.
 */
export async function getSessionCardId(): Promise<string | null> {
  const s = await getSession();
  return s?.cardId ?? null;
}
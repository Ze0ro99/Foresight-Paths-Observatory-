'use client';

import { useCallback, useEffect, useState } from 'react';
import { initializePiSdk } from '@/lib/pi-sdk-client';

type ServerIdentity = { uid: string; username: string };

export default function PiAppStudioSignInPanel({ locale }: { locale: string }) {
  const ar = locale === 'ar';
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<ServerIdentity | null>(null);
  const [message, setMessage] = useState('');
  const [incompletePaymentFound, setIncompletePaymentFound] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch('/api/pi/auth', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const payload = await response.json();
      setUser(response.ok && payload.authenticated === true ? payload.user : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (!window.Pi) {
        if (attempts >= 40) {
          window.clearInterval(timer);
          if (active) setMessage(ar ? 'افتح التطبيق من Pi Browser لتحميل Pi SDK.' : 'Open this app in Pi Browser to load the Pi SDK.');
        }
        return;
      }
      window.clearInterval(timer);
      void initializePiSdk()
        .then(async () => {
          if (!active) return;
          setSdkReady(true);
          await loadSession();
        })
        .catch(() => {
          if (active) setMessage(ar ? 'تعذرت تهيئة Pi SDK v2.' : 'Pi SDK v2 initialization failed.');
        });
    }, 200);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [ar, loadSession]);

  const signIn = async () => {
    if (!window.Pi || !sdkReady) {
      setMessage(ar ? 'افتح التطبيق داخل Pi Browser أولًا.' : 'Open the app inside Pi Browser first.');
      return;
    }
    setBusy(true);
    setMessage('');
    setIncompletePaymentFound(false);
    try {
      const auth = await window.Pi.authenticate(
        ['username'],
        () => setIncompletePaymentFound(true),
      );
      const response = await fetch('/api/pi/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });
      const payload = await response.json();
      if (!response.ok || payload.authenticated !== true || !payload.user?.uid || !payload.user?.username) {
        throw new Error(payload.error || 'App Studio could not verify this Pi account.');
      }
      setUser(payload.user);
      setMessage(ar
        ? 'تحققت هوية Pi من App Studio وأُنشئت جلسة آمنة.'
        : 'App Studio verified the Pi identity and issued a secure session.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (ar ? 'فشل تسجيل الدخول.' : 'Pi sign-in failed.'));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await fetch('/api/pi/auth', { method: 'DELETE', credentials: 'same-origin' });
      setUser(null);
      setMessage(ar ? 'تم إنهاء جلسة Pi.' : 'Pi session signed out.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-violet-300/20 bg-violet-300/[0.035] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-white">
            {ar ? 'تسجيل الدخول عبر Pi وApp Studio' : 'Pi & App Studio sign-in'}
          </h3>
          <p className="mt-1 text-[10px] text-white/50">
            {ar ? 'Pi Testnet · نطاق username فقط · التحقق من الخادم' : 'Pi Testnet · username scope only · server-verified identity'}
          </p>
        </div>
        <span className="text-[10px] text-white/45">
          {sdkReady ? 'Pi SDK v2 ready' : (ar ? 'تحميل SDK…' : 'Loading SDK…')}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {user ? (
          <>
            <span className="rounded border border-emerald-300/20 px-3 py-2 text-[11px] text-emerald-100">
              {user.username}
            </span>
            <button type="button" onClick={() => void signOut()} disabled={busy}
              className="rounded border border-white/15 px-3 py-2 text-[11px] text-white/70 disabled:opacity-40">
              {ar ? 'تسجيل الخروج' : 'Sign out'}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => void signIn()} disabled={!sdkReady || busy}
            className="rounded border border-violet-200/30 px-3 py-2 text-[11px] text-violet-100 disabled:opacity-40">
            {busy ? (ar ? 'جارٍ التحقق…' : 'Verifying…') : (ar ? 'تسجيل الدخول عبر Pi' : 'Sign in with Pi')}
          </button>
        )}
        {incompletePaymentFound && (
          <span role="status" className="text-[10px] text-amber-200">
            {ar ? 'وجدت Pi دفعة غير مكتملة؛ لم نبدأ أي دفعة جديدة.' : 'Pi reported an incomplete payment; no new payment was started.'}
          </span>
        )}
      </div>
      {message && <p role="status" className="mt-2 text-[11px] text-cyan-100/80">{message}</p>}
    </div>
  );
}

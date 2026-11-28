'use client';

import { useCallback, useEffect, useState } from 'react';
import { initializePiSdk } from '@/lib/pi-sdk-client';

type VerifiedPiUser = { uid: string; username: string };

export default function PiAppStudioSignIn() {
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<VerifiedPiUser | null>(null);
  const [message, setMessage] = useState('');
  const [incompletePaymentFound, setIncompletePaymentFound] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch('/api/pi/auth', {
        credentials: 'same-origin',
        cache: 'no-store',
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
          if (active) setMessage('Open this app in Pi Browser to load the Pi SDK.');
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
          if (active) setMessage('Pi SDK v2 initialization failed. Open the app in Pi Browser and retry.');
        });
    }, 200);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [loadSession]);

  const signIn = async () => {
    if (!window.Pi || !sdkReady) {
      setMessage('Pi SDK is not ready. Open this app in Pi Browser and retry.');
      return;
    }

    setBusy(true);
    setMessage('');
    setIncompletePaymentFound(false);

    try {
      await initializePiSdk();
      const auth = await window.Pi.authenticate(
        ['username'],
        () => setIncompletePaymentFound(true),
      );

      if (!auth?.accessToken) {
        throw new Error('Pi authentication did not return an access token.');
      }

      // Exactly one server-side App Studio exchange per sign-in. SDK uid/username are ignored.
      const response = await fetch('/api/pi/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });
      const payload = await response.json().catch(() => ({}));

      if (
        !response.ok ||
        payload.authenticated !== true ||
        typeof payload.user?.uid !== 'string' ||
        typeof payload.user?.username !== 'string'
      ) {
        throw new Error(payload.error || 'App Studio could not verify this Pi account.');
      }

      setUser(payload.user);
      setMessage('App Studio verified the Pi identity and issued a secure session.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pi sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/pi/auth', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('Unable to end the Pi session.');
      setUser(null);
      setMessage('Pi session signed out.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pi sign-out failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-lg border border-white/15 bg-[#11111A]/95 p-2 text-xs text-white shadow-xl backdrop-blur">
      {user ? (
        <>
          <span className="max-w-32 truncate" title={user.username}>π {user.username}</span>
          <button type="button" onClick={() => void signOut()} disabled={busy}
            className="rounded border border-white/15 px-2 py-1 hover:bg-white/10 disabled:opacity-50">
            Sign out
          </button>
        </>
      ) : (
        <button type="button" disabled={!sdkReady || busy} onClick={() => void signIn()}
          className="rounded bg-[#7C3AED] px-3 py-2 font-semibold disabled:opacity-50">
          {busy ? 'Verifying…' : sdkReady ? 'Sign in with Pi' : 'Loading Pi SDK…'}
        </button>
      )}
      {incompletePaymentFound && <span role="status" className="text-amber-200">Pi reported an incomplete payment; no payment was started.</span>}
      {message && <span role="status" className="max-w-64 text-white/70">{message}</span>}
    </div>
  );
}

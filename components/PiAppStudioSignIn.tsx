'use client';

import { useEffect, useState } from 'react';

type PiSdk = {
  init: (config: { version: string }) => Promise<void> | void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void,
  ) => Promise<{ accessToken?: string }>;
  signIn: (options: {
    clientId: string;
    redirectUri: string;
    scopes?: string[];
    state?: string;
  }) => void;
};

declare global {
  interface Window {
    Pi?: PiSdk;
  }
}

export default function PiAppStudioSignIn() {
  const [username, setUsername] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/pi/auth', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (data.authenticated && typeof data.user?.username === 'string') {
          setUsername(data.user.username);
        }
      })
      .catch(() => {});

    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const oauthError = params.get('error');
    if (!accessToken && !oauthError) return;

    const expectedState = sessionStorage.getItem('pi_oauth_state');
    sessionStorage.removeItem('pi_oauth_state');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    if (!expectedState || params.get('state') !== expectedState) {
      setError('Pi OAuth state validation failed. Please start sign-in again.');
      return;
    }
    if (oauthError) {
      setError(`Pi Sign-In was not completed: ${oauthError}`);
      return;
    }

    setBusy(true);
    fetch('/api/pi/oauth-auth', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.authenticated || typeof data.user?.username !== 'string') {
          throw new Error(data.error || 'Pi OAuth identity verification failed.');
        }
        setUsername(data.user.username);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Pi OAuth sign-in failed.'))
      .finally(() => setBusy(false));
  }, []);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      if (!window.Pi) throw new Error('Pi SDK is not available. Open this app in Pi Browser and try again.');
      await window.Pi.init({ version: '2.0' });
      const auth = await window.Pi.authenticate(['username'], () => {
        // This app does not initiate payments; leave incomplete-payment recovery to the payment flow.
      });
      if (!auth?.accessToken) throw new Error('Pi authentication did not return an access token.');
      const response = await fetch('/api/pi/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authenticated || typeof data.user?.username !== 'string') {
        throw new Error(data.error || 'App Studio could not verify this Pi account.');
      }
      setUsername(data.user.username);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Pi sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function signInWithOAuth() {
    setBusy(true);
    setError(null);
    try {
      const clientId = process.env.NEXT_PUBLIC_PI_OAUTH_CLIENT_ID;
      if (!clientId) throw new Error('Pi OAuth Client ID is not configured for this deployment.');
      if (!window.Pi) throw new Error('Pi SDK is not available. Open this app in Pi Browser and try again.');
      await window.Pi.init({ version: '2.0' });
      const state = window.crypto.randomUUID();
      sessionStorage.setItem('pi_oauth_state', state);
      // The Developer Portal currently registers the production root URL as the redirect URI.
      window.Pi.signIn({
        clientId,
        redirectUri: window.location.origin,
        scopes: ['username'],
        state,
      });
    } catch (cause) {
      sessionStorage.removeItem('pi_oauth_state');
      setError(cause instanceof Error ? cause.message : 'Pi OAuth sign-in could not start.');
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await fetch('/api/pi/auth', { method: 'DELETE', credentials: 'same-origin' });
    } finally {
      setUsername(null);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-[70] flex items-center gap-2 rounded-lg border border-white/15 bg-[#11111A]/95 p-2 text-xs text-white shadow-xl backdrop-blur">
      {username ? (
        <>
          <span className="max-w-32 truncate" title={username}>π {username}</span>
          <button type="button" onClick={signOut} className="rounded border border-white/15 px-2 py-1 hover:bg-white/10">Sign out</button>
        </>
      ) : (
        <>
          <button type="button" disabled={busy} onClick={signIn} className="rounded bg-[#7C3AED] px-3 py-2 font-semibold disabled:opacity-50">
            {busy ? 'Signing in…' : 'Pi App Sign-In'}
          </button>
          <button type="button" disabled={busy} onClick={signInWithOAuth} className="rounded border border-white/20 px-3 py-2 font-semibold disabled:opacity-50">
            Pi OAuth Sign-In
          </button>
        </>
      )}
      {error && <span role="alert" className="max-w-64 text-rose-300">{error}</span>}
    </div>
  );
}

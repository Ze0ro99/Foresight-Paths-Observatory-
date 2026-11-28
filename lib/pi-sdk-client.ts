'use client';

type PiSdk = {
  init: (config: { version: string }) => Promise<void> | void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void,
  ) => Promise<{ accessToken: string; user?: { uid?: string; username?: string } }>;
};

type PiWindowState = Window & {
  __foresightPiSdkInit?: Promise<void>;
};

declare global {
  interface Window {
    Pi?: PiSdk;
    __foresightPiSdkInit?: Promise<void>;
  }
}

/**
 * Initialize the Pi SDK once. Pi Browser detects the network automatically;
 * the optional legacy argument is ignored and never forwarded to Pi.init.
 */
export async function initializePiSdk(_legacySandbox?: boolean): Promise<void> {
  void _legacySandbox;

  if (typeof window === 'undefined' || !window.Pi) {
    throw new Error('Pi SDK is not available in this browser.');
  }

  const state = window as PiWindowState;
  if (state.__foresightPiSdkInit) return state.__foresightPiSdkInit;

  const initialization = Promise.resolve(
    window.Pi.init({ version: '2.0' }),
  ).then(() => undefined);
  state.__foresightPiSdkInit = initialization;

  try {
    await initialization;
  } catch (error) {
    delete state.__foresightPiSdkInit;
    throw error;
  }
}

'use client';

type PiSdk = {
  init: (config: { version: string; sandbox?: boolean }) => Promise<void> | void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void,
  ) => Promise<{ accessToken: string; user?: { uid?: string; username?: string } }>;
  signIn?: (options: {
    clientId: string;
    redirectUri: string;
    scopes?: string[];
    state?: string;
  }) => void;
};

type PiWindowState = Window & {
  __foresightPiSdkInit?: Promise<void>;
  __foresightPiSdkSandbox?: boolean;
};

declare global {
  interface Window {
    Pi?: PiSdk;
    __foresightPiSdkInit?: Promise<void>;
    __foresightPiSdkSandbox?: boolean;
  }
}

/** Initialize Pi SDK once and keep every component on the same registered Testnet SDK mode. */
export async function initializePiSdk(
  sandbox: boolean = process.env.NEXT_PUBLIC_PI_SANDBOX_MODE === 'true',
): Promise<void> {
  if (typeof window === 'undefined' || !window.Pi) {
    throw new Error('Pi SDK is not available in this browser.');
  }

  const state = window as PiWindowState;
  if (state.__foresightPiSdkInit) {
    if (state.__foresightPiSdkSandbox !== sandbox) {
      throw new Error('The Pi SDK is already initialized in a different SDK mode.');
    }
    return state.__foresightPiSdkInit;
  }

  state.__foresightPiSdkSandbox = sandbox;
  const initialization = Promise.resolve(
    window.Pi.init({ version: '2.0', sandbox }),
  ).then(() => undefined);
  state.__foresightPiSdkInit = initialization;

  try {
    await initialization;
  } catch (error) {
    delete state.__foresightPiSdkInit;
    delete state.__foresightPiSdkSandbox;
    throw error;
  }
}

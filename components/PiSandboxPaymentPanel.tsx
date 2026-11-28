'use client';

import PiAppStudioSignInPanel from './PiAppStudioSignInPanel';

/**
 * Legacy payment panel entry point now shares the App Studio identity flow.
 * Payment controls are intentionally withheld while server release gates remain closed.
 */
export default function PiSandboxPaymentPanel({ locale }: { locale: string }) {
  return (
    <div className="mt-4">
      <PiAppStudioSignInPanel locale={locale} />
      <p className="mt-2 text-[10px] text-white/45">
        {locale === 'ar'
          ? 'عمليات الدفع والاستحقاقات تظل معطّلة حتى اكتمال اختبارات سجل Testnet وموافقات الإصدار.'
          : 'Payments and entitlements remain disabled until Testnet ledger tests and release approvals are complete.'}
      </p>
    </div>
  );
}

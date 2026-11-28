'use client';

import { useCallback, useEffect, useState } from 'react';
type Overview = {
  status: string;
  project?: string;
  data?: {
    sources?: Array<{ source_key: string; display_name: string; source_type: string; coverage_note: string }>;
    agents?: Array<{ template_key: string; name: string; category: string; capability_level: string; testnet_enabled: boolean; mainnet_enabled: boolean; safety_notes: string }>;
    news?: Array<{ id: string; title: string; category: string; canonical_url: string; source_domain: string; observed_at: string | null; evidence_class: string }>;
    hazards?: Array<{ id: string; title: string; hazard_type: string; severity_label: string | null; occurred_at: string | null; source_url: string }>;
    risks?: Array<{ id: string; title: string; risk_score: number; evidence_class: string; is_demo: boolean }>;
  };
  unavailable?: string[];
  message?: string;
};
type Fee = {
  network: string;
  status: string;
  ledgerSequence?: string;
  baseFeeStroops?: string;
  baseFeePi?: string;
  fetchedAtUtc?: string;
  mode?: string;
  reason?: string;
};

export default function TestnetReadinessPanel({ locale }: { locale: string }) {
  const ar = locale === 'ar';
  const [overview, setOverview] = useState<Overview | null>(null);
  const [fee, setFee] = useState<Fee | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [overviewResponse, feeResponse] = await Promise.all([
        fetch('/api/intelligence/overview', { cache: 'no-store' }),
        fetch('/api/pi/testnet-fee', { cache: 'no-store' }),
      ]);
      const [overviewData, feeData] = await Promise.all([
        overviewResponse.json() as Promise<Overview>,
        feeResponse.json() as Promise<Fee>,
      ]);
      setOverview(overviewData);
      setFee(feeData);
      setError('');
    } catch {
      setError(ar ? 'تعذر جلب حالة خدمات Testnet.' : 'Unable to load Testnet service status.');
    } finally {
      setBusy(false);
    }
  }, [ar]);

  useEffect(() => {
    const first = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 60000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const data = overview?.data;
  const sources = data?.sources ?? [];
  const agents = data?.agents ?? [];
  const news = data?.news ?? [];
  const hazards = data?.hazards ?? [];
  const risks = data?.risks ?? [];

  return (
    <section
      id="network-governance"
      aria-label={ar ? 'بيانات الشبكة والحوكمة' : 'Network telemetry and governance status'}
      className="mx-4 my-4 rounded-xl border border-emerald-400/15 bg-[#0C111B] p-4 md:mx-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">
            {ar ? 'الشبكة والمنظومة وPi Testnet' : 'Network & ecosystem telemetry'}
          </h2>
          <p className="mt-1 text-[11px] text-white/50">
            {ar ? 'بيانات قراءة فقط · لا توجد عمليات تصويت أو معاملات مفعّلة' : 'Read-only telemetry · governance voting and transactions are not enabled'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          className="rounded border border-emerald-300/20 px-3 py-1.5 text-xs text-emerald-100 disabled:opacity-50"
        >
          {busy ? (ar ? 'جارٍ الفحص…' : 'Checking…') : (ar ? 'تحديث الحالة' : 'Refresh status')}
        </button>
      </div>

      {error && <p role="status" className="mt-3 text-xs text-amber-200">{error}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/45">Supabase · Foresight</p>
          <p className="mt-1 text-sm font-semibold text-white">{overview?.status ?? '—'}</p>
          <p className="mt-1 text-[10px] text-white/45">{ar ? 'مشروع مستقل عن PiRC' : 'Isolated from PiRC project'}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/45">Pi Testnet Horizon</p>
          <p className="mt-1 text-sm font-semibold text-white">{fee?.status ?? '—'}</p>
          <p className="mt-1 text-[10px] text-white/45">
            {fee?.ledgerSequence ? `Ledger #${fee.ledgerSequence}` : (fee?.reason ?? '—')}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/45">{ar ? 'رسوم الدفتر الحالية' : 'Current ledger base fee'}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-200">
            {fee?.baseFeePi ? `${fee.baseFeePi} Pi` : '—'}
          </p>
          <p className="mt-1 text-[10px] text-white/45">
            {fee?.baseFeeStroops ? `${fee.baseFeeStroops} stroops` : (ar ? 'لا توجد بيانات' : 'No fee data')}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/45">{ar ? 'مصادر مسجلة' : 'Registered sources'}</p>
          <p className="mt-1 text-lg font-semibold text-white">{sources.length}</p>
          <p className="mt-1 text-[10px] text-white/45">
            {ar ? 'قوالب وكلاء' : 'Agent templates'}: {agents.length}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-semibold text-white/80">{ar ? 'مصادر البيانات' : 'Data sources'}</h3>
          <ul className="space-y-1.5">
            {sources.map((source) => (
              <li key={source.source_key} className="flex items-start justify-between gap-2 text-[11px]">
                <span className="text-white/80">{source.display_name}</span>
                <span className="shrink-0 text-white/40">{source.source_type}</span>
              </li>
            ))}
            {sources.length === 0 && <li className="text-[11px] text-white/40">{ar ? 'لا توجد سجلات منشورة بعد.' : 'No published records yet.'}</li>}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold text-white/80">{ar ? 'قوالب الوكلاء' : 'Agent templates'}</h3>
          <ul className="space-y-1.5">
            {agents.map((agent) => (
              <li key={agent.template_key} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-white/80">{agent.name}</span>
                <span className="shrink-0 text-white/40">{agent.capability_level}</span>
              </li>
            ))}
            {agents.length === 0 && <li className="text-[11px] text-white/40">{ar ? 'لا توجد قوالب بعد.' : 'No templates yet.'}</li>}
          </ul>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex flex-wrap gap-4 text-[11px] text-white/60">
          <span>{ar ? 'أخبار محفوظة' : 'Stored news'}: {news.length}</span>
          <span>{ar ? 'أحداث مخاطر' : 'Hazard events'}: {hazards.length}</span>
          <span>{ar ? 'تقييمات' : 'Risk assessments'}: {risks.length}</span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-white/40">
          {ar
            ? 'البيانات العامة للقراءة فقط والسجلات المالية خاصة. قراءة الرسوم من Testnet لا تنشئ معاملات ولا توقعها. التصويت والاعتماد الإداري غير مفعّلين هنا، والقوالب نماذج أولية وليست وكلاء منفذين.'
            : 'Public data is read-only and financial records are private. Testnet fee telemetry never creates or signs transactions. Voting and administrative approval are not enabled here; listed templates are prototypes, not executing agents.'}
        </p>
      </div>
    </section>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';

type Vulnerability = {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: 'Known' | 'Unknown' | null;
  forensicTriage: 'Yes' | 'No' | null;
  cwes: string[];
  nvdUrl: string;
};

type Payload = {
  status: 'ok';
  sourceUrl: string;
  catalogVersion: string;
  dateReleased: string;
  fetchedAtUtc: string;
  count: number;
  validatedCount: number;
  vulnerabilities: Vulnerability[];
  note: string;
};

export default function CisaKevPanel({ locale }: { locale: string }) {
  const ar = locale === 'ar';
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cyber/kev', { cache: 'no-store' });
      const payload = await response.json().catch(() => null) as Payload | null;
      if (!response.ok || !payload || payload.status !== 'ok' || !Array.isArray(payload.vulnerabilities)) {
        throw new Error('CISA_KEV_UNAVAILABLE');
      }
      setData(payload);
      setError('');
    } catch {
      setError(ar ? 'كتالوج CISA غير متاح مؤقتًا؛ لم يتم إنشاء تنبيهات بديلة.' : 'CISA KEV is temporarily unavailable; no synthetic alerts are shown.');
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => { void refresh(); }, 0);
    const interval = window.setInterval(() => { void refresh(); }, 15 * 60 * 1000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const items = data?.vulnerabilities ?? [];

  return (
    <section
      id="cyber-defense"
      aria-label={ar ? 'الثغرات المستغلة المعروفة من CISA' : 'CISA known exploited vulnerabilities'}
      className="mx-4 my-4 rounded-xl border border-rose-400/15 bg-[#120D16] p-4 md:mx-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">
            {ar ? 'الثغرات المستغلة المعروفة (CISA KEV)' : 'Known Exploited Vulnerabilities (CISA KEV)'}
          </h2>
          <p className="mt-1 text-[11px] text-white/50">
            {ar ? 'كتالوج رسمي مستقل · تحديث مخزّن مؤقتًا كل 15 دقيقة' : 'Independent official catalog · cached refresh every 15 minutes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noopener noreferrer" className="rounded border border-rose-300/20 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-500/10">
            {ar ? 'كتالوج CISA' : 'CISA catalog'}
          </a>
          <button type="button" onClick={() => void refresh()} disabled={loading} className="rounded border border-white/15 px-3 py-1.5 text-xs text-white/80 disabled:opacity-50">
            {loading ? (ar ? 'جارٍ التحديث…' : 'Refreshing…') : (ar ? 'تحديث' : 'Refresh')}
          </button>
        </div>
      </div>

      {error && <p role="status" className="mb-3 text-xs text-amber-200">{error}</p>}

      {data && (
        <>
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/50">
            <span>{ar ? 'إصدار الكتالوج' : 'Catalog version'}: {data.catalogVersion}</span>
            <span>{ar ? 'إجمالي السجلات' : 'Catalog entries'}: {data.count}</span>
            <span>{ar ? 'المتحقق منها' : 'Validated'}: {data.validatedCount}</span>
            <span>{ar ? 'تاريخ النشر' : 'Released'}: {data.dateReleased.slice(0, 10)}</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {items.slice(0, 8).map((item) => (
              <article key={item.cveID} className="rounded-lg border border-white/10 bg-[#090A10] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <a href={item.nvdUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs font-semibold text-rose-200 underline underline-offset-2">{item.cveID}</a>
                    <h3 className="mt-1 text-xs font-semibold text-white">{item.vulnerabilityName}</h3>
                    <p className="mt-1 text-[10px] text-white/55">{item.vendorProject} · {item.product}</p>
                  </div>
                  {item.knownRansomwareCampaignUse === 'Known' && (
                    <span className="rounded bg-rose-500/15 px-2 py-1 text-[10px] text-rose-100">
                      {ar ? 'استخدام معروف في فدية' : 'Known ransomware use'}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-white/75">{item.shortDescription}</p>
                <div className="mt-2 rounded-md border border-amber-300/10 bg-amber-950/15 p-2">
                  <p className="text-[10px] font-semibold text-amber-100">{ar ? 'الإجراء المطلوب من CISA' : 'CISA required action'}</p>
                  <p className="mt-1 text-[11px] leading-5 text-amber-50/80">{item.requiredAction}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/45">
                  <span>{ar ? 'أضيف' : 'Added'}: {item.dateAdded}</span>
                  <span>{ar ? 'الاستحقاق' : 'Due'}: {item.dueDate}</span>
                  {item.cwes.length > 0 && <span>{item.cwes.join(', ')}</span>}
                </div>
              </article>
            ))}
            {items.length === 0 && <p className="text-xs text-white/50">{ar ? 'لا توجد سجلات صالحة للعرض من الكتالوج.' : 'No valid catalog records are available to display.'}</p>}
          </div>
          <p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/45">
            {ar
              ? 'إدراج الثغرة في CISA KEV يعني أنها مدرجة كثغرة مستغلة معروفة؛ ولا يثبت أن أنظمتك متأثرة. طابق الشركة والمنتج والإصدار والتعرض قبل أي قرار. لا يقوم التطبيق بمسح الأنظمة أو استغلال الثغرات أو تطبيق تحديثات تلقائيًا.'
              : data.note + ' This panel is read-only: it does not scan, exploit, or patch systems.'}
          </p>
          <p className="mt-2 text-[10px] text-white/35">
            {ar ? 'آخر جلب' : 'Last fetched'}: {new Date(data.fetchedAtUtc).toLocaleString(ar ? 'ar' : 'en', { timeZone: 'UTC' })} UTC
          </p>
        </>
      )}
    </section>
  );
}

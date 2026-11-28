'use client';
import { useCallback, useEffect, useState } from 'react';

type Article = {
  id: string;
  categoryLabel: string;
  title: string;
  url: string;
  observedAt: string;
  sourceDomain: string;
};
type Payload = { fetchedAtUtc: string; articles: Article[]; note: string; persistence?: string; sourceError?: string | null };

const categories = [
  'الكوارث والطوارئ',
  'النزاعات والأمن',
  'السياسة والدبلوماسية',
  'الاقتصاد والأسواق',
  'الصحة والأوبئة',
  'الأمن السيبراني',
  'العلوم والتقنية',
  'الطاقة والبنية التحتية',
  'أخبار متنوعة',
];

export default function LiveNewsPanel({ locale }: { locale: string }) {
  const ar = locale === 'ar';
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/news', { cache: 'no-store' });
      if (!response.ok) throw new Error('News request failed');
      const payload = (await response.json()) as Payload;
      if (!Array.isArray(payload.articles)) throw new Error('Invalid news response');
      setData(payload);
      setError('');
    } catch {
      setError(ar ? 'تعذر تحديث موجز الأخبار.' : 'News feed unavailable.');
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void refresh();
    }, 0);
    const interval = window.setInterval(() => {
      void refresh();
    }, 120000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const groups = categories
    .map((label) => ({
      label,
      items: (data?.articles ?? []).filter((article) => article.categoryLabel === label),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section
      id="global-news"
      aria-label={ar ? 'الأخبار العالمية' : 'Global news'}
      className="mx-4 my-4 rounded-xl border border-cyan-400/15 bg-[#0C111B] p-4 md:mx-6"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">
            {ar ? 'موجز الأخبار والأحداث العالمية' : 'Global news and events'}
          </h2>
          <p className="mt-1 text-[11px] text-white/50">
            {ar ? 'فهرسة GDELT · تحديث تلقائي كل دقيقتين' : 'GDELT index · auto-refresh every 2 minutes'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded border border-cyan-300/20 px-3 py-1.5 text-xs text-cyan-100 disabled:opacity-50"
        >
          {loading ? (ar ? 'جارٍ التحديث…' : 'Refreshing…') : (ar ? 'تحديث الآن' : 'Refresh')}
        </button>
      </div>

      {error && <p role="status" className="mb-2 text-xs text-amber-200">{error}</p>}
      {data?.sourceError && <p role="status" className="mb-2 text-xs text-amber-200">{ar ? 'حالة المصدر:' : 'Source status:'} {data.sourceError}</p>}

      {data && (
        <>
          <p className="mb-3 text-[10px] text-white/45">
            {ar ? 'عدد المقالات' : 'Articles'}: {data.articles.length} ·{' '}
            {new Date(data.fetchedAtUtc).toLocaleTimeString(ar ? 'ar' : 'en', {
              timeZone: 'UTC',
              timeZoneName: 'short',
            })}{' '}
            UTC · {ar ? 'تغطية جزئية' : 'Partial coverage'} · {ar ? 'الحفظ' : 'Storage'}: {data.persistence ?? '—'}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 border-b border-white/10 pb-1 text-xs font-semibold text-cyan-100">
                  {group.label}
                </h3>
                <ul className="space-y-2">
                  {group.items.slice(0, 5).map((article) => (
                    <li key={article.id} className="text-xs">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="leading-relaxed text-white/85 hover:text-cyan-200 hover:underline"
                      >
                        {article.title}
                      </a>
                      <div className="mt-0.5 flex gap-2 text-[10px] text-white/40">
                        <span>{article.sourceDomain}</span>
                        <time dateTime={article.observedAt}>
                          {new Date(article.observedAt).toLocaleString(ar ? 'ar' : 'en', {
                            timeZone: 'UTC',
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          UTC
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/40">
            {data.note}
          </p>
        </>
      )}
    </section>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AlertCircle, BadgeCheck, Bot, CheckCircle2, LockKeyhole, Plus, RefreshCw, Shield, ShoppingBag, Sparkles, Store, Tag, Wallet } from 'lucide-react';
import type { AppLocale } from '@/lib/types';
import { initializePiSdk } from '@/lib/pi-sdk-client';
import { formatStroopsAsPi, parsePiToStroops } from '@/lib/pi-amounts.mjs';

type AuthResult = { accessToken: string; user?: { username?: string; uid?: string } };
type Template = { template_key: string; name: string; description: string; category: string; capability_level: string; requires_external_credentials: boolean; safety_notes: string };
type OwnedAgent = { id: string; template_key: string; name: string; mission: string; status: string; created_at: string };
type Listing = {
  id: string; title: string; summary: string; category: string; capabilities: Record<string, unknown>;
  priceStroops: string; currency: 'PI'; billingPeriod: 'per_run' | 'weekly' | 'monthly'; license: string;
  creatorLabel: string; version: number; capabilityLevel: string; status: string; updatedAt: string;
};
type OwnListing = Listing & { agentId: string; agentName: string; templateKey: string | null };
type Preview = { id: string; listingId: string; version: number; status: string; paymentState: string; entitlementGranted: boolean; createdAt: string };

const CATEGORY: Record<string, string> = {
  cybersecurity: 'Cybersecurity', global_intelligence: 'Global intelligence',
  market_research: 'Market research', pi_network: 'Pi network', research: 'Research', other: 'Other',
};
const MANIFESTS: Record<string, Record<string, unknown>> = {
  'cyber-threat-watch': { execution_mode: 'read_only', capabilities: ['read_cisa_kev', 'report_generation'], input_types: ['topic', 'region'], output_types: ['plain_report', 'recommendations'], data_sources: ['CISA_KEV'] },
  'global-disaster-watch': { execution_mode: 'read_only', capabilities: ['read_hazards', 'report_generation'], input_types: ['topic', 'region', 'time_window'], output_types: ['plain_report', 'map_signals'], data_sources: ['USGS', 'NASA_EONET'] },
  'pi-testnet-observer': { execution_mode: 'read_only', capabilities: ['read_pi_horizon', 'report_generation'], input_types: ['time_window'], output_types: ['plain_report', 'risk_summary'], data_sources: ['PI_TESTNET_HORIZON'] },
  'news-source-verifier': { execution_mode: 'read_only', capabilities: ['read_news', 'report_generation'], input_types: ['topic', 'public_url'], output_types: ['plain_report', 'source_list'], data_sources: ['GDELT_DOC'] },
};
const CATEGORY_BY_TEMPLATE: Record<string, string> = {
  'cyber-threat-watch': 'cybersecurity', 'global-disaster-watch': 'global_intelligence',
  'pi-testnet-observer': 'pi_network', 'news-source-verifier': 'research',
};
const COPY: Record<string, [string, string]> = {
  title: ['سوق الوكلاء', 'Agent marketplace'],
  subtitle: ['أنشئ وشارك بطاقة وكيلك أو اطلب معاينة عرض من مبدع آخر.', 'Publish an agent listing or preview a creator’s offering.'],
  signIn: ['تسجيل الدخول باستخدام Pi', 'Sign in with Pi'],
  connected: ['تم التحقق من هوية Pi', 'Pi identity verified'],
  create: ['إنشاء وكيل خاص', 'Create a private agent'],
  publish: ['نشر في السوق', 'Publish to marketplace'],
  catalogue: ['سوق المبدعين', 'Creator catalogue'],
  mine: ['إبداعاتي', 'My creations'],
  rent: ['طلب معاينة التأجير', 'Request rental preview'],
  loading: ['جارٍ التحميل...', 'Loading...'],
  refresh: ['تحديث', 'Refresh'],
  name: ['اسم الوكيل', 'Agent name'],
  mission: ['المهمة الخاصة', 'Private mission'],
  template: ['القالب', 'Template'],
  publicTitle: ['العنوان العام', 'Public title'],
  summary: ['وصف عام', 'Public summary'],
  category: ['التصنيف', 'Category'],
  price: ['السعر بـ Pi', 'Price in Pi'],
  period: ['فترة الإيجار', 'Rental period'],
  license: ['الترخيص', 'Licence'],
  chooseAgent: ['اختر وكيلاً محفوظاً', 'Choose a saved agent'],
  noAgents: ['أنشئ وكيلاً خاصاً أولاً.', 'Create a private agent first.'],
  noListings: ['لا توجد عروض منشورة بعد.', 'No published listings yet.'],
  noMine: ['لم تنشر عروضاً بعد.', 'You have not published any listings yet.'],
  noPayment: ['معاينة فقط: لا دفع ولا منح صلاحية ولا نقل للشيفرة.', 'Preview only: no payment, entitlement, or source-code transfer.'],
  protected: ['الشيفرة والمهمة الخاصة لا تظهر في السوق.', 'Private code and mission details are not exposed in the catalogue.'],
  version: ['الإصدار', 'Version'],
  notReady: ['هذا القالب مخطط أو يتطلب موصلات خارجية ولم يعتمد للنشر.', 'This template is planned or requires external connectors and is not eligible for listing.'],
  success: ['تم حفظ الطلب كمعاينة غير مدفوعة.', 'The request was saved as a non-payment preview.'],
  emptyPrice: ['أدخل سعراً صحيحاً حتى 7 منازل عشرية.', 'Enter a valid price with up to 7 decimal places.'],
  marketNote: ['تُحفظ الأسعار بوحدة stroops الصحيحة دون تقريب عشري.', 'Prices are stored as integer stroops without floating-point rounding.'],
};
function t(key: string, ar: boolean) { return COPY[key]?.[ar ? 0 : 1] || key; }
function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-slate-300">{children}</label>;
}

export default function AgentMarketplacePanel({ locale }: { locale: AppLocale }) {
  const ar = locale === 'ar';
  const sandbox = process.env.NEXT_PUBLIC_PI_SANDBOX_MODE !== 'false';
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState('');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [agents, setAgents] = useState<OwnedAgent[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [ownListings, setOwnListings] = useState<OwnListing[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [templateKey, setTemplateKey] = useState('cyber-threat-watch');
  const [agentName, setAgentName] = useState('');
  const [mission, setMission] = useState('');
  const [agentId, setAgentId] = useState('');
  const [publicTitle, setPublicTitle] = useState('');
  const [publicSummary, setPublicSummary] = useState('');
  const [category, setCategory] = useState('cybersecurity');
  const [price, setPrice] = useState('0.0000001');
  const [period, setPeriod] = useState('per_run');
  const [license, setLicense] = useState('rental_access_only');
  const [previews, setPreviews] = useState<Preview[]>([]);

  const eligibleTemplates = useMemo(
    () => templates.filter((item) => ['prototype', 'demo'].includes(item.capability_level) && !item.requires_external_credentials && Boolean(MANIFESTS[item.template_key])),
    [templates],
  );
  const eligibleAgents = useMemo(
    () => agents.filter((agent) => eligibleTemplates.some((template) => template.template_key === agent.template_key) && agent.status === 'active'),
    [agents, eligibleTemplates],
  );

  async function call(accessToken: string, action: string, payload: Record<string, unknown> = {}) {
    const response = await fetch('/api/agents/workbench', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) throw new Error(typeof data.error === 'string' ? data.error : 'Marketplace request failed.');
    return data;
  }

  async function refresh(accessToken = token) {
    if (!accessToken) return;
    setBusy('refresh');
    setError('');
    try {
      const [boot, market, mine] = await Promise.all([
        call(accessToken, 'bootstrap'),
        call(accessToken, 'marketplace_browse'),
        call(accessToken, 'marketplace_my_listings'),
      ]);
      setTemplates(boot.templates || []);
      setAgents(boot.agents || []);
      setListings(market.listings || []);
      setOwnListings(mine.listings || []);
      if (!agentId && boot.agents?.[0]) setAgentId(boot.agents[0].id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load marketplace data.');
    } finally {
      setBusy('');
    }
  }

  useEffect(() => {
    let active = true;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (!window.Pi) {
        if (attempts >= 40) {
          window.clearInterval(timer);
          if (active) setSdkError(ar ? 'افتح المنصة عبر Pi Browser لاستخدام السوق.' : 'Open this platform in Pi Browser to use the marketplace.');
        }
        return;
      }
      window.clearInterval(timer);
      void initializePiSdk(sandbox)
        .then(() => { if (active) setSdkReady(true); })
        .catch((reason: unknown) => { if (active) setSdkError(reason instanceof Error ? reason.message : 'Pi SDK could not initialize.'); });
    }, 250);
    return () => { active = false; window.clearInterval(timer); };
  }, [ar, sandbox]);

  async function signIn() {
    const pi = window.Pi as (Window['Pi'] & { authenticate: (scopes: string[]) => Promise<AuthResult> }) | undefined;
    if (!pi || !sdkReady) return;
    setBusy('auth'); setError(''); setNotice('');
    try {
      const auth = await pi.authenticate(['username']);
      const verified = await fetch('/api/pi/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.accessToken },
        body: JSON.stringify({ action: 'auth_me' }),
      });
      const identity = await verified.json();
      if (!verified.ok || identity.verified !== true) throw new Error(identity.error || 'Pi identity verification failed.');
      setToken(auth.accessToken);
      setUsername(identity.user?.username || auth.user?.username || 'Pi Pioneer');
      await refresh(auth.accessToken);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pi authentication failed.');
    } finally {
      setBusy('');
    }
  }

  async function createAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setBusy('create'); setError(''); setNotice('');
    try {
      const result = await call(token, 'create_agent', { templateKey, name: agentName, mission, locale: ar ? 'ar' : 'en' });
      setAgentName(''); setMission(''); setAgentId(result.agent.id);
      await refresh(token);
      setNotice(ar ? 'تم حفظ الوكيل الخاص. يمكنك نشر بطاقة قدرات دون كشف المهمة.' : 'Private agent saved. You can publish capability metadata without exposing its mission.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Agent creation failed.');
    } finally {
      setBusy('');
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !agentId) return;
    const priceStroops = parsePiToStroops(price);
    if (priceStroops === null) { setError(t('emptyPrice', ar)); return; }
    const agent = agents.find((item) => item.id === agentId);
    const manifest = agent ? MANIFESTS[agent.template_key] : null;
    if (!manifest) { setError(t('notReady', ar)); return; }
    setBusy('publish'); setError(''); setNotice('');
    try {
      await call(token, 'marketplace_publish', {
        agentId, title: publicTitle, summary: publicSummary, category,
        priceStroops, billingPeriod: period, license, capabilityManifest: manifest,
      });
      await refresh(token);
      setNotice(ar ? 'تم نشر بطاقة عامة بإصدار جديد. لم تُنقل الشيفرة أو المهمة الخاصة.' : 'Public listing version published. Private code and mission were not transferred.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not publish the listing.');
    } finally {
      setBusy('');
    }
  }

  async function previewRent(listing: Listing) {
    if (!token) return;
    setBusy('rent:' + listing.id); setError(''); setNotice('');
    try {
      const result = await call(token, 'marketplace_rent_preview', { listingId: listing.id, idempotencyKey: crypto.randomUUID() });
      setPreviews((current) => [result.intent, ...current.filter((item) => item.id !== result.intent.id)].slice(0, 10));
      setNotice(t('success', ar) + ' ' + t('noPayment', ar));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Rental preview failed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section id="agent-marketplace" aria-labelledby="agent-marketplace-title" className="mx-4 my-4 rounded-2xl border border-violet-400/20 bg-[#0B1220] p-4 shadow-xl md:mx-6 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-xl border border-violet-300/20 bg-violet-300/10 p-3 text-violet-200"><Store className="h-6 w-6" aria-hidden="true" /></span>
          <div><h2 id="agent-marketplace-title" className="text-lg font-bold text-white">{t('title', ar)}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-white/60">{t('subtitle', ar)}</p></div>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={!token || Boolean(busy)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-40">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />{t('refresh', ar)}
        </button>
      </header>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2 text-sm text-white/75"><LockKeyhole className="h-4 w-4 text-violet-200" aria-hidden="true" />{token ? t('connected', ar) + ' · ' + username : t('signIn', ar)}</div>
        {!token && <button type="button" onClick={() => void signIn()} disabled={!sdkReady || Boolean(busy)} className="rounded-lg bg-violet-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{busy === 'auth' ? (ar ? 'جارٍ التحقق...' : 'Verifying...') : t('signIn', ar)}</button>}
      </div>
      {sdkError && <p className="mt-3 text-xs text-amber-200/80">{sdkError}</p>}
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-200"><AlertCircle className="mr-2 inline h-4 w-4" />{error}</p>}
      {notice && <p role="status" className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-100"><CheckCircle2 className="mr-2 inline h-4 w-4" />{notice}</p>}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-cyan-200" /><h3 className="text-sm font-bold text-white">{t('create', ar)}</h3></div>
            <form onSubmit={createAgent} className="space-y-3">
              <div><FieldLabel>{t('template', ar)}</FieldLabel><select value={templateKey} onChange={(event) => { setTemplateKey(event.target.value); setCategory(CATEGORY_BY_TEMPLATE[event.target.value] || 'research'); }} disabled={!token || Boolean(busy)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white">
                {eligibleTemplates.map((item) => <option key={item.template_key} value={item.template_key}>{item.name} · {item.capability_level}</option>)}
              </select>{eligibleTemplates.length === 0 && <p className="mt-1 text-xs text-amber-200">{t('notReady', ar)}</p>}</div>
              <div><FieldLabel>{t('name', ar)}</FieldLabel><input required minLength={2} maxLength={80} value={agentName} onChange={(event) => setAgentName(event.target.value)} disabled={!token || Boolean(busy)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white" /></div>
              <div><FieldLabel>{t('mission', ar)}</FieldLabel><textarea required minLength={5} maxLength={1200} rows={3} value={mission} onChange={(event) => setMission(event.target.value)} disabled={!token || Boolean(busy)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white" /></div>
              <p className="text-[11px] leading-5 text-slate-400">{t('protected', ar)}</p>
              <button type="submit" disabled={!token || Boolean(busy) || !eligibleTemplates.some((item) => item.template_key === templateKey)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />{busy === 'create' ? (ar ? 'جارٍ الحفظ...' : 'Saving...') : t('create', ar)}</button>
            </form>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-violet-200" /><h3 className="text-sm font-bold text-white">{t('publish', ar)}</h3></div>
            <form onSubmit={publish} className="space-y-3">
              <div><FieldLabel>{t('chooseAgent', ar)}</FieldLabel><select value={agentId} onChange={(event) => setAgentId(event.target.value)} disabled={!token || Boolean(busy) || eligibleAgents.length === 0} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white">
                {eligibleAgents.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.template_key}</option>)}
              </select>{eligibleAgents.length === 0 && <p className="mt-1 text-xs text-amber-200">{t('noAgents', ar)}</p>}</div>
              <div><FieldLabel>{t('publicTitle', ar)}</FieldLabel><input value={publicTitle} onChange={(event) => setPublicTitle(event.target.value)} required minLength={3} maxLength={80} disabled={!token || !agentId || Boolean(busy)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white" /></div>
              <div><FieldLabel>{t('summary', ar)}</FieldLabel><textarea value={publicSummary} onChange={(event) => setPublicSummary(event.target.value)} required minLength={20} maxLength={600} rows={3} disabled={!token || !agentId || Boolean(busy)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><FieldLabel>{t('category', ar)}</FieldLabel><select value={category} onChange={(event) => setCategory(event.target.value)} disabled={!token || Boolean(busy)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white">{Object.entries(CATEGORY).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                <div><FieldLabel>{t('price', ar)}</FieldLabel><input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} disabled={!token || Boolean(busy)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><FieldLabel>{t('period', ar)}</FieldLabel><select value={period} onChange={(event) => setPeriod(event.target.value)} disabled={!token || Boolean(busy)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white"><option value="per_run">{ar ? 'لكل تشغيل' : 'Per run'}</option><option value="weekly">{ar ? 'أسبوعي' : 'Weekly'}</option><option value="monthly">{ar ? 'شهري' : 'Monthly'}</option></select></div>
                <div><FieldLabel>{t('license', ar)}</FieldLabel><select value={license} onChange={(event) => setLicense(event.target.value)} disabled={!token || Boolean(busy)} className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white"><option value="rental_access_only">{ar ? 'استخدام مؤجر' : 'Rental access only'}</option><option value="personal_use_rental">{ar ? 'استخدام شخصي' : 'Personal use rental'}</option><option value="commercial_use_rental">{ar ? 'استخدام تجاري' : 'Commercial use rental'}</option></select></div>
              </div>
              <p className="text-[11px] text-slate-400">{t('marketNote', ar)} {ar ? 'لا توجد رسوم نشر من المنصة؛ المبدع يحدد السعر بوحدة Pi.' : 'No platform listing fee; creators set prices in Pi.'}</p>
              <button type="submit" disabled={!token || Boolean(busy) || !agentId || parsePiToStroops(price) === null} className="w-full rounded-lg bg-violet-600 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40">{busy === 'publish' ? (ar ? 'جارٍ النشر...' : 'Publishing...') : t('publish', ar)}</button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-emerald-200" /><h3 className="text-sm font-bold text-white">{t('catalogue', ar)}</h3></div>
            <p className="mb-3 text-[11px] text-slate-400">{t('protected', ar)} {ar ? 'يشارك السوق بيانات القدرات والترخيص والسعر فقط.' : 'The catalogue shares capability, licence, and price metadata only.'}</p>
            <div className="space-y-3">
              {listings.map((item) => <article key={item.id} className="rounded-lg border border-white/10 bg-slate-950/80 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h4 className="font-semibold text-white">{item.title}</h4><p className="mt-1 text-xs leading-5 text-slate-400">{item.summary}</p></div><span className="rounded-full border border-cyan-300/20 px-2 py-1 text-[10px] text-cyan-100">{item.capabilityLevel}</span></div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300"><span><Wallet className="mr-1 inline h-3 w-3" />{formatStroopsAsPi(item.priceStroops) || '—'} Pi</span><span><BadgeCheck className="mr-1 inline h-3 w-3" />{item.creatorLabel}</span><span>{t('version', ar)} {item.version}</span><span>{item.billingPeriod}</span></div>
                <button type="button" onClick={() => void previewRent(item)} disabled={!token || Boolean(busy) || item.status !== 'published'} className="mt-3 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-[11px] font-semibold text-emerald-100 disabled:opacity-40">{busy === 'rent:' + item.id ? t('loading', ar) : t('rent', ar)}</button>
              </article>)}
              {listings.length === 0 && <p className="text-xs text-slate-500">{t('noListings', ar)}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white"><Sparkles className="h-4 w-4 text-violet-200" />{t('mine', ar)}</h3>
            <div className="space-y-2">{ownListings.map((item) => <div key={item.id} className="rounded-lg border border-white/10 p-3"><div className="font-semibold text-white">{item.title}</div><p className="mt-1 text-[11px] text-slate-400">{item.agentName} · {t('version', ar)} {item.version} · {formatStroopsAsPi(item.priceStroops)} Pi</p></div>)}{ownListings.length === 0 && <p className="text-xs text-slate-500">{t('noMine', ar)}</p>}</div>
          </div>

          <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-amber-100"><Shield className="h-4 w-4" />{t('noPayment', ar)}</p></div>
          {previews.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300"><p>{ar ? 'تم حفظ معاينة الطلب' : 'Rental preview saved'} · v{item.version}</p><p className="mt-1">{ar ? 'الدفع' : 'Payment'}: {item.paymentState} · {ar ? 'الاستحقاق' : 'Entitlement'}: {item.entitlementGranted ? 'true' : 'false'}</p></div>)}
        </div>
      </div>
    </section>
  );
}

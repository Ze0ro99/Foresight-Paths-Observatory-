'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  LogIn,
  Plus,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Vote,
  WalletCards,
} from 'lucide-react';
import { AppLocale, GlobalSensedSignal } from '@/lib/types';
import { initializePiSdk } from '@/lib/pi-sdk-client';
import { formatStroopsAsPi, isValidPiWalletAddress, isValidSubscriptionServiceId, maxSubscriptionPeriods } from '@/lib/pi-subscription-sim.mjs';

type PiAuthResponse = {
  accessToken: string;
  user?: { username?: string };
};
type Template = {
  template_key: string;
  name: string;
  description: string;
  category: string;
  capability_level: string;
  requires_external_credentials: boolean;
  safety_notes: string;
};
type Agent = {
  id: string;
  template_key: string;
  name: string;
  mission: string;
  status: string;
  created_at: string;
};
type Finding = {
  title: string;
  detail: string;
  evidenceClass: string;
  sourceUrl: string | null;
  observedAt: string | null;
};
type RunResult = {
  status: 'ok' | 'partial' | 'unavailable' | 'failed';
  executionMode: 'simulation';
  summary: string;
  observedAt: string;
  coverage: {
    recordsReviewed: number;
    sources: Array<{ key: string; name: string; freshness: string; coverageNote?: string }>;
    missingSources: string[];
    freshness: Record<string, number>;
  };
  findings: Finding[];
  recommendations: string[];
  limits: string[];
  riskScore: number | null;
  forecast: unknown | null;
  externalActionsExecuted: number;
  transactionsSubmitted: number;
  entitlementsGranted: number;
};
type RunRecord = {
  id: string;
  agent_id: string;
  run_status: string;
  execution_mode: string;
  created_at: string;
  result: RunResult;
};
type Proposal = {
  id: string;
  kind: string;
  title: string;
  summary: string;
  risk_label: string;
  status: string;
  execution_state: string;
  votesFor: number;
  votesAgainst: number;
  myVote: 'for' | 'against' | null;
};
type SubscriptionPreview = {
  id: string;
  plan_key: string;
  pi_service_id: string | null;
  periods: number;
  billing_mode: 'preview';
  payment_started: false;
  entitlement_granted: false;
  created_at: string;
};

type PiSubscriptionSdk = {
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void,
  ) => Promise<{ accessToken: string; user?: { username?: string; uid?: string } }>;
  SmartContract?: {
    Subscription?: {
      getService: (sourceAddress: string, serviceId: string, options: { mode: 'simulate' }) => Promise<unknown>;
      subscribe: (
        subscriberAddress: string,
        serviceId: string,
        autoRenew: boolean,
        periods: string,
        options: { mode: 'simulate' },
      ) => Promise<unknown>;
    };
  };
};

type NativeSubscriptionPreview = {
  serviceName: string;
  serviceId: string;
  pricePi: string;
  periodDays: string;
  trialDays: string;
  periods: number;
  initialChargePi: string;
  renewalAllowancePi: string;
  autoRenew: boolean;
  subscriptionId: string | null;
  serviceEndAt: string | null;
  nextChargeAt: string | null;
};

const PLAN_OPTIONS = [
  { key: 'continuous_watch', ar: 'مراقبة مستمرة', en: 'Continuous monitoring' },
  { key: 'incident_response', ar: 'متابعة الحوادث', en: 'Incident watch' },
  { key: 'daily_brief', ar: 'موجز يومي', en: 'Daily intelligence brief' },
  { key: 'weekly_review', ar: 'مراجعة أسبوعية', en: 'Weekly review' },
];

function statusLabel(status: string, ar: boolean) {
  if (status === 'ok') return ar ? 'متصل' : 'Connected';
  if (status === 'partial') return ar ? 'تغطية جزئية' : 'Partial coverage';
  if (status === 'unavailable') return ar ? 'غير متاح' : 'Unavailable';
  if (status === 'failed') return ar ? 'تعذر التنفيذ' : 'Failed';
  return status;
}

function formatDate(value: string | null | undefined, ar: boolean) {
  if (!value) return ar ? 'غير معروف' : 'Unknown';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return ar ? 'غير معروف' : 'Unknown';
  return date.toLocaleString(ar ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CloudAgentView({
  locale,
  activeSignals,
  onSelectEncryptedNodeOnMap,
}: {
  locale: AppLocale;
  activeSignals: GlobalSensedSignal[];
  onSelectEncryptedNodeOnMap: (nodeId: string) => void;
}) {
  const ar = locale === 'ar';
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [subscriptionPreviews, setSubscriptionPreviews] = useState<SubscriptionPreview[]>([]);
  const [latestResult, setLatestResult] = useState<RunResult | null>(null);

  const [templateKey, setTemplateKey] = useState('cyber-threat-watch');
  const [agentName, setAgentName] = useState('');
  const [mission, setMission] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [proposalKind, setProposalKind] = useState('agent');
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalSummary, setProposalSummary] = useState('');
  const [planKey, setPlanKey] = useState('daily_brief');
  const [serviceId, setServiceId] = useState('');
  const [periods, setPeriods] = useState(1);
  const [subscriberAddress, setSubscriberAddress] = useState('');
  const [nativePeriods, setNativePeriods] = useState(1);
  const [nativeAutoRenew, setNativeAutoRenew] = useState(true);
  const [nativePreview, setNativePreview] = useState<NativeSubscriptionPreview | null>(null);
  const [nativePreviewError, setNativePreviewError] = useState<string | null>(null);

  const copy = {
    title: ar ? 'مركز الوكلاء والعمليات الذكية' : 'Agent Operations Workbench',
    subtitle: ar
      ? 'أنشئ وكلاء بحث ومراقبة، شغّل تحليلات اختبار محفوظة، وحوّل النتائج إلى مقترحات قابلة للتصويت.'
      : 'Create research and monitoring agents, run saved test analyses, and turn results into proposals for review.',
    login: ar ? 'تسجيل الدخول عبر Pi' : 'Sign in with Pi',
    connected: ar ? 'متصل بهوية Pi' : 'Pi identity connected',
    sdkWait: ar ? 'جارٍ تهيئة Pi Browser…' : 'Preparing Pi Browser…',
    sdkMissing: ar ? 'افتح التطبيق داخل Pi Browser على تطبيق Testnet المسجل.' : 'Open this app in Pi Browser under the registered Testnet app.',
    signInFirst: ar ? 'سجّل الدخول لفتح مساحة العمل الخاصة بك.' : 'Sign in to open your private workspace.',
    templates: ar ? 'قوالب الوكلاء' : 'Agent templates',
    newAgent: ar ? 'إنشاء وكيل جديد' : 'Create an agent',
    agentName: ar ? 'اسم الوكيل' : 'Agent name',
    mission: ar ? 'مهمة الوكيل' : 'Agent mission',
    create: ar ? 'إنشاء الوكيل' : 'Create agent',
    myAgents: ar ? 'وكلائي' : 'My agents',
    run: ar ? 'تحليل تجريبي' : 'Run analysis',
    runLabel: ar ? 'تشغيل قراءة وتحليل محفوظ' : 'Run saved read-only analysis',
    results: ar ? 'نتيجة الجولة' : 'Run result',
    recommendations: ar ? 'التوصيات' : 'Recommendations',
    findings: ar ? 'الملاحظات المنسوبة للمصادر' : 'Source-attributed findings',
    coverage: ar ? 'التغطية والمصادر' : 'Coverage and sources',
    noAgents: ar ? 'لم تنشئ وكلاء بعد.' : 'You have not created any agents yet.',
    noResult: ar ? 'شغّل أحد وكلائك لعرض النتيجة هنا.' : 'Run an agent to see its result here.',
    proposals: ar ? 'مقترحات المجتمع والحوكمة' : 'Community proposals and governance',
    proposalTitle: ar ? 'عنوان المقترح' : 'Proposal title',
    proposalSummary: ar ? 'ملخص الفكرة والفائدة والمخاطر' : 'Idea, benefit, and risk summary',
    proposalType: ar ? 'نوع المقترح' : 'Proposal type',
    submitProposal: ar ? 'إرسال للمراجعة والتصويت' : 'Submit for review and voting',
    voteFor: ar ? 'أؤيد' : 'Support',
    voteAgainst: ar ? 'لا أؤيد' : 'Do not support',
    alreadyVoted: ar ? 'تم تسجيل تصويتك' : 'Your vote is recorded',
    subscriptions: ar ? 'معاينة خطط الاشتراك المستمر' : 'Recurring subscription plan previews',
    plan: ar ? 'نوع المتابعة' : 'Monitoring plan',
    serviceId: ar ? 'Pi Service ID (اختياري)' : 'Pi Service ID (optional)',
    periods: ar ? 'عدد الفترات للمعاينة' : 'Preview periods',
    previewSave: ar ? 'حفظ المعاينة' : 'Save preview',
    previews: ar ? 'المعاينات المحفوظة' : 'Saved previews',
    noCharge: ar ? 'معاينة فقط: لا توجد مطالبة للمحفظة أو دفعة أو تجديد أو تفعيل استحقاق.' : 'Preview only: no wallet prompt, charge, renewal, or entitlement is started.',
    safety: ar ? 'ضوابط التشغيل' : 'Execution safeguards',
    noAttack: ar ? 'الأمن السيبراني دفاعي ومصرّح به فقط: حفظ الأدلة، التحقق، العزل للأنظمة المملوكة أو المفوضة، التصحيح والاستعادة. لا يوجد اختراق مضاد أو فخ هجومي أو مطاردة للمهاجم.' : 'Cybersecurity is defensive and authorized only: preserve evidence, verify, contain owned/authorized systems, patch, and recover. No hack-back, offensive trap, or attacker pursuit.',
    noAuto: ar ? 'كل الجولات محاكاة وقراءة فقط. لا تغييرات خارجية ولا توقيع ولا تحويلات ولا تنفيذ عقود.' : 'All runs are read-only simulations. No external changes, signing, transfers, or contract execution.',
    marketUnavailable: ar ? 'تحليلات الأسواق تحتاج موصل أسعار تاريخية معتمد؛ لن نعرض أسعارًا أو توقعات مختلقة.' : 'Market analysis requires a trusted historical price feed; no prices or forecasts are fabricated.',
    noCode: ar ? 'تعرض هذه الشاشة النتائج والخدمات فقط؛ تفاصيل التنفيذ البرمجية مخفية عن المستخدم.' : 'This view presents outcomes and services only; implementation code is hidden from users.',
    signalCount: ar ? 'الإشارات العالمية المتاحة في الخريطة' : 'Global signals currently on the map',
  };

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const initialise = async () => {
      if (!window.Pi) {
        timer = setTimeout(initialise, 350);
        return;
      }
      try {
        await initializePiSdk(process.env.NEXT_PUBLIC_PI_SANDBOX_MODE !== 'false');
        if (!cancelled) setSdkReady(true);
      } catch {
        if (!cancelled) setSdkError(locale === 'ar' ? 'افتح التطبيق داخل Pi Browser على تطبيق Testnet المسجل.' : 'Open this app in Pi Browser under the registered Testnet app.');
      }
    };
    void initialise();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [locale]);

  const callWorkbench = async (token: string, action: string, payload: Record<string, unknown> = {}) => {
    const response = await fetch('/api/agents/workbench', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ action, locale: ar ? 'ar' : 'en', ...payload }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      throw new Error(typeof data.error === 'string' ? data.error : (ar ? 'تعذر إكمال العملية.' : 'The request could not be completed.'));
    }
    return data;
  };

  const applySnapshot = (data: {
    templates?: Template[];
    agents?: Agent[];
    recentRuns?: RunRecord[];
    proposals?: Proposal[];
    subscriptionPreviews?: SubscriptionPreview[];
  }) => {
    setTemplates(data.templates || []);
    setAgents(data.agents || []);
    setRecentRuns(data.recentRuns || []);
    setProposals(data.proposals || []);
    setSubscriptionPreviews(data.subscriptionPreviews || []);
    setLatestResult(data.recentRuns?.[0]?.result || null);
    if (!templateKey && data.templates?.[0]) setTemplateKey(data.templates[0].template_key);
    if (!selectedAgentId && data.agents?.[0]) setSelectedAgentId(data.agents[0].id);
  };

  const signIn = async () => {
    setError(null);
    setNotice(null);
    if (!sdkReady || !window.Pi) {
      setError(sdkError || copy.sdkWait);
      return;
    }
    setBusy('auth');
    try {
      const auth = await window.Pi.authenticate(['username'], () => undefined);
      if (!auth?.accessToken) throw new Error(ar ? 'لم يُرجع Pi رمز جلسة صالحًا.' : 'Pi did not return a valid session token.');
      setAccessToken(auth.accessToken);
      setUsername(auth.user?.username || null);
      const snapshot = await callWorkbench(auth.accessToken, 'bootstrap');
      applySnapshot(snapshot);
      setNotice(ar ? 'تم التحقق من هويتك وفتح مساحة العمل.' : 'Your Pi identity was verified and your workbench is ready.');
    } catch (reason) {
      setAccessToken(null);
      setUsername(null);
      setError(reason instanceof Error ? reason.message : (ar ? 'تعذر تسجيل الدخول.' : 'Pi sign-in failed.'));
    } finally {
      setBusy(null);
    }
  };

  const refresh = async () => {
    if (!accessToken) return;
    setBusy('refresh');
    setError(null);
    try {
      const snapshot = await callWorkbench(accessToken, 'bootstrap');
      applySnapshot(snapshot);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (ar ? 'تعذر تحديث البيانات.' : 'Could not refresh the workbench.'));
    } finally {
      setBusy(null);
    }
  };

  const createAgent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    setBusy('create-agent');
    setError(null);
    setNotice(null);
    try {
      const response = await callWorkbench(accessToken, 'create_agent', {
        templateKey,
        name: agentName,
        mission,
      });
      setAgents((current) => [response.agent as Agent, ...current]);
      setSelectedAgentId(response.agent.id);
      setAgentName('');
      setMission('');
      setNotice(ar ? 'تم إنشاء الوكيل وحفظه في حسابك.' : 'Your agent was created and saved to your account.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (ar ? 'تعذر إنشاء الوكيل.' : 'Could not create the agent.'));
    } finally {
      setBusy(null);
    }
  };

  const runAgent = async (agent: Agent) => {
    if (!accessToken) return;
    setBusy('run:' + agent.id);
    setError(null);
    setNotice(null);
    try {
      const response = await callWorkbench(accessToken, 'run_agent', { agentId: agent.id });
      setLatestResult(response.result as RunResult);
      setRecentRuns((current) => [{ ...response.run, result: response.result }, ...current].slice(0, 10));
      setSelectedAgentId(agent.id);
      setNotice(ar ? 'اكتملت الجولة التجريبية وحُفظت نتيجتها.' : 'The test analysis finished and its result was saved.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (ar ? 'تعذر تشغيل التحليل.' : 'The analysis could not run.'));
    } finally {
      setBusy(null);
    }
  };

  const createProposal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    setBusy('proposal');
    setError(null);
    setNotice(null);
    try {
      const response = await callWorkbench(accessToken, 'create_proposal', {
        title: proposalTitle,
        summary: proposalSummary,
        kind: proposalKind,
        agentId: selectedAgentId || undefined,
        riskLabel: 'unassessed',
      });
      setProposals((current) => [response.proposal as Proposal, ...current]);
      setProposalTitle('');
      setProposalSummary('');
      setNotice(ar ? 'أُرسل المقترح إلى قائمة المراجعة. لن يُنفّذ تلقائيًا.' : 'The proposal was added for review. It will not execute automatically.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (ar ? 'تعذر حفظ المقترح.' : 'Could not save the proposal.'));
    } finally {
      setBusy(null);
    }
  };

  const vote = async (proposal: Proposal, direction: 'for' | 'against') => {
    if (!accessToken || proposal.myVote) return;
    setBusy('vote:' + proposal.id);
    setError(null);
    try {
      const result = await callWorkbench(accessToken, 'vote', { proposalId: proposal.id, vote: direction });
      setProposals((current) => current.map((item) => item.id === proposal.id
        ? { ...item, votesFor: result.votesFor, votesAgainst: result.votesAgainst, myVote: direction }
        : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (ar ? 'تعذر تسجيل التصويت.' : 'Could not record your vote.'));
    } finally {
      setBusy(null);
    }
  };

  const saveSubscriptionPreview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    setBusy('subscription');
    setError(null);
    setNotice(null);
    try {
      const response = await callWorkbench(accessToken, 'subscription_preview', {
        planKey,
        serviceId,
        periods,
      });
      setSubscriptionPreviews((current) => [response.preview as SubscriptionPreview, ...current]);
      setNotice(ar ? 'حُفظت معاينة الخطة فقط؛ لم تبدأ أي دفعة.' : 'The plan preview was saved only; no payment was started.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (ar ? 'تعذر حفظ المعاينة.' : 'Could not save the preview.'));
    } finally {
      setBusy(null);
    }
  };


  const simulateNativeSubscription = async () => {
    setNativePreviewError(null);
    setNativePreview(null);
    if (!sdkReady) {
      setNativePreviewError(ar ? 'افتح التطبيق داخل Pi Browser على تطبيق Testnet المسجل.' : 'Open the registered Testnet app in Pi Browser.');
      return;
    }
    if (!isValidPiWalletAddress(subscriberAddress)) {
      setNativePreviewError(ar ? 'أدخل عنوان محفظة Pi العامة الصحيح (G…). لا تُدخل عبارة الاسترداد أو كلمة مرور.' : 'Enter a valid public Pi wallet address (G…). Never enter a recovery phrase or passphrase.');
      return;
    }
    if (!isValidSubscriptionServiceId(serviceId)) {
      setNativePreviewError(ar ? 'أدخل معرّف خدمة رقميًا مسجلًا مسبقًا في بوابة مطوري Pi.' : 'Enter a numeric service ID already registered in the Pi Developer Portal.');
      return;
    }
    if (!Number.isInteger(nativePeriods) || nativePeriods < 1) {
      setNativePreviewError(ar ? 'عدد الفترات يجب أن يكون عددًا صحيحًا موجبًا.' : 'The number of periods must be a positive integer.');
      return;
    }

    setBusy('native-subscription');
    try {
      const pi = (window as unknown as { Pi?: PiSubscriptionSdk }).Pi;
      const subscriptionApi = pi?.SmartContract?.Subscription;
      if (!pi?.authenticate || !subscriptionApi) {
        throw new Error('SDK_UNAVAILABLE');
      }
      // The payments scope is requested only after the user explicitly starts this
      // no-signature Testnet simulation. The SDK calls below are simulate-only.
      const auth = await pi.authenticate(['username', 'payments'], () => undefined);
      if (!auth?.accessToken) throw new Error('PI_AUTH_FAILED');
      setAccessToken(auth.accessToken);
      if (auth.user?.username) setUsername(auth.user.username);

      const api = subscriptionApi;
      const rawService = await api.getService(subscriberAddress.trim(), serviceId.trim(), { mode: 'simulate' });
      if (!rawService || typeof rawService !== 'object') throw new Error('SERVICE_LOOKUP_FAILED');
      const service = rawService as Record<string, unknown>;
      if (service.is_active !== true) throw new Error('SERVICE_NOT_ACTIVE');

      let price: bigint;
      let periodSeconds: bigint;
      let trialSeconds: bigint;
      try {
        price = BigInt(String(service.price ?? ''));
        periodSeconds = BigInt(String(service.period_secs ?? ''));
        trialSeconds = BigInt(String(service.trial_period_secs ?? '0'));
      } catch {
        throw new Error('SERVICE_DATA_INVALID');
      }
      if (price <= BigInt(0) || periodSeconds <= BigInt(0) || trialSeconds < BigInt(0)) throw new Error('SERVICE_DATA_INVALID');

      const maxPeriods = maxSubscriptionPeriods(periodSeconds.toString(), trialSeconds.toString());
      const approvedPeriods = nativeAutoRenew ? nativePeriods : 1;
      if (nativeAutoRenew && (maxPeriods < 1 || approvedPeriods > maxPeriods)) {
        throw new Error('APPROVAL_WINDOW_EXCEEDED:' + maxPeriods);
      }

      const rawSimulation = await api.subscribe(
        subscriberAddress.trim(),
        serviceId.trim(),
        nativeAutoRenew,
        String(approvedPeriods),
        { mode: 'simulate' },
      );
      const simulation = rawSimulation && typeof rawSimulation === 'object'
        ? rawSimulation as Record<string, unknown>
        : {};
      const toIso = (value: unknown) => {
        const seconds = Number(value);
        return Number.isFinite(seconds) && seconds > 0
          ? new Date(seconds * 1000).toISOString()
          : null;
      };
      setNativePreview({
        serviceName: typeof service.name === 'string' ? service.name.slice(0, 120) : (ar ? 'خطة Pi' : 'Pi subscription'),
        serviceId: serviceId.trim(),
        pricePi: formatStroopsAsPi(price.toString()),
        periodDays: (Number(periodSeconds) / 86400).toFixed(2),
        trialDays: (Number(simulation.trial_period_secs ?? '0') / 86400).toFixed(2),
        periods: approvedPeriods,
        initialChargePi: formatStroopsAsPi((trialSeconds > BigInt(0) ? BigInt(0) : price).toString()),
        renewalAllowancePi: formatStroopsAsPi((nativeAutoRenew ? price * BigInt(approvedPeriods) : BigInt(0)).toString()),
        autoRenew: typeof simulation.auto_renew === 'boolean' ? simulation.auto_renew : nativeAutoRenew,
        subscriptionId: simulation.sub_id === undefined ? null : String(simulation.sub_id),
        serviceEndAt: toIso(simulation.service_end_ts),
        nextChargeAt: toIso(simulation.next_charge_ts),
      });
      setNotice(ar
        ? 'نجحت محاكاة عقد الاشتراك على Pi Testnet. لم يتم توقيع معاملة أو خصم Pi.'
        : 'The Pi Testnet subscription contract simulation succeeded. No transaction was signed and no Pi was charged.');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '';
      if (message.includes('APPROVAL_WINDOW_EXCEEDED:')) {
        const maximum = Number(message.split(':')[1]) || 0;
        setNativePreviewError(ar
          ? `هذه الخطة تتجاوز نافذة الموافقة في Testnet v1. الحد الأقصى الآمن هو ${maximum} فترة.`
          : `This plan exceeds the Testnet v1 approval window. The safe maximum is ${maximum} periods.`);
      } else if (message.includes('AlreadySubscribed')) {
        setNativePreviewError(ar ? 'هذه المحفظة لديها اشتراك نشط في هذه الخطة بالفعل.' : 'This wallet already has an active subscription to this plan.');
      } else if (message.includes('ServiceNotFound')) {
        setNativePreviewError(ar ? 'لم يتم العثور على هذه الخطة على عقد اشتراكات Pi Testnet.' : 'This service ID was not found on the Pi Testnet subscription contract.');
      } else if (message.includes('ServiceNotActive')) {
        setNativePreviewError(ar ? 'الخطة متوقفة ولا تقبل اشتراكات جديدة.' : 'This plan is inactive and does not accept new subscriptions.');
      } else if (message.includes('SERVICE_DATA_INVALID')) {
        setNativePreviewError(ar ? 'أعاد العقد بيانات سعر أو فترة غير صالحة.' : 'The contract returned an invalid price or billing period.');
      } else {
        setNativePreviewError(ar
          ? 'تعذرت المحاكاة. تحقق من Pi Browser وبيانات المحفظة ومعرّف الخطة، ثم حاول مجددًا.'
          : 'Simulation failed. Check Pi Browser, wallet address, and service ID, then try again.');
      }
    } finally {
      setBusy(null);
    }
  };

  const selectedTemplate = templates.find((item) => item.template_key === templateKey);
  const selectedAgent = agents.find((item) => item.id === selectedAgentId);
  void onSelectEncryptedNodeOnMap;

  return (
    <div className="space-y-5 text-sm">
      <section className="rounded-xl border border-violet-400/20 bg-gradient-to-br from-[#15122a] to-[#0b0b14] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-xl bg-violet-500/15 p-3 text-violet-200">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white">{copy.title}</h2>
              <p className="mt-1 max-w-3xl text-xs leading-6 text-slate-300">{copy.subtitle}</p>
              <p className="mt-2 text-[11px] text-slate-400">{copy.signalCount}: {activeSignals.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {accessToken ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.connected}{username ? ' · ' + username : ''}
                </span>
                <button type="button" onClick={() => void refresh()} disabled={Boolean(busy)} className="rounded-lg border border-white/10 p-2 text-slate-200 hover:bg-white/5 disabled:opacity-40" aria-label={ar ? 'تحديث' : 'Refresh'}>
                  <RefreshCw className={'h-4 w-4 ' + (busy === 'refresh' ? 'animate-spin' : '')} aria-hidden="true" />
                </button>
              </>
            ) : (
              <button type="button" onClick={() => void signIn()} disabled={!sdkReady || Boolean(busy)} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {busy === 'auth' ? copy.sdkWait : copy.login}
              </button>
            )}
          </div>
        </div>
        {!sdkReady && !accessToken && <p className="mt-3 text-xs text-amber-200">{sdkError || copy.sdkWait}</p>}
        {!accessToken && <p className="mt-3 text-xs text-slate-400">{copy.signInFirst}</p>}
        {error && <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-950/30 p-3 text-xs text-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}
        {notice && <div role="status" className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-950/20 p-3 text-xs text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{notice}</div>}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#10111b] p-3">
          <div className="flex items-center gap-2 text-violet-200"><Bot className="h-4 w-4" aria-hidden="true" /><span className="text-xs font-semibold">{copy.myAgents}</span></div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-white">{agents.length}<span className="ml-1 text-xs font-normal text-slate-500">/20</span></div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#10111b] p-3">
          <div className="flex items-center gap-2 text-sky-200"><Activity className="h-4 w-4" aria-hidden="true" /><span className="text-xs font-semibold">{copy.results}</span></div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-white">{recentRuns.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#10111b] p-3">
          <div className="flex items-center gap-2 text-emerald-200"><Vote className="h-4 w-4" aria-hidden="true" /><span className="text-xs font-semibold">{copy.proposals}</span></div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-white">{proposals.length}</div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#10111b] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-300" aria-hidden="true" />
            <h3 className="font-bold text-white">{copy.newAgent}</h3>
          </div>
          <form onSubmit={createAgent} className="space-y-3">
            <div>
              <label htmlFor="agent-template" className="mb-1 block text-xs text-slate-300">{copy.templates}</label>
              <select id="agent-template" value={templateKey} onChange={(event) => setTemplateKey(event.target.value)} className="w-full rounded-lg border border-white/10 bg-[#090a12] px-3 py-2.5 text-xs text-white" disabled={!accessToken}>
                {templates.map((item) => <option key={item.template_key} value={item.template_key}>{item.name}</option>)}
              </select>
              {selectedTemplate && <p className="mt-1 text-[11px] leading-5 text-slate-400">{selectedTemplate.description} {selectedTemplate.requires_external_credentials ? (ar ? 'يتطلب موصل بيانات خارجيًا.' : 'Requires an external data connector.') : ''}</p>}
            </div>
            <div>
              <label htmlFor="agent-name" className="mb-1 block text-xs text-slate-300">{copy.agentName}</label>
              <input id="agent-name" value={agentName} onChange={(event) => setAgentName(event.target.value)} minLength={2} maxLength={80} required placeholder={ar ? 'مثال: مراقب المخاطر الرقمية' : 'e.g. Digital Risk Watch'} className="w-full rounded-lg border border-white/10 bg-[#090a12] px-3 py-2.5 text-xs text-white placeholder:text-slate-600" disabled={!accessToken} />
            </div>
            <div>
              <label htmlFor="agent-mission" className="mb-1 block text-xs text-slate-300">{copy.mission}</label>
              <textarea id="agent-mission" value={mission} onChange={(event) => setMission(event.target.value)} minLength={5} maxLength={1200} required rows={3} placeholder={ar ? 'حدد الهدف والنطاق وما الذي يجب مراقبته...' : 'Describe the goal, scope, and what should be monitored...'} className="w-full resize-y rounded-lg border border-white/10 bg-[#090a12] px-3 py-2.5 text-xs leading-5 text-white placeholder:text-slate-600" disabled={!accessToken} />
            </div>
            {selectedTemplate && <p className="text-[11px] leading-5 text-amber-200/80">{selectedTemplate.safety_notes}</p>}
            <button type="submit" disabled={!accessToken || busy === 'create-agent' || agents.length >= 20} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40">
              <Plus className="h-4 w-4" aria-hidden="true" />{busy === 'create-agent' ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : copy.create}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#10111b] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-sky-300" aria-hidden="true" />
            <h3 className="font-bold text-white">{copy.myAgents}</h3>
          </div>
          <div className="space-y-2">
            {agents.length === 0 && <p className="rounded-lg border border-dashed border-white/10 p-5 text-center text-xs text-slate-500">{copy.noAgents}</p>}
            {agents.map((agent) => (
              <div key={agent.id} className={'rounded-lg border p-3 ' + (selectedAgentId === agent.id ? 'border-violet-400/40 bg-violet-500/5' : 'border-white/10 bg-[#0b0c14]')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{agent.name}</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-400">{agent.mission}</p>
                  </div>
                  <span className="rounded-full bg-slate-700/40 px-2 py-1 text-[10px] text-slate-300">{agent.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => setSelectedAgentId(agent.id)} className="text-[11px] text-violet-200 hover:text-white">{ar ? 'اختيار الوكيل' : 'Select agent'}</button>
                  <button type="button" onClick={() => void runAgent(agent)} disabled={!accessToken || Boolean(busy)} className="inline-flex items-center gap-1.5 rounded-md bg-sky-600/90 px-3 py-2 text-[11px] font-semibold text-white hover:bg-sky-500 disabled:opacity-40">
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />{busy === 'run:' + agent.id ? (ar ? 'جارٍ التحليل…' : 'Analyzing…') : copy.run}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#10111b] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-sky-300" aria-hidden="true" /><h3 className="font-bold text-white">{copy.results}</h3></div>
          {selectedAgent && <span className="text-[11px] text-slate-400">{selectedAgent.name}</span>}
        </div>
        {!latestResult && <p className="rounded-lg border border-dashed border-white/10 p-5 text-center text-xs text-slate-500">{copy.noResult}</p>}
        {latestResult && (
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-[#0a0b13] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">{formatDate(latestResult.observedAt, ar)}</span>
                <span className={'rounded-full px-2.5 py-1 text-[11px] font-semibold ' + (latestResult.status === 'ok' ? 'bg-emerald-500/10 text-emerald-300' : latestResult.status === 'partial' ? 'bg-amber-500/10 text-amber-200' : 'bg-slate-500/15 text-slate-300')}>{statusLabel(latestResult.status, ar)}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-white">{latestResult.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-400">
                <span className="rounded bg-white/5 px-2 py-1">{ar ? 'سجلات تمت مراجعتها' : 'Records reviewed'}: {latestResult.coverage?.recordsReviewed ?? 0}</span>
                <span className="rounded bg-white/5 px-2 py-1">{ar ? 'التنفيذ' : 'Execution'}: {ar ? 'محاكاة فقط' : 'Simulation only'}</span>
                <span className="rounded bg-white/5 px-2 py-1">{ar ? 'إجراءات خارجية' : 'External actions'}: 0</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-white/10 p-3">
                <h4 className="mb-2 text-xs font-semibold text-white">{copy.recommendations}</h4>
                <ul className="space-y-2 text-xs leading-6 text-slate-300">{(latestResult.recommendations || []).map((item, index) => <li key={index} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />{item}</li>)}</ul>
              </div>
              <div className="rounded-lg border border-white/10 p-3">
                <h4 className="mb-2 text-xs font-semibold text-white">{copy.coverage}</h4>
                <div className="space-y-2">
                  {(latestResult.coverage?.sources || []).map((source) => (
                    <div key={source.key} className="flex items-start justify-between gap-2 text-[11px]">
                      <div><p className="text-slate-200">{source.name}</p><p className="mt-0.5 text-slate-500">{source.coverageNote}</p></div>
                      <span className="shrink-0 rounded bg-white/5 px-2 py-1 text-slate-300">{source.freshness}</span>
                    </div>
                  ))}
                  {(!latestResult.coverage?.sources || latestResult.coverage.sources.length === 0) && <p className="text-xs text-slate-500">{ar ? 'لا توجد مصادر نشطة متاحة لهذه الوظيفة.' : 'No active sources are available for this function.'}</p>}
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold text-white">{copy.findings}</h4>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {(latestResult.findings || []).map((finding, index) => (
                  <article key={index} className="rounded-lg border border-white/10 bg-[#0a0b13] p-3">
                    <p className="font-semibold text-slate-100">{finding.title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-400">{finding.detail}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded bg-white/5 px-2 py-1 text-[10px] text-amber-200">{finding.evidenceClass}</span>
                      {finding.sourceUrl && <a href={finding.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-300 underline underline-offset-2">{ar ? 'فتح المصدر' : 'Open source'}</a>}
                    </div>
                  </article>
                ))}
                {(!latestResult.findings || latestResult.findings.length === 0) && <p className="rounded-lg border border-dashed border-white/10 p-4 text-xs text-slate-500">{ar ? 'لا توجد ملاحظات مسندة إلى مصادر لهذه الجولة.' : 'No source-attributed findings were available for this run.'}</p>}
              </div>
            </div>
            <div className="rounded-lg border border-amber-400/15 bg-amber-950/10 p-3 text-[11px] leading-5 text-amber-100/80">{(latestResult.limits || []).join(' ')}</div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#10111b] p-4">
          <div className="mb-3 flex items-center gap-2"><Vote className="h-4 w-4 text-emerald-300" aria-hidden="true" /><h3 className="font-bold text-white">{copy.proposals}</h3></div>
          <form onSubmit={createProposal} className="mb-4 space-y-2 rounded-lg border border-white/10 bg-[#0a0b13] p-3">
            <select value={proposalKind} onChange={(event) => setProposalKind(event.target.value)} className="w-full rounded-lg border border-white/10 bg-[#11121b] px-3 py-2 text-xs text-white" disabled={!accessToken}>
              <option value="agent">{ar ? 'وكيل ذكاء اصطناعي' : 'AI agent'}</option>
              <option value="smart_contract">{ar ? 'تصميم عقد ذكي' : 'Smart contract design'}</option>
              <option value="subscription">{ar ? 'خطة اشتراك' : 'Subscription plan'}</option>
            </select>
            <input value={proposalTitle} onChange={(event) => setProposalTitle(event.target.value)} required minLength={3} maxLength={120} placeholder={copy.proposalTitle} className="w-full rounded-lg border border-white/10 bg-[#11121b] px-3 py-2 text-xs text-white placeholder:text-slate-600" disabled={!accessToken} />
            <textarea value={proposalSummary} onChange={(event) => setProposalSummary(event.target.value)} required minLength={10} maxLength={2000} rows={3} placeholder={copy.proposalSummary} className="w-full rounded-lg border border-white/10 bg-[#11121b] px-3 py-2 text-xs leading-5 text-white placeholder:text-slate-600" disabled={!accessToken} />
            <button type="submit" disabled={!accessToken || busy === 'proposal'} className="w-full rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40">{busy === 'proposal' ? (ar ? 'جارٍ الإرسال…' : 'Submitting…') : copy.submitProposal}</button>
          </form>
          <div className="space-y-2">
            {proposals.map((proposal) => (
              <article key={proposal.id} className="rounded-lg border border-white/10 bg-[#0a0b13] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2"><p className="font-semibold text-white">{proposal.title}</p><span className="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-300">{proposal.status}</span></div>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">{proposal.summary}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span>{ar ? 'مع' : 'For'} {proposal.votesFor} · {ar ? 'ضد' : 'Against'} {proposal.votesAgainst}</span>
                  <span>{proposal.execution_state === 'not_executed' ? (ar ? 'لم يُنفّذ' : 'Not executed') : proposal.execution_state}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => void vote(proposal, 'for')} disabled={!accessToken || Boolean(proposal.myVote) || Boolean(busy)} className="rounded-md border border-emerald-400/20 px-3 py-1.5 text-[11px] text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40">{proposal.myVote === 'for' ? copy.alreadyVoted : copy.voteFor}</button>
                  <button type="button" onClick={() => void vote(proposal, 'against')} disabled={!accessToken || Boolean(proposal.myVote) || Boolean(busy)} className="rounded-md border border-rose-400/20 px-3 py-1.5 text-[11px] text-rose-200 hover:bg-rose-500/10 disabled:opacity-40">{proposal.myVote === 'against' ? copy.alreadyVoted : copy.voteAgainst}</button>
                </div>
              </article>
            ))}
            {proposals.length === 0 && <p className="text-xs text-slate-500">{ar ? 'لا توجد مقترحات محفوظة بعد.' : 'No saved proposals yet.'}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#10111b] p-4">
          <div className="mb-3 flex items-center gap-2"><WalletCards className="h-4 w-4 text-amber-200" aria-hidden="true" /><h3 className="font-bold text-white">{copy.subscriptions}</h3></div>
          <form onSubmit={saveSubscriptionPreview} className="space-y-3 rounded-lg border border-white/10 bg-[#0a0b13] p-3">
            <div>
              <label className="mb-1 block text-xs text-slate-300">{copy.plan}</label>
              <select value={planKey} onChange={(event) => setPlanKey(event.target.value)} className="w-full rounded-lg border border-white/10 bg-[#11121b] px-3 py-2 text-xs text-white" disabled={!accessToken}>
                {PLAN_OPTIONS.map((item) => <option key={item.key} value={item.key}>{ar ? item.ar : item.en}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">{copy.serviceId}</label>
              <input value={serviceId} onChange={(event) => setServiceId(event.target.value)} maxLength={160} placeholder="service_id" className="w-full rounded-lg border border-white/10 bg-[#11121b] px-3 py-2 text-xs text-white placeholder:text-slate-600" disabled={!accessToken} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-300">{copy.periods}</label>
              <input type="number" min={1} max={180} value={periods} onChange={(event) => setPeriods(Math.min(180, Math.max(1, Number(event.target.value) || 1)))} className="w-full rounded-lg border border-white/10 bg-[#11121b] px-3 py-2 text-xs text-white" disabled={!accessToken} />
            </div>
            <p className="text-[11px] leading-5 text-amber-100/80">{copy.noCharge}</p>
            <button type="submit" disabled={!accessToken || busy === 'subscription'} className="w-full rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/15 disabled:opacity-40">{busy === 'subscription' ? (ar ? 'جارٍ الحفظ…' : 'Saving…') : copy.previewSave}</button>
          </form>
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold text-white">{copy.previews}</h4>
            <div className="space-y-2">
              {subscriptionPreviews.map((preview) => (
                <div key={preview.id} className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-[#0a0b13] p-3 text-[11px]">
                  <div><p className="font-semibold text-slate-200">{PLAN_OPTIONS.find((plan) => plan.key === preview.plan_key)?.[ar ? 'ar' : 'en'] || preview.plan_key}</p><p className="mt-1 text-slate-500">{preview.pi_service_id || (ar ? 'لا يوجد Service ID' : 'No Service ID')} · {preview.periods}</p></div>
                  <span className="rounded bg-amber-500/10 px-2 py-1 text-amber-200">{ar ? 'معاينة' : 'Preview'}</span>
                </div>
              ))}
              {subscriptionPreviews.length === 0 && <p className="text-xs text-slate-500">{ar ? 'لا توجد معاينات محفوظة.' : 'No saved previews yet.'}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-300/20 bg-amber-950/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-amber-100">{ar ? 'محاكاة اشتراك Pi الأصلي على Testnet' : 'Native Pi Testnet subscription simulation'}</h3>
          <span className="rounded bg-amber-400/10 px-2 py-1 text-[10px] text-amber-100">{ar ? 'محاكاة فقط' : 'Simulation only'}</span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-amber-50/75">
          {ar
            ? 'يستخدم معرّف الخطة من النموذج أعلاه وعنوان المحفظة العامة. يقرأ الخطة ثم يحاكي استدعاء عقد الاشتراك الرسمي. لا توقيع، لا رسوم، لا خصم Pi، ولا استحقاق مدفوع.'
            : 'Uses the service ID from the form above and your public wallet address. It reads the registered plan and simulates the official subscription contract call. No signature, fee, Pi charge, or paid entitlement.'}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-slate-300">
            {ar ? 'عنوان المحفظة العامة على Testnet' : 'Public Testnet wallet address'}
            <input
              value={subscriberAddress}
              onChange={(event) => setSubscriberAddress(event.target.value.trim().toUpperCase())}
              autoComplete="off"
              spellCheck={false}
              maxLength={56}
              placeholder="G…"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#11121b] px-3 py-2 font-mono text-xs text-white placeholder:text-slate-600"
              disabled={!accessToken || busy === 'native-subscription'}
            />
          </label>
          <label className="block text-xs text-slate-300">
            {ar ? 'عدد الفترات المطلوب محاكاتها' : 'Billing periods to simulate'}
            <input
              type="number"
              min={1}
              max={25}
              value={nativePeriods}
              onChange={(event) => setNativePeriods(Math.min(25, Math.max(1, Number(event.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#11121b] px-3 py-2 text-xs text-white"
              disabled={!accessToken || busy === 'native-subscription'}
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={nativeAutoRenew} onChange={(event) => setNativeAutoRenew(event.target.checked)} disabled={busy === 'native-subscription'} />
          {ar ? 'محاكاة السماح بالتجديد الدوري' : 'Simulate recurring renewal permission'}
        </label>
        <button
          type="button"
          onClick={() => void simulateNativeSubscription()}
          disabled={!sdkReady || busy === 'native-subscription'}
          className="mt-3 w-full rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/15 disabled:opacity-40"
        >
          {busy === 'native-subscription'
            ? (ar ? 'جارٍ تشغيل المحاكاة…' : 'Running simulation…')
            : (ar ? 'محاكاة الاشتراك على Pi Testnet' : 'Simulate subscription on Pi Testnet')}
        </button>
        {nativePreviewError && <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-[11px] leading-5 text-rose-100">{nativePreviewError}</p>}
        {nativePreview && (
          <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-semibold text-emerald-100">{ar ? 'نتيجة المحاكاة' : 'Simulation result'}</p>
            <p className="mt-1 text-[10px] leading-5 text-emerald-100/75">{ar ? 'هذه نتيجة محاكاة فقط؛ المعرّفات والتواريخ المعروضة ليست سجلات على السلسلة، ولا يوجد اشتراك أو استحقاق مدفوع نشط.' : 'Simulation only: the IDs and dates below are not ledger records, and no subscription or paid entitlement is active.'}</p>
            <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
              <p className="text-slate-300">{ar ? 'الخطة' : 'Plan'}: <span className="font-semibold text-white">{nativePreview.serviceName}</span></p>
              <p className="text-slate-300">Service ID: <span className="font-mono text-white">{nativePreview.serviceId}</span></p>
              <p className="text-slate-300">{ar ? 'السعر لكل فترة' : 'Price per period'}: <span className="font-semibold text-white">{nativePreview.pricePi} Pi</span></p>
              <p className="text-slate-300">{ar ? 'مدة الفترة' : 'Billing period'}: <span className="font-semibold text-white">{nativePreview.periodDays} {ar ? 'يوم' : 'days'}</span></p>
              <p className="text-slate-300">{ar ? 'الفترات' : 'Periods'}: <span className="font-semibold text-white">{nativePreview.periods}</span></p>
              <p className="text-slate-300">{ar ? 'دفعة الفترة الأولى عند الاشتراك الفعلي' : 'Initial period charge if submitted'}: <span className="font-semibold text-white">{nativePreview.initialChargePi} Pi</span></p>
              <p className="text-slate-300">{ar ? 'سماحية التجديد المستقبلية المحاكاة' : 'Simulated future renewal allowance'}: <span className="font-semibold text-white">{nativePreview.renewalAllowancePi} Pi</span></p>
              <p className="text-slate-300">{ar ? 'التجديد' : 'Auto-renew'}: <span className="font-semibold text-white">{nativePreview.autoRenew ? (ar ? 'مفعّل في المحاكاة' : 'Enabled in simulation') : (ar ? 'غير مفعّل' : 'Disabled')}</span></p>
              <p className="text-slate-300">{ar ? 'التجربة المجانية' : 'Trial period'}: <span className="font-semibold text-white">{nativePreview.trialDays} {ar ? 'يوم' : 'days'}</span></p>
              {nativePreview.subscriptionId && <p className="text-slate-300">Simulation ID: <span className="font-mono text-white">{nativePreview.subscriptionId}</span></p>}
              {nativePreview.serviceEndAt && <p className="text-slate-300">{ar ? 'نهاية الفترة المحاكاة' : 'Simulated period end'}: <span className="font-semibold text-white">{formatDate(nativePreview.serviceEndAt, ar)}</span></p>}
              {nativePreview.nextChargeAt && <p className="text-slate-300">{ar ? 'موعد التجديد المحاكى' : 'Simulated next charge'}: <span className="font-semibold text-white">{formatDate(nativePreview.nextChargeAt, ar)}</span></p>}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-emerald-100/80">
              {ar
                ? 'هذه نتيجة محاكاة من عقد Testnet v1. لا تعني إنشاء اشتراك فعلي ولا تثبت هوية مالك العنوان ولا تمنح أي ميزة.'
                : 'This is a Testnet v1 contract simulation. It does not create a live subscription, prove address ownership, or grant any feature.'}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-emerald-400/15 bg-emerald-950/10 p-4">
        <div className="mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" /><h3 className="text-xs font-bold text-emerald-100">{copy.safety}</h3></div>
        <ul className="space-y-2 text-[11px] leading-5 text-emerald-50/80">
          <li>{copy.noAuto}</li>
          <li>{copy.noAttack}</li>
          <li>{copy.marketUnavailable}</li>
          <li>{copy.noCode}</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-400">
          <span className="rounded bg-white/5 px-2 py-1">{ar ? 'لا توقيع' : 'No signing'}</span>
          <span className="rounded bg-white/5 px-2 py-1">{ar ? 'لا تحويلات' : 'No transfers'}</span>
          <span className="rounded bg-white/5 px-2 py-1">{ar ? 'لا Mainnet' : 'No Mainnet'}</span>
          <span className="rounded bg-white/5 px-2 py-1">{ar ? 'تصويت غير ملزم' : 'Non-binding voting'}</span>
        </div>
      </section>
    </div>
  );
}

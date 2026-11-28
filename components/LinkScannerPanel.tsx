'use client';

import {useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import {AlertTriangle,CheckCircle2,ExternalLink,Globe,LoaderCircle,LockKeyhole,ScanSearch,ShieldCheck} from 'lucide-react';
import {initializePiSdk} from '@/lib/pi-sdk-client';
import type {AppLocale} from '@/lib/types';

type PiAuth={accessToken:string;user?:{username?:string;uid?:string}};
type InspectorPi=NonNullable<Window['Pi']>&{authenticate:(scopes:string[],onIncompletePaymentFound?:(payment:unknown)=>void)=>Promise<PiAuth>};
type InspectionReport={
 status:'reachable'|'http_error';inspectedAtUtc:string;requestedHost:string;finalUrl:string;httpStatus:number;contentType:string;
 redirects:Array<{statusCode:number;host:string}>;transport:{https:boolean};
 securityHeaders:{strictTransportSecurity:boolean;contentSecurityPolicy:boolean;xContentTypeOptions:boolean;frameProtection:boolean};
 appSignals:{title:string|null;description:string|null;hasViewport:boolean;hasPiSdk:boolean;hasPiInit:boolean;hasPiAuthenticate:boolean;hasPrivacyPolicy:boolean};
 recommendations:string[];limitations:string[];
};
type IntegrationBlueprint={title:string;priority:'high'|'medium'|'exploratory';why:string;steps:string[]};

function buildIntegrationBlueprints(report:InspectionReport,ar:boolean):IntegrationBlueprint[]{
 const securityGaps=[
  !report.transport.https&&(ar?'تفعيل HTTPS وإعادة توجيه HTTP بأمان':'Enforce HTTPS and safely redirect HTTP'),
  !report.securityHeaders.strictTransportSecurity&&(ar?'إضافة HSTS بعد التأكد من إعداد HTTPS':'Add HSTS after confirming HTTPS is correctly configured'),
  !report.securityHeaders.contentSecurityPolicy&&(ar?'كتابة CSP صريحة تسمح فقط بالمصادر اللازمة':'Define an explicit CSP with only required origins'),
  !report.securityHeaders.frameProtection&&(ar?'تحديد سياسة frame-ancestors المناسبة لتضمين PiNet':'Set frame-ancestors for the intended PiNet embedding'),
 ].filter(Boolean);
 const piGaps=[
  !report.appSignals.hasPiSdk&&(ar?'تحميل Pi SDK من المصدر الرسمي':'Load the Pi SDK from the official source'),
  !report.appSignals.hasPiInit&&(ar?'تهيئة Pi SDK قبل استدعاء المصادقة':'Initialize the Pi SDK before authentication'),
  !report.appSignals.hasPiAuthenticate&&(ar?'إضافة مصادقة Pi مع تحقق خادمي من الهوية':'Add Pi sign-in with server-side identity verification'),
  !report.appSignals.hasPrivacyPolicy&&(ar?'نشر سياسة خصوصية واضحة وسهلة الوصول':'Publish a clear, accessible privacy policy'),
 ].filter(Boolean);
 return [
  {title:ar?'الأمان وجاهزية Pi':'Security & Pi readiness',priority:securityGaps.length?'high':'medium',why:securityGaps.length?(ar?'تظهر نتيجة الفحص مؤشرات تحتاج مراجعة قبل الإطلاق.':'The scan found configuration signals worth reviewing before launch.'):(ar?'راجع الإعدادات دوريًا واختبرها داخل Pi Browser وPiNet.':'Re-test these controls in Pi Browser and the PiNet embed.'),steps:securityGaps.length?securityGaps as string[]:[ar?'اختبر تسجيل الدخول والجلسة داخل Pi Browser.':'Exercise sign-in and session behavior in Pi Browser.',ar?'تحقق من سياسة التضمين داخل PiNet دون تعطيل الحماية.':'Verify PiNet embedding without weakening protections.']},
  {title:ar?'وكلاء مساعدة المطوّر':'Developer-assistant agents',priority:'medium',why:ar?'يمكن للوكلاء تحويل نتائج الفحص إلى مهام مراجعة قابلة للتتبع؛ لا ينبغي منحهم صلاحية نشر تلقائي.':'Agents can turn scan findings into reviewable tasks; they should not receive automatic deployment authority.',steps:[ar?'وكيل مراجعة يحوّل كل ملاحظة إلى مهمة مع دليل ودرجة أولوية.':'A review agent converts each finding into a cited, prioritized task.',ar?'وكيل اختبار ينشئ حالات تحقق وبيانات اختبار غير حساسة.':'A test agent drafts validation cases and non-sensitive test data.',ar?'استخدم Hermes أو SoloHost كتكاملات اختيارية بعد التحقق من واجهاتها وصلاحياتها.':'Treat Hermes or SoloHost as optional integrations only after verifying their APIs and permissions.']},
  {title:ar?'خيار عقد ذكي على Testnet':'Testnet smart-contract option',priority:'exploratory',why:ar?'لا يثبت فحص الرابط أن التطبيق يحتاج عقدًا؛ اقترح العقد فقط إذا كانت هناك حاجة فعلية إلى حالة مشتركة أو قواعد قابلة للتحقق.':'A URL scan cannot establish that a contract is needed. Consider one only for a real shared-state or verifiable-rules requirement.',steps:[ar?'اكتب المتطلبات ومخطط التهديدات قبل اختيار Soroban أو أي شبكة.':'Document requirements and a threat model before choosing Soroban or another network.',ar?'ابدأ بعقد تجريبي واختبارات وحدود صلاحيات واضحة.':'Start with a testnet contract, tests, and explicit authorization boundaries.',ar?'لا تفعّل Mainnet أو توقيعًا أو تحويلات من هذه التوصية.':'This proposal does not enable Mainnet, signing, or transfers.']},
  {title:ar?'اشتراكات ودفعات مستقبلية':'Future subscriptions & payments',priority:'exploratory',why:ar?'قد تلائم الاشتراكات المنتج، لكنها تتطلب موافقة المستخدم وسجل استحقاق موثوقًا واختبارات تكرار آمنة.':'Subscriptions may fit the product, but require user consent, a trusted entitlement ledger, and idempotency tests.',steps:[ar?'حدّد المزايا المدفوعة والإلغاء والاسترداد قبل التصميم.':'Define paid entitlements, cancellation, and refunds first.',ar?'اختبر دورة الدفع على Test-Pi فقط مع مفاتيح خادمية وحماية من التكرار.':'Test with Test-Pi only, server-side credentials, and idempotency protection.',ar?'اترك المدفوعات وMainnet معطّلين حتى الموافقة والاختبارات.':'Keep payments and Mainnet disabled until approval and tests pass.']},
 ];
}

function StatusLine({ok,label}:{ok:boolean;label:string}){
 return <div className="flex items-start gap-2 text-sm">{ok?<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true"/>:<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true"/>}<span className={ok?'text-white/80':'text-white/70'}>{label}</span></div>;
}
export default function LinkScannerPanel({locale}:{locale:AppLocale}){
 const ar=locale==='ar',sandboxMode=process.env.NEXT_PUBLIC_PI_SANDBOX_MODE!=='false';
 const [sdkReady,setSdkReady]=useState(false),[sdkError,setSdkError]=useState('');
 const [accessToken,setAccessToken]=useState(''),[username,setUsername]=useState(''),[url,setUrl]=useState('');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [report,setReport]=useState<InspectionReport|null>(null);
 useEffect(()=>{
  let active=true,attempts=0;
  const timer=window.setInterval(()=>{
   attempts++;
   if(!window.Pi){if(attempts>=40){window.clearInterval(timer);if(active)setSdkError(ar?'افتح المنصة من Pi Browser لتحليل الرابط بعد تسجيل الدخول.':'Open this platform in Pi Browser to sign in and inspect a link.');}return;}
   window.clearInterval(timer);
   void initializePiSdk().then(()=>{if(active)setSdkReady(true);}).catch((error:unknown)=>{if(active)setSdkError(error instanceof Error?error.message:'Pi SDK initialization failed.');});
  },250);
  return()=>{active=false;window.clearInterval(timer);};
 },[ar,sandboxMode]);

 const signIn=async()=>{
  const pi=window.Pi as InspectorPi|undefined;
  if(!pi||!sdkReady){setMessage(ar?'يجب فتح المنصة داخل Pi Browser أولاً.':'Open the platform in Pi Browser first.');return;}
  setBusy(true);setMessage('');
  try{
   const auth=await pi.authenticate(['username']);
   const verified=await fetch('/api/pi/verify',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth.accessToken},body:JSON.stringify({action:'auth_me'})});
   const identity=await verified.json();
   if(!verified.ok||identity.verified!==true)throw new Error(identity.error||'Pi identity verification failed.');
   setAccessToken(auth.accessToken);setUsername(identity.user?.username||auth.user?.username||'Pioneer');
   setMessage(ar?'تم التحقق من جلسة Pi. يمكنك الآن فحص رابط عام.':'Pi session verified. You can now inspect a public URL.');
  }catch(error){setMessage(error instanceof Error?error.message:(ar?'تعذر تسجيل الدخول.':'Pi sign-in failed.'));}
  finally{setBusy(false);}
 };
 const inspect=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(!accessToken||!url.trim())return;
  setBusy(true);setMessage('');setReport(null);
  try{
   const response=await fetch('/api/links/analyze',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+accessToken},body:JSON.stringify({url:url.trim()})});
   const payload=await response.json();
   if(!response.ok||payload.ok!==true){const error=new Error(payload.error||'The URL could not be inspected.') as Error&{retryAfter?:string};error.retryAfter=response.headers.get('retry-after')||undefined;throw error;}
   setReport(payload.report as InspectionReport);
  }catch(error){
   const retryAfter=(error as Error&{retryAfter?:string}).retryAfter;
   setMessage(error instanceof Error?error.message+(retryAfter?' Retry after '+retryAfter+' seconds.':''):(ar?'فشل فحص الرابط.':'Link inspection failed.'));
  }finally{setBusy(false);}
 };

 return (
  <section id="link-analyzer" aria-labelledby="link-scanner-heading" className="mx-4 my-4 rounded-2xl border border-cyan-400/20 bg-[#0B1220] p-4 shadow-xl md:mx-6 md:p-6">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div className="flex items-start gap-3"><div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200"><ScanSearch className="h-6 w-6" aria-hidden="true"/></div><div>
     <h2 id="link-scanner-heading" className="text-lg font-bold text-white">{ar?'محلل روابط التطبيقات':'Application Link Analyzer'}</h2>
     <p className="mt-1 max-w-3xl text-sm leading-6 text-white/60">{ar?'أدخل رابط تطبيقك للحصول على فحص أولي آمن للاتصال وتهيئة Pi SDK وسياسات الحماية. لا ينفّذ المحلل الشيفرات ولا يجري اختبار اختراق.':'Inspect a public app URL for basic reachability, Pi SDK indicators, and security headers. The analyzer does not execute code or perform penetration testing.'}</p>
    </div></div>
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true"/>{ar?'فحص سلبي محمي من SSRF':'SSRF-protected passive check'}</span>
   </div>
   <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
    <div className="flex items-center gap-2 text-sm text-white/75"><LockKeyhole className="h-4 w-4 text-cyan-200" aria-hidden="true"/>{accessToken?(ar?'تم التحقق: '+username:'Verified Pioneer: '+username):(ar?'تسجيل الدخول مطلوب عبر Pi Browser':'Pi Browser sign-in required')}</div>
    <button type="button" onClick={()=>void signIn()} disabled={!sdkReady||busy||Boolean(accessToken)} className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">{accessToken?(ar?'تم تسجيل الدخول':'Signed in'):busy?(ar?'جارٍ التحقق...':'Verifying...'):ar?'تسجيل الدخول باستخدام Pi':'Sign in with Pi'}</button>
   </div>
   {sdkError&&<p className="mt-3 text-xs text-amber-200/80">{sdkError}</p>}
   <form onSubmit={inspect} className="mt-4 flex flex-col gap-2 sm:flex-row">
    <label htmlFor="application-url" className="sr-only">{ar?'رابط التطبيق':'Application URL'}</label>
    <div className="relative min-w-0 flex-1"><Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true"/>
     <input id="application-url" type="url" inputMode="url" autoComplete="url" maxLength={2048} required value={url} onChange={(event)=>setUrl(event.target.value)} placeholder="https://your-app.example" className="w-full rounded-lg border border-white/15 bg-black/30 py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300/70"/>
    </div>
    <button type="submit" disabled={!accessToken||busy||!url.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">{busy?<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true"/>:<ScanSearch className="h-4 w-4" aria-hidden="true"/>}{busy?(ar?'جارٍ الفحص...':'Inspecting...'):(ar?'فحص الرابط':'Inspect URL')}</button>
   </form>
   {message&&<p role="status" className="mt-3 text-sm text-cyan-100/80">{message}</p>}
   {report&&<div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3"><div className="min-w-0">
     <p className="text-xs uppercase tracking-wide text-white/45">{ar?'نتيجة الفحص':'Inspection result'}</p>
     <h3 className="mt-1 truncate font-semibold text-white">{report.appSignals.title||report.requestedHost}</h3>
     {report.appSignals.description&&<p className="mt-1 text-xs text-white/55">{report.appSignals.description}</p>}
     <p className="mt-1 truncate text-xs text-white/45">{report.finalUrl}</p>
    </div><span className={'rounded-full px-3 py-1 text-xs font-semibold '+(report.status==='reachable'?'bg-emerald-400/10 text-emerald-200':'bg-amber-400/10 text-amber-200')}>HTTP {report.httpStatus} · {report.status==='reachable'?(ar?'يمكن الوصول':'Reachable'):(ar?'استجابة خطأ':'HTTP error')}</span></div>
    <div className="grid gap-5 pt-4 lg:grid-cols-2"><div className="space-y-2">
     <h4 className="mb-2 text-sm font-bold text-white">{ar?'الأمان والاتصال':'Transport and security'}</h4>
     <StatusLine ok={report.transport.https} label={ar?'اتصال HTTPS':'HTTPS transport'}/>
     <StatusLine ok={report.securityHeaders.strictTransportSecurity} label="Strict-Transport-Security"/>
     <StatusLine ok={report.securityHeaders.contentSecurityPolicy} label="Content-Security-Policy"/>
     <StatusLine ok={report.securityHeaders.xContentTypeOptions} label="X-Content-Type-Options: nosniff"/>
     <StatusLine ok={report.securityHeaders.frameProtection} label={ar?'حماية تضمين الإطارات':'Frame embedding protection'}/>
     <StatusLine ok={report.appSignals.hasViewport} label={ar?'تهيئة عرض الهواتف':'Mobile viewport metadata'}/>
    </div><div className="space-y-2">
     <h4 className="mb-2 text-sm font-bold text-white">{ar?'مؤشرات تكامل Pi':'Pi integration indicators'}</h4>
     <StatusLine ok={report.appSignals.hasPiSdk} label="Pi SDK script reference"/>
     <StatusLine ok={report.appSignals.hasPiInit} label="Pi.init() reference"/>
     <StatusLine ok={report.appSignals.hasPiAuthenticate} label="Pi.authenticate() reference"/>
     <StatusLine ok={report.appSignals.hasPrivacyPolicy} label={ar?'وجود مؤشر لسياسة الخصوصية':'Privacy policy indicator'}/>
    </div></div>
    {report.redirects.length>0&&<p className="mt-4 text-xs text-white/45">{ar?'تحويلات آمنة تمت إعادة مراجعتها: ':'Revalidated redirects: '}{report.redirects.map((item)=>item.host).join(' → ')}</p>}
    {report.recommendations.length>0&&<div className="mt-5 border-t border-white/10 pt-4"><h4 className="text-sm font-bold text-white">{ar?'مقترحات التحسين':'Improvement recommendations'}</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-white/65">{report.recommendations.map((item)=><li key={item}>{item}</li>)}</ul></div>}
    <div className="mt-5 border-t border-white/10 pt-4">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-sm font-bold text-white">{ar?'مقترحات تطوير قابلة للتنفيذ':'Actionable improvement blueprints'}</h4>
      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/45">{ar?'اقتراحات فقط · لا تغيّر التطبيق تلقائيًا':'Suggestions only · no automatic changes'}</span>
     </div>
     <p className="mt-1 text-xs leading-5 text-white/45">{ar?'هذه المقترحات مستمدة من إشارات الفحص السطحي؛ راجعها مع مطوّر قبل الدمج.':'These proposals are derived from passive scan signals. Review them with a developer before implementation.'}</p>
     <div className="mt-3 grid gap-3 xl:grid-cols-2">
      {buildIntegrationBlueprints(report,ar).map((blueprint,index)=><article key={blueprint.title} className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
       <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="text-sm font-semibold text-white">{index+1}. {blueprint.title}</h5>
        <span className={'rounded-full px-2 py-0.5 text-[10px] '+(blueprint.priority==='high'?'bg-amber-400/10 text-amber-200':blueprint.priority==='medium'?'bg-cyan-400/10 text-cyan-200':'bg-violet-400/10 text-violet-200')}>{blueprint.priority==='high'?(ar?'أولوية عالية':'High priority'):blueprint.priority==='medium'?(ar?'مراجعة':'Review'):(ar?'استكشافي':'Exploratory')}</span>
       </div>
       <p className="mt-2 text-xs leading-5 text-white/55">{blueprint.why}</p>
       <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-white/70">{blueprint.steps.map((step)=><li key={step}>{step}</li>)}</ol>
      </article>)}
     </div>
    </div>
    <p className="mt-4 text-xs leading-5 text-white/40">{ar?'هذا تقرير أولي غير اعتمادي. لا يثبت اجتياز مراجعة Pi ولا يغني عن اختبار أمني احترافي.':'This is a preliminary, non-certifying report. It does not prove Pi approval or replace a professional security assessment.'}</p>
    <a href={report.finalUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-200 underline underline-offset-4"><ExternalLink className="h-3 w-3" aria-hidden="true"/>{ar?'فتح الرابط في علامة تبويب منفصلة':'Open target in a separate tab'}</a>
   </div>}
  </section>
 );
}
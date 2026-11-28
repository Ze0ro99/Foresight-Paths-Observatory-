import {
  AppLocale,
  GeneratedSolutionBundle,
  GovernanceProposal,
  LiveEvent,
  RiskScenarioInput,
} from './types';
import { FEE_STRATEGIES_I18N, THREAT_PRESETS_I18N } from './i18n-data';

export const DEFAULT_PLAN_PRICE_PI = 0.0001; // Illustrative example only; actual Pi service pricing is registered in the Developer Portal.

export interface FeeEconomicsStrategy {
  id: string;
  nameAr: string;
  nameEn: string;
  effectiveGasRatioPct: number | null;
  gasMultiplierLabel: string;
  readinessStatusAr: string;
  mechanismAr: string;
}

export function computeFeeEconomicsStrategies(
  locale: AppLocale = 'ar'
): FeeEconomicsStrategy[] {
  const base: FeeEconomicsStrategy[] = [
    {
      id: 'direct-onchain',
      nameAr: 'اشتراكات Pi الأصلية v1',
      nameEn: 'Native Pi Subscription v1',
      effectiveGasRatioPct: null,
      gasMultiplierLabel: 'لا توجد نسبة رسم شبكة ثابتة مؤكدة',
      readinessStatusAr: 'Testnet v1 فقط · المحاكاة متاحة · يتطلب Service ID مسجلًا',
      mechanismAr: 'استدعاء عقد الاشتراك الرسمي عبر Pi SDK في وضع simulate. التجديد الفعلي يتطلب استدعاء merchant process ولا توجد جدولة تلقائية في التطبيق.',
    },
    {
      id: 'x402-batch',
      nameAr: 'تسوية x402 المجمعة',
      nameEn: 'x402 Batch Settlement',
      effectiveGasRatioPct: null,
      gasMultiplierLabel: 'غير مقاس · لا يوجد مسوّي متصل',
      readinessStatusAr: 'غير مفعّل · لا يوجد مسوّي موثوق متصل',
      mechanismAr: 'تصميم تكاملي مستقبلي فقط. لا يصدر التطبيق قسائم دفع ولا ينفذ تسوية x402 في هذه النسخة.',
    },
    {
      id: 'pirc2-allowance',
      nameAr: 'تصميم Soroban المجتمعي',
      nameEn: 'Community Soroban Design',
      effectiveGasRatioPct: null,
      gasMultiplierLabel: 'يتطلب بناءً وتدقيقًا وقياسًا على Testnet',
      readinessStatusAr: 'هيكل تصميم فقط · غير منشور أو مدقق',
      mechanismAr: 'هيكل عقد مجتمعي مستقل عن عقد اشتراكات Pi الأصلي. يتطلب بناءً واختبارات وتدقيقًا ونشرًا منفصلًا على Stellar Testnet.',
    },
    {
      id: 'prepaid-bundle',
      nameAr: 'رصيد مسبق عبر Pi Payments',
      nameEn: 'Prepaid Pi Payments',
      effectiveGasRatioPct: null,
      gasMultiplierLabel: 'معطّل · لا يوجد تسعير رسوم',
      readinessStatusAr: 'معطّل · لا رصيد مدفوع أو استحقاقات',
      mechanismAr: 'لا يتم إنشاء رصيد مسبق أو منح نقاط/استحقاقات. يتطلب مسار دفع معتمدًا وسجل تسوية واستردادًا منفصلًا.',
    },
    {
      id: 'pi-ads-subsidy',
      nameAr: 'ائتمان الإعلانات المكافأة',
      nameEn: 'Rewarded Ads Credit',
      effectiveGasRatioPct: null,
      gasMultiplierLabel: 'معطّل · لا يوجد callback موثوق',
      readinessStatusAr: 'غير متصل · لا منح عبر الإعلانات',
      mechanismAr: 'لا تُمنح أرصدة أو اشتراكات مقابل مشاهدة إعلان حتى يتوفر تحقق خادمي موثوق من مزود الإعلانات.',
    },
  ];
  if (locale === 'ar') return base;
  const tr = FEE_STRATEGIES_I18N[locale];
  return base.map((item) => {
    const entry = tr?.[item.id];
    if (!entry) return { ...item, nameAr: item.nameEn };
    return {
      ...item,
      nameAr: entry.name,
      gasMultiplierLabel: entry.gasLabel,
      readinessStatusAr: entry.status,
      mechanismAr: entry.mechanism,
    };
  });
}

export const PIRC_STANDARDS_SEPARATION = [
  {
    id: 'pi-native-subscriptions',
    name: 'Pi Native Subscription Contract v1',
    classification: 'official' as const,
    sourceRepo: 'Pi Developer Documentation (Official)',
    statusAr: 'موثق رسميًا ومتاح على Pi Testnet v1؛ لا يُعرض هنا كخدمة Mainnet',
    roleInAppAr: 'التكامل الرسمي يستخدم Pi.SmartContract.Subscription. التطبيق يقرأ الخدمة ويحاكي subscribe على Testnet؛ التجديد يتطلب merchant process منفصلًا.',
  },
  {
    id: 'pirc2',
    name: 'PiRC2: Community Subscription / Allowance Proposal',
    classification: 'community' as const,
    sourceRepo: 'Ze0ro99/PiRC (مقترح مجتمعي)',
    statusAr: 'تصميم مجتمعي مستقل؛ ليس معيارًا رسميًا منشورًا من Pi Core Team ولا بديلًا عن عقد Pi الأصلي',
    roleInAppAr: 'هيكل تصميم لعقد Soroban مخصص. يتطلب تجميعًا واختبارات وتدقيقًا وموافقة منفصلة قبل أي نشر على Stellar Testnet.',
  },
  {
    id: 'pirc1',
    name: 'PiRC1: Ecosystem Token Design Proposal',
    classification: 'community' as const,
    sourceRepo: 'Ze0ro99/PiRC (مقترح مجتمعي)',
    statusAr: 'مقترح اقتصادي مجتمعي غير ملزم ولا يمثل سياسة رسمية من Pi Core Team',
    roleInAppAr: 'نموذج لقياس المنفعة والنشاط الاقتصادي؛ لا يثبت أهلية Launchpad أو إدراج DEX أو قيمة صرف مضمونة.',
  },
  {
    id: 'seven-layer',
    name: '7-Layer Pinework Architecture',
    classification: 'community' as const,
    sourceRepo: 'Ze0ro99/PiRC (مقترح مجتمعي)',
    statusAr: 'طبقة تنظيمية اختيارية وليست معيارًا ملزمًا من Pi Core Team',
    roleInAppAr: 'فصل الكود والوثائق إلى 7 طبقات: البنية التحتية، البروتوكول، العقود، الخدمة، التشغيل البيني، التطبيق، والحوكمة.',
  },
  {
    id: 'ze0ro-proposals',
    name: 'PiRC-202 / 203 / 206 / 208 / 254',
    classification: 'community' as const,
    sourceRepo: 'Ze0ro99/PiRC (مقترحات مجتمعية)',
    statusAr: 'مفاهيم إلهامية مفصولة برمجياً عن مواصفات Pi الرسمية',
    roleInAppAr: 'تدرج الصلاحيات (202)، أوراكل التسعير (203)، مراقبة الصحة التشغيلية (206)، تدقيق AI (208)، وقواطع الدائرة (254).',
  },
  {
    id: 'economic-contract',
    name: 'ECONOMIC_ENGINE_API_CONTRACT',
    classification: 'community' as const,
    sourceRepo: 'Ze0ro99/project-unity-sphere',
    statusAr: 'ضوابط أمان تنفيذية للخادم',
    roleInAppAr: 'رفض الأسعار أو الأهلية الواردة من المتصفح، منع مفاتيح التوقيع بالواجهة، وفرض Idempotency والتحقق البعدي.',
  },
];

export const THREAT_PRESETS: Record<
  RiskScenarioInput['threatCategory'],
  {
    labelAr: string;
    defaultTitleAr: string;
    mitigationsAr: string[];
  }
> = {
  supply_choke: {
    labelAr: 'اختناق سلاسل الإمداد والممرات البحرية',
    defaultTitleAr: 'اضطراب تخليص الموانئ وتعطل مسارات الطاقة الرقمية',
    mitigationsAr: [
      'محاكاة مسارات توجيه بديلة للموانئ والطاقة؛ أي تغيير فعلي في التوجيه يتطلب موافقة مالك النظام.',
      'تقييم أثر التأخير على العقود والالتزامات، ثم إعداد مقترح تعاقدي منفصل لمراجعته؛ لا يتم تجميد أو تعديل أي عقد تلقائيًا.',
      'مراقبة مصادر BGP والموانئ العامة وتوثيق المصدر والتوقيت؛ لا تُجرى عمليات مسح أو تغييرات خارجية.',
    ],
  },
  web_exploit: {
    labelAr: 'استغلال ثغرات الويب الحرجة (PHP2Shell / CVE)',
    defaultTitleAr: 'موجة استغلال مؤتمتة لثغرات الخوادم ضمن توجيه BOD 22-01',
    mitigationsAr: [
      'مطابقة مؤشرات الهجوم مع الأصول المملوكة، ثم اقتراح قاعدة WAF/تحديث؛ يتطلب الحظر موافقة مسؤول النظام.',
      'إبقاء مفاتيح التوقيع خارج المتصفح واستخدام مفاتيح idempotency والتحقق بعد التنفيذ في الأنظمة التي يملكها العميل.',
      'مطابقة الثغرات مع CISA KEV/NVD وتحديد أولوية الترقيع؛ يعتمد توقيت التحديث على مالك الأصل واختبار التراجع.',
    ],
  },
  ai_ransomware: {
    labelAr: 'هجمات الفدية المسرّعة بالذكاء الاصطناعي (SafePay)',
    defaultTitleAr: 'توسع هجمات التشفير المؤتمتة ضد مؤسسات البنية التحتية',
    mitigationsAr: [
      'الاحتفاظ بنسخ احتياطية غير قابلة للتغيير ومعزولة واختبار الاستعادة دوريًا.',
      'عزل الأصول المتأثرة عبر EDR/SOAR معتمد بعد موافقة مسؤول الجهة المالكة، مع تسجيل أثر التغيير.',
      'فرض MFA أو مفاتيح أمان للأدوار الحساسة والتحقق المزدوج قبل استعادة الخدمات.',
    ],
  },
  payment_liquidity: {
    labelAr: 'اختلال سيولة المدفوعات وتباعد الأوراكل (PI/USD)',
    defaultTitleAr: 'اتساع الفارق السعري وتعطل تسويات الدفع الدقيقة (x402)',
    mitigationsAr: [
      'مقارنة مصادر أسعار مستقلة وإيقاف التوصيات عند اتساع الاختلاف؛ هذا حد تحليلي وليس قاطع معاملات مباشرًا.',
      'نمذجة بدائل التسوية فقط؛ يظل التحصيل معطّلًا حتى التحقق من مزود الدفع والرسوم والموافقات.',
      'تحديد سقف ميزانية يوافق عليه المستخدم؛ وأي عقد Soroban مخصص يحتاج تدقيقًا ونشرًا واختبارات مستقلة.',
    ],
  },
};

/**
 * Computes a heuristic scenario-risk score and a budget-equivalent Pi estimate from manual assumptions.
 * Exported MCP/Soroban files are unverified design scaffolds, not deployable or audited integrations.
 */
export function analyzeThreatAndGenerateBundle(
  input: RiskScenarioInput,
  locale: AppLocale = 'ar'
): GeneratedSolutionBundle {
  const safeSeverity = Math.max(1, Math.min(10, input.severity));
  const safeProb = Math.max(1, Math.min(100, input.probabilityPct));
  const safeDep = Math.max(1, Math.min(10, input.dependencyFactor));
  const safeUsd = Math.max(10, input.estimatedUsdCost);
  const safePiPrice = Number.isFinite(input.piUsdMedianPrice) && input.piUsdMedianPrice > 0 ? input.piUsdMedianPrice : 0.0000001;

  // Weighted composite risk equation normalized to 1..99%
  const rawScore =
    safeProb * 0.48 + (safeSeverity * 10) * 0.34 + (safeDep * 10) * 0.18;
  const riskScorePct = Math.min(99, Math.max(5, Math.round(rawScore)));
  const riskLevel: GeneratedSolutionBundle['riskLevel'] =
    riskScorePct >= 72 ? 'critical' : riskScorePct >= 45 ? 'high' : 'moderate';

  const oracleStatus: GeneratedSolutionBundle['oracleStatus'] =
    input.oracleSpreadPct > 4.5 ? 'spread_warning' : 'healthy';

  // Scenario budget conversion only. This is not a hedge, live quote, or oracle price.
  const contingencyFactor = 1 + riskScorePct / 250;
  const estimatedPiCost = Number(
    ((safeUsd * contingencyFactor) / safePiPrice).toFixed(2)
  );

  const presetMitigations =
    THREAT_PRESETS_I18N[locale]?.[input.threatCategory]?.mitigations ??
    THREAT_PRESETS[input.threatCategory].mitigationsAr;
  const slug =
    input.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || `${input.threatCategory}_guard`;

  const mcpAgentCode = `// READ-ONLY AGENT STARTER TEMPLATE; not a connected MCP server.
// No API keys, payment adapter, wallet signer, or external write connector is configured.
export const agentDefinition = {
  id: ${JSON.stringify(slug)},
  title: ${JSON.stringify(input.title)},
  environment: 'Pi Testnet (public reads only)',
  capabilities: ['read_public_signals', 'correlate_evidence', 'draft_defensive_recommendations'],
  permissions: {
    externalWrites: false,
    walletSigning: false,
    paymentSubmission: false,
    thirdPartySystemChanges: false,
  },
  integrations: { mcpServer: 'not_connected', x402: 'not_implemented', piSubscriptionServiceIdRequired: true },
  scenario: {
    riskScorePct: ${riskScorePct},
    riskLevel: ${JSON.stringify(riskLevel)},
    scenarioBudgetEquivalentPi: ${estimatedPiCost},
    assumedPiUsdPrice: ${safePiPrice},
  },
  recommendations: ${JSON.stringify(presetMitigations)},
};

export async function runAgent() {
  return {
    status: 'simulation_only',
    executedActions: 0,
    externalWrites: 0,
    paymentSubmissions: 0,
    walletSignatures: 0,
    recommendations: agentDefinition.recommendations,
  };
};
`;

  const agentsMarkdown = `# agents.md — ${input.title}
- Agent ID: \`${slug}_defense_agent\`
- Threat Category: \`${input.threatCategory}\`
- Composite Risk Score: **${riskScorePct}%** (${riskLevel})
- Scenario budget equivalent: **${estimatedPiCost} Pi** using the manually entered price assumption of ${safePiPrice.toFixed(4)}/Pi (not a live quote)
- Plan price example: ${DEFAULT_PLAN_PRICE_PI} Pi; configure the actual service price in Pi Developer Portal
- Pi native subscription: Testnet v1 only; x402 is not connected

## Precautionary Actions
${presetMitigations.map((m, i) => `${i + 1}. ${m}`).join('\n')}
`;

  const soloHostManifest = JSON.stringify(
    {
      schema: 'solohost.pi.agent-design/v1',
      agentId: `${slug}_solohost`,
      title: input.title,
      designStatus: 'unverified_scaffold',
      executionMode: 'manual_review_only',
      deployed: false,
      runtime: 'node20-isolated (proposed)',
      privacyMode: 'local_node_inference (proposed; not enforced here)',
      mcpEndpoint: null,
      assumedPiUsdPrice: safePiPrice,
      scenarioSpreadThreshold: {
        enabled: true,
        thresholdPct: 4.5,
        inputSpreadPct: input.oracleSpreadPct,
        liveOracleConnected: false,
      },
      scenarioBudgetEquivalentPi: estimatedPiCost,
    },
    null,
    2
  );

  const sorobanContractCode = `// COMMUNITY DESIGN SCAFFOLD ONLY. Not an official Pi contract or the native Pi Subscription v1 contract.
// Requires compilation, tests, independent security audit, and separate Stellar Testnet deployment.
// This application does not deploy, sign, or submit a live transaction.
// Soroban / Community PiRC2 Subscription + Scenario Threshold
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct SubscriptionGuard {
    pub subscriber: Address,
    pub monthly_micro_pi: i128, // 1_000 stroops = 0.0001 Pi (batch settled)
    pub max_budget_pi: i128,
    pub expiration_ledger: u32,
    pub circuit_halted: bool,
}

#[contract]
pub struct RiskDefenseSubscription;

#[contractimpl]
impl RiskDefenseSubscription {
    pub fn authorize_pirc2(
        env: Env,
        subscriber: Address,
        monthly_micro_pi: i128,
        max_budget_pi: i128,
        expiration_ledger: u32,
    ) -> SubscriptionGuard {
        subscriber.require_auth();
        SubscriptionGuard {
            subscriber,
            monthly_micro_pi,
            max_budget_pi,
            expiration_ledger,
            circuit_halted: ${oracleStatus === 'spread_warning' ? 'true' : 'false'},
        }
    }

    pub fn trigger_pirc254_breaker(env: Env, admin: Address, risk_pct: u32) -> Symbol {
        admin.require_auth();
        if risk_pct >= ${riskScorePct} {
            Symbol::new(&env, "HALTED")
        } else {
            Symbol::new(&env, "ACTIVE")
        }
    }
}
`;

  const subscriptionSpecJson = JSON.stringify(
    {
      standard: 'Pi Native Subscription Contract v1',
      planName: `${locale === 'ar' ? 'حماية' : 'Guard:'} ${input.title}`,
      examplePlanPricePi: DEFAULT_PLAN_PRICE_PI,
      priceIsIllustrative: true,
      serviceIdRequired: true,
      serviceMustBeRegisteredInDeveloperPortal: true,
      networkAvailability: 'Pi Testnet v1 only',
      appExecutionMode: 'simulate',
      sdkCall: 'Pi.SmartContract.Subscription.subscribe(..., { mode: "simulate" })',
      submitModeEnabled: false,
      entitlementGrantEnabled: false,
      renewalProcessing: 'Merchant process call required; no automatic renewal worker is configured',
      x402Integration: 'not_implemented',
      customSorobanContract: 'separate community design; not the native Pi subscription contract',
      networkFeeQuotePi: null,
      piUsdAssumption: safePiPrice,
      scenarioBudgetEquivalentPi: estimatedPiCost,
      note: 'No live price feed, fee quote, transaction submission, or payment is performed by this specification.',
    },
    null,
    2
  );

  return {
    riskScorePct,
    riskLevel,
    oracleStatus,
    estimatedPiCost,
    precautionarySteps: presetMitigations,
    mcpAgentCode,
    agentsMarkdown,
    soloHostManifest,
    sorobanContractCode,
    subscriptionSpecJson,
  };
}

export const INITIAL_GOVERNANCE_PROPOSALS: GovernanceProposal[] = [
  {
    id: 'prop-01',
    title: 'وكيل رصد ثغرات PHP2Shell وبوابات BGP على SoloHost',
    kind: 'mcp_agent',
    riskScorePct: 81,
    pricePi: 0.0001,
    status: 'voting',
    votesFor: 0,
    votesAgainst: 0,
    quorumRequired: 1,
    summary:
      'Sample proposal for the local UI preview only. No real participants, votes, CISA feed, or signed alerts are represented.',
    artifactSnippet: 'Defensive, read-only monitoring design; no external action or payment is executed.',
  },
  {
    id: 'prop-02',
    title: 'عقد الاشتراك التجميعي PiRC2 + قاطع الدائرة PiRC-254',
    kind: 'soroban_contract',
    riskScorePct: 68,
    pricePi: 0.1,
    status: 'voting',
    votesFor: 0,
    votesAgainst: 0,
    quorumRequired: 1,
    summary:
      'Sample community proposal only. This custom Soroban design is not the native Pi subscription contract and has not been deployed or audited.',
    artifactSnippet: 'Community contract design; compilation, audit, and Testnet deployment are not completed.',
  },
];

export function buildEventVerificationPayload(ev: LiveEvent): string {
  return JSON.stringify({
    id: ev.id,
    sequence: ev.sequence,
    timestamp: ev.timestamp,
    title: ev.title,
    lat: Number(ev.coordinates.lat.toFixed(4)),
    lng: Number(ev.coordinates.lng.toFixed(4)),
    sourceName: ev.sourceName,
    spofNode: ev.spofNode,
    epistemicTier: ev.epistemicTier ?? 'plausible',
  });
}

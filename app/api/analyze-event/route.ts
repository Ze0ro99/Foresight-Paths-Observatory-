import { GoogleGenAI, Type } from '@google/genai';
import { getGeminiModel } from '@/lib/gemini-config.mjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  getPlatformCopy,
  getReliabilityCopy,
  getSectorCopy,
  getThreatCopy,
  getTrackCopy,
} from '@/lib/i18n';
import {
  AppLocale,
  LiveEvent,
  MathTrajectoryMetrics,
  PlatformLayerId,
  ResearchTrack,
  ReliabilityGrade,
  SectorType,
  ThreatMechanismId,
} from '@/lib/types';

const LOCALE_LANGUAGE_LABEL: Record<AppLocale, string> = {
  ar: 'Arabic (العربية الفصحى)',
  en: 'English',
  fr: 'French (Français)',
  id: 'Indonesian (Bahasa Indonesia)',
  vi: 'Vietnamese (Tiếng Việt)',
};

function parseLocale(val: unknown): AppLocale {
  return val === 'en' || val === 'fr' || val === 'id' || val === 'vi' ? val : 'ar';
}

export async function POST(req: NextRequest) {
  let body: {
    mode?: 'analyze' | 'simulate_next';
    locale?: AppLocale;
    event?: Partial<LiveEvent>;
    contextEvents?: LiveEvent[];
    mathMetrics?: MathTrajectoryMetrics;
  };

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Unable to read request body.' }, { status: 400 });
  }
  if (new TextEncoder().encode(rawBody).byteLength > 32 * 1024) {
    return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
  }
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }
  body = parsedBody as typeof body;
  if (body.mode !== undefined && body.mode !== 'analyze' && body.mode !== 'simulate_next') {
    return NextResponse.json({ error: 'Unsupported analysis mode.' }, { status: 400 });
  }
  if (body.contextEvents !== undefined && !Array.isArray(body.contextEvents)) {
    return NextResponse.json({ error: 'contextEvents must be an array.' }, { status: 400 });
  }
  if (body.event !== undefined && (!body.event || typeof body.event !== 'object' || Array.isArray(body.event))) {
    return NextResponse.json({ error: 'event must be an object.' }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return NextResponse.json(
      {
        status: 'not_ready',
        error:
          locale === 'ar'
            ? 'ميزة التحليل بالذكاء الاصطناعي غير مهيأة بعد: يجب ضبط GEMINI_API_KEY في بيئة الخادم.'
            : 'AI analysis is not configured yet. Set GEMINI_API_KEY in the server environment.',
      },
      { status: 503 }
    );
  }

  const model = getGeminiModel();
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const mode = body.mode === 'simulate_next' ? 'simulate_next' : 'analyze';
  const contextEvents = Array.isArray(body.contextEvents)
    ? body.contextEvents.slice(-5)
    : [];

  const contextSummary = contextEvents
    .map(
      (e) =>
        `[${e.elapsedMinutes}m | ${e.reliabilityGrade} | ${getSectorCopy(e.sector, locale)} | ${e.coordinates?.city ?? ''} (${e.coordinates?.lat ?? 0}, ${e.coordinates?.lng ?? 0}) | Platform: ${getPlatformCopy(e.platformLayer, locale).shortLabel} | Threat: ${getThreatCopy(e.threatMechanism, locale).shortLabel}] ${e.title}: ${e.summary} (SPOF: ${e.spofNode}, Impact: ${e.marketImpactBps}bps)`
    )
    .join('\n');

  const mathContext = body.mathMetrics
    ? `Current mathematical indicators (using π = ${body.mathMetrics.piConstant}):
- Phase Harmonic Φπ: ${body.mathMetrics.piPhaseHarmonic}
- Trajectory Entropy Hπ: ${body.mathMetrics.entropyBasePi}
- Cross-Map Resonance (Economist 2027 × QAnon/Pi): ${body.mathMetrics.crossMapResonance}
- Total Geodesic Span: ${body.mathMetrics.totalGeodesicSpanKm ?? 0} km
- Next Cascade Risk: ${body.mathMetrics.nextCascadeRiskPct}%`
    : '';

  const targetLanguage = LOCALE_LANGUAGE_LABEL[locale];

  const systemInstruction = `You are a strategic intelligence analyst and realistic global cyber/geopolitical thriller scenario architect (Global Geopolitical/Cyber Thriller Scenario Engine).
Methodology:
1. Quadruple discipline: OSINT Reliability Matrix (A1-D4), Analysis of Competing Hypotheses (ACH) falsification, dual semiotic decoding (The Economist 2027 cover symbols ΠΣV/AI/pipelines + Great Awakening/QAnon narrative clustering), and financial contagion modeling.
2. Mathematical modeling using π (3.14159), spherical geodesic distances (lat/lng), and the 5 infrastructure platforms (cloud_routing, financial_hft, social_swarm, energy_maritime, discourse_media).
3. Strictly separate verifiable technical/financial root causes from symbolic disinformation noise. Do NOT claim any unverified fixed symbolic valuation outside oracle market pricing.
CRITICAL LANGUAGE REQUIREMENT: Write ALL narrative fields (title, summary, technicalDetails, spofNode, achEvidence.*.note, redTeamCounter, and every filmScene field) strictly in ${targetLanguage}. Keep enum codes (sector, track, threatMechanism, platformLayer, reliabilityGrade, polarity) strictly in their English ASCII schema values.`;

  const targetPrompt =
    mode === 'simulate_next'
      ? `Based on this live event & coordinate sequence:\n${contextSummary || 'Initial baseline monitoring'}\n\n${mathContext}\n\nForecast and infer the NEXT chronological event in the trajectory. Specify realistic geographic coordinates (lat, lng, city, regionCode, asnOrHub), platformLayer, threatMechanism, ACH falsification notes, redTeamCounter, and synchronized filmScene act. Output all prose strictly in ${targetLanguage}.`
      : `Analyze the following incoming live event within this sequence:\n${contextSummary || 'No prior events'}\n\n${mathContext}\n\nTarget Event:
- Title: ${body.event?.title ?? ''}
- Summary: ${body.event?.summary ?? ''}
- Sector: ${getSectorCopy((body.event?.sector as SectorType) || 'telecom', locale)}
- Platform Layer: ${getPlatformCopy((body.event?.platformLayer as PlatformLayerId) || 'cloud_routing', locale).label}
- Coordinates: ${body.event?.coordinates?.city ?? ''} (${body.event?.coordinates?.lat ?? 0}, ${body.event?.coordinates?.lng ?? 0})
- Track: ${getTrackCopy((body.event?.track as ResearchTrack) || 'osint', locale)}
- Threat Mechanism: ${getThreatCopy((body.event?.threatMechanism as ThreatMechanismId) || 'bgp_spof', locale).label}
- Source: ${body.event?.sourceName ?? ''} (${getReliabilityCopy((body.event?.reliabilityGrade as ReliabilityGrade) || 'B2', locale)})
- SPOF Node: ${body.event?.spofNode ?? ''}
- Latency Spike: ${body.event?.latencySpikeMs ?? 0}ms | Market Impact: ${body.event?.marketImpactBps ?? 0}bps | Disinfo Velocity: ${body.event?.disinfoVelocity ?? 0}%

Return the full structured JSON analysis written strictly in ${targetLanguage}.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: targetPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            technicalDetails: { type: Type.STRING },
            sector: { type: Type.STRING },
            track: { type: Type.STRING },
            threatMechanism: {
              type: Type.STRING,
              description:
                'One of: bgp_spof, algo_contagion, narrative_swarm, supply_choke, ai_amplification',
            },
            platformLayer: {
              type: Type.STRING,
              description:
                'One of: cloud_routing, financial_hft, social_swarm, energy_maritime, discourse_media',
            },
            coordinates: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                city: { type: Type.STRING },
                regionCode: { type: Type.STRING },
                asnOrHub: { type: Type.STRING },
              },
              required: ['lat', 'lng', 'city', 'regionCode', 'asnOrHub'],
            },
            sourceName: { type: Type.STRING },
            reliabilityGrade: { type: Type.STRING },
            spofNode: { type: Type.STRING },
            latencySpikeMs: { type: Type.NUMBER },
            marketImpactBps: { type: Type.NUMBER },
            disinfoVelocity: { type: Type.NUMBER },
            scenarioDelta: {
              type: Type.OBJECT,
              properties: {
                adaptation: { type: Type.NUMBER },
                fragmentation: { type: Type.NUMBER },
                fragility: { type: Type.NUMBER },
              },
              required: ['adaptation', 'fragmentation', 'fragility'],
            },
            achEvidence: {
              type: Type.OBJECT,
              properties: {
                human_error: {
                  type: Type.OBJECT,
                  properties: {
                    polarity: { type: Type.STRING },
                    weight: { type: Type.NUMBER },
                    note: { type: Type.STRING },
                  },
                  required: ['polarity', 'weight', 'note'],
                },
                infra_failure: {
                  type: Type.OBJECT,
                  properties: {
                    polarity: { type: Type.STRING },
                    weight: { type: Type.NUMBER },
                    note: { type: Type.STRING },
                  },
                  required: ['polarity', 'weight', 'note'],
                },
                cyber_attack: {
                  type: Type.OBJECT,
                  properties: {
                    polarity: { type: Type.STRING },
                    weight: { type: Type.NUMBER },
                    note: { type: Type.STRING },
                  },
                  required: ['polarity', 'weight', 'note'],
                },
                disinfo_cascade: {
                  type: Type.OBJECT,
                  properties: {
                    polarity: { type: Type.STRING },
                    weight: { type: Type.NUMBER },
                    note: { type: Type.STRING },
                  },
                  required: ['polarity', 'weight', 'note'],
                },
              },
              required: [
                'human_error',
                'infra_failure',
                'cyber_attack',
                'disinfo_cascade',
              ],
            },
            redTeamCounter: { type: Type.STRING },
            filmScene: {
              type: Type.OBJECT,
              properties: {
                act: { type: Type.STRING },
                location: { type: Type.STRING },
                title: { type: Type.STRING },
                protagonists: { type: Type.STRING },
                groundedReality: { type: Type.STRING },
                dramaticConflict: { type: Type.STRING },
                dialogueExcerpt: { type: Type.STRING },
              },
              required: [
                'act',
                'location',
                'title',
                'protagonists',
                'groundedReality',
                'dramaticConflict',
                'dialogueExcerpt',
              ],
            },
          },
          required: [
            'title',
            'summary',
            'technicalDetails',
            'sector',
            'track',
            'threatMechanism',
            'platformLayer',
            'coordinates',
            'sourceName',
            'reliabilityGrade',
            'spofNode',
            'latencySpikeMs',
            'marketImpactBps',
            'disinfoVelocity',
            'scenarioDelta',
            'achEvidence',
            'redTeamCounter',
            'filmScene',
          ],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return NextResponse.json(
        { error: 'لم يُرجع نموذج التحليل استجابة صالحة.' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(rawText);
    return NextResponse.json({ analysis: parsed });
  } catch (err) {
    const errorName = err instanceof Error ? err.name : 'UnknownError';
    console.error('Gemini analysis request failed', { model, errorName });
    return NextResponse.json(
      {
        status: 'upstream_error',
        error: locale === 'ar'
          ? 'تعذر إتمام التحليل عبر Gemini. تحقق من إعداد GEMINI_MODEL ومفتاح الخادم وحصة واجهة Gemini.'
          : 'Gemini analysis failed. Verify GEMINI_MODEL, the server API key, and API quota.',
      },
      { status: 502 }
    );
  }
}

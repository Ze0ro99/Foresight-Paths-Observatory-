'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { SEED_EVENTS, SEMIOTIC_MARKERS } from '@/lib/seed-data';
import {
  buildDeterministicEventAnalysis,
  buildFullScenarioDossier,
  buildTrajectoryGraph,
  computeGeodesicArcs,
  computePiTrajectoryMetrics,
  computePlatformImpactMatrix,
  computeScenarioProbabilities,
  evaluateACHMatrix,
  generateFilmBeatFromEvent,
  generateNextForecasts,
} from '@/lib/trajectory-engine';
import {
  ENCRYPTED_MAP_NODES,
  buildWorldSignalDossier,
} from '@/lib/world-monitor-engine';
import { UI_COPY, localizeEvent } from '@/lib/i18n';
import {
  AppLocale,
  EventDraftInput,
  GeoCoordinates,
  GlobalSensedSignal,
  LiveEvent,
  PlatformLayerId,
  RedTeamNote,
  ReliabilityGrade,
  ResearchTrack,
  SectorType,
  SelectedMapItem,
  ThreatMechanismId,
} from '@/lib/types';
import TopNav from './TopNav';
import FullScreenMapCanvas from './FullScreenMapCanvas';
import ScenarioDetailDrawer from './ScenarioDetailDrawer';
import BackendMechanicsModal, { BackendTab } from './BackendMechanicsModal';
import AddEventModal from './AddEventModal';
import LiveNewsPanel from './LiveNewsPanel';
import CisaKevPanel from './CisaKevPanel';
import TestnetReadinessPanel from './TestnetReadinessPanel';
import LinkScannerPanel from './LinkScannerPanel';
import AgentMarketplacePanel from './AgentMarketplacePanel';
import GatewayNavigation from './GatewayNavigation';
import ProjectEconomicsPanel from './ProjectEconomicsPanel';
import { getMapPresentation } from '@/lib/presentation-mode.mjs';

export default function ResearchWorkspace() {
  const [events, setEvents] = useState<LiveEvent[]>(() =>
    SEED_EVENTS.slice(0, 4)
  );
  const [selectedItem, setSelectedItem] = useState<SelectedMapItem | null>(
    null
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackendOpen, setIsBackendOpen] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  const [backendTab, setBackendTab] = useState<BackendTab>('semiotics');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [redTeamNotes, setRedTeamNotes] = useState<RedTeamNote[]>([]);
  const [locale, setLocale] = useState<AppLocale>('ar');
  const [globalSignals, setGlobalSignals] = useState<GlobalSensedSignal[]>([]);
  const [lastSenseUtc, setLastSenseUtc] = useState<string | null>(null);
  const [senseCoverageNote, setSenseCoverageNote] = useState<string | null>(null);
  const [senseSourceCounts, setSenseSourceCounts] = useState<{
    usgsCount?: number;
    eonetCount?: number;
    osintCount?: number;
  } | null>(null);
  const [isSensingNow, setIsSensingNow] = useState(false);
  const [autoSenseEnabled, setAutoSenseEnabled] = useState(true);
  const [qClockMinuteTick, setQClockMinuteTick] = useState(() =>
    new Date().getUTCMinutes()
  );

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  const handleSenseNow = async () => {
    setIsSensingNow(true);
    try {
      const res = await fetch('/api/global-sense');
      if (res.ok) {
        const data = (await res.json()) as {
          fetchedAtUtc: string;
          coverageNote?: string;
          sources?: { usgsCount?: number; eonetCount?: number; osintCount?: number };
          signals: GlobalSensedSignal[];
        };
        if (Array.isArray(data.signals)) {
          setGlobalSignals(data.signals);
          setLastSenseUtc(data.fetchedAtUtc);
          setSenseCoverageNote(data.coverageNote ?? null);
          setSenseSourceCounts(data.sources ?? null);
        }
      }
    } catch {
      // keep existing cached signals
    } finally {
      setIsSensingNow(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/global-sense');
        if (!res.ok) return;
        const data = (await res.json()) as {
          fetchedAtUtc: string;
          coverageNote?: string;
          sources?: { usgsCount?: number; eonetCount?: number; osintCount?: number };
          signals: GlobalSensedSignal[];
        };
        if (!cancelled && Array.isArray(data.signals)) {
          setGlobalSignals(data.signals);
          setLastSenseUtc(data.fetchedAtUtc);
          setSenseCoverageNote(data.coverageNote ?? null);
          setSenseSourceCounts(data.sources ?? null);
        }
      } catch {
        // ignore safely
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!autoSenseEnabled) return;
    const senseInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/global-sense');
        if (!res.ok) return;
        const data = (await res.json()) as {
          fetchedAtUtc: string;
          coverageNote?: string;
          sources?: { usgsCount?: number; eonetCount?: number; osintCount?: number };
          signals: GlobalSensedSignal[];
        };
        if (Array.isArray(data.signals)) {
          setGlobalSignals(data.signals);
          setLastSenseUtc(data.fetchedAtUtc);
          setSenseCoverageNote(data.coverageNote ?? null);
          setSenseSourceCounts(data.sources ?? null);
        }
      } catch {
        // ignore safely
      }
    }, 45000);

    const qClockInterval = setInterval(() => {
      setQClockMinuteTick((t) => (t + 1) % 60);
    }, 15000);

    return () => {
      clearInterval(senseInterval);
      clearInterval(qClockInterval);
    };
  }, [autoSenseEnabled]);

  const localizedEvents = useMemo(
    () => events.map((e) => localizeEvent(e, locale)),
    [events, locale]
  );

  const probabilities = useMemo(
    () => computeScenarioProbabilities(localizedEvents),
    [localizedEvents]
  );

  const mathMetrics = useMemo(
    () =>
      computePiTrajectoryMetrics(
        localizedEvents,
        SEMIOTIC_MARKERS,
        probabilities,
        locale
      ),
    [localizedEvents, probabilities, locale]
  );

  const forecasts = useMemo(
    () => generateNextForecasts(localizedEvents, probabilities, mathMetrics, locale),
    [localizedEvents, probabilities, mathMetrics, locale]
  );

  const achRankings = useMemo(
    () => evaluateACHMatrix(localizedEvents, locale),
    [localizedEvents, locale]
  );

  const selectedEventId =
    selectedItem?.kind === 'event'
      ? selectedItem.id
      : localizedEvents[localizedEvents.length - 1]?.id ?? null;

  const trajectoryGraph = useMemo(
    () => buildTrajectoryGraph(localizedEvents, selectedEventId, forecasts, locale),
    [localizedEvents, selectedEventId, forecasts, locale]
  );

  const geodesicArcs = useMemo(
    () => computeGeodesicArcs(localizedEvents, selectedEventId),
    [localizedEvents, selectedEventId]
  );

  const mapPresentation = useMemo(
    () => getMapPresentation(isProMode ? 'pro' : 'simple', {
      events: localizedEvents,
      forecasts,
      geodesicArcs,
    }),
    [isProMode, localizedEvents, forecasts, geodesicArcs]
  );

  const platformMatrix = useMemo(
    () => computePlatformImpactMatrix(localizedEvents, locale),
    [localizedEvents, locale]
  );

  const selectedDossier = useMemo(() => {
    if (!selectedItem) return null;
    if (selectedItem.kind === 'global_signal') {
      const sig = globalSignals.find((s) => s.id === selectedItem.id);
      return sig
        ? buildWorldSignalDossier(
            { kind: 'global_signal', signal: sig },
            probabilities,
            locale
          )
        : null;
    }
    if (selectedItem.kind === 'encrypted_node') {
      const node = ENCRYPTED_MAP_NODES.find((n) => n.id === selectedItem.id);
      return node
        ? buildWorldSignalDossier(
            { kind: 'encrypted_node', node },
            probabilities,
            locale
          )
        : null;
    }
    return buildFullScenarioDossier(
      selectedItem,
      localizedEvents,
      forecasts,
      probabilities,
      achRankings,
      mathMetrics,
      locale
    );
  }, [
    selectedItem,
    globalSignals,
    localizedEvents,
    forecasts,
    probabilities,
    achRankings,
    mathMetrics,
    locale,
  ]);

  const remainingSeedEvents = useMemo(
    () => SEED_EVENTS.filter((seed) => !events.some((e) => e.id === seed.id)),
    [events]
  );

  const effectiveStreaming = isStreaming && remainingSeedEvents.length > 0;

  useEffect(() => {
    if (!effectiveStreaming) return;

    const timer = setInterval(() => {
      setEvents((prev) => {
        const nextSeed = SEED_EVENTS.find(
          (seed) => !prev.some((e) => e.id === seed.id)
        );
        if (!nextSeed) {
          setIsStreaming(false);
          return prev;
        }
        return [...prev, nextSeed];
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [effectiveStreaming]);

  const handleStepForward = () => {
    const nextSeed = remainingSeedEvents[0];
    if (!nextSeed) return;
    setEvents((prev) => [...prev, nextSeed]);
    setSelectedItem({ kind: 'event', id: nextSeed.id });
  };

  const handleResetTimeline = () => {
    setIsStreaming(false);
    setEvents(SEED_EVENTS.slice(0, 3));
    setSelectedItem(null);
    setApiError(null);
  };

  const mergeAiAnalysisIntoEvent = (
    baseEvent: LiveEvent,
    aiData: Record<string, unknown>,
    currentProbs = probabilities
  ): LiveEvent => {
    const validSectors: SectorType[] = [
      'telecom',
      'finance',
      'aviation',
      'energy',
      'media',
    ];
    const validTracks: ResearchTrack[] = [
      'osint',
      'ach',
      'semiotics',
      'contagion',
    ];
    const validGrades: ReliabilityGrade[] = ['A1', 'B2', 'C3', 'D4'];
    const validThreats: ThreatMechanismId[] = [
      'bgp_spof',
      'algo_contagion',
      'narrative_swarm',
      'supply_choke',
      'ai_amplification',
    ];
    const validLayers: PlatformLayerId[] = [
      'cloud_routing',
      'financial_hft',
      'social_swarm',
      'energy_maritime',
      'discourse_media',
    ];

    const aiCoords = aiData.coordinates as Partial<GeoCoordinates> | undefined;
    const mergedCoords: GeoCoordinates = {
      lat:
        typeof aiCoords?.lat === 'number' && Math.abs(aiCoords.lat) <= 90
          ? aiCoords.lat
          : baseEvent.coordinates.lat,
      lng:
        typeof aiCoords?.lng === 'number' && Math.abs(aiCoords.lng) <= 180
          ? aiCoords.lng
          : baseEvent.coordinates.lng,
      city: String(aiCoords?.city || baseEvent.coordinates.city),
      regionCode: String(
        aiCoords?.regionCode || baseEvent.coordinates.regionCode
      ),
      asnOrHub: String(aiCoords?.asnOrHub || baseEvent.coordinates.asnOrHub),
    };

    const aiFilm = aiData.filmScene as Record<string, unknown> | undefined;
    const actRaw = String(aiFilm?.act ?? 'II').toUpperCase();
    const act: 'I' | 'II' | 'III' =
      actRaw === 'I' || actRaw === 'III' ? actRaw : 'II';

    return {
      ...baseEvent,
      title: String(aiData.title || baseEvent.title),
      summary: String(aiData.summary || baseEvent.summary),
      technicalDetails: String(
        aiData.technicalDetails || baseEvent.technicalDetails
      ),
      sector: validSectors.includes(aiData.sector as SectorType)
        ? (aiData.sector as SectorType)
        : baseEvent.sector,
      track: validTracks.includes(aiData.track as ResearchTrack)
        ? (aiData.track as ResearchTrack)
        : baseEvent.track,
      threatMechanism: validThreats.includes(
        aiData.threatMechanism as ThreatMechanismId
      )
        ? (aiData.threatMechanism as ThreatMechanismId)
        : baseEvent.threatMechanism,
      platformLayer: validLayers.includes(
        aiData.platformLayer as PlatformLayerId
      )
        ? (aiData.platformLayer as PlatformLayerId)
        : baseEvent.platformLayer,
      coordinates: mergedCoords,
      sourceName: String(aiData.sourceName || baseEvent.sourceName),
      reliabilityGrade: validGrades.includes(
        aiData.reliabilityGrade as ReliabilityGrade
      )
        ? (aiData.reliabilityGrade as ReliabilityGrade)
        : baseEvent.reliabilityGrade,
      spofNode: String(aiData.spofNode || baseEvent.spofNode),
      latencySpikeMs:
        typeof aiData.latencySpikeMs === 'number'
          ? aiData.latencySpikeMs
          : baseEvent.latencySpikeMs,
      marketImpactBps:
        typeof aiData.marketImpactBps === 'number'
          ? aiData.marketImpactBps
          : baseEvent.marketImpactBps,
      disinfoVelocity:
        typeof aiData.disinfoVelocity === 'number'
          ? aiData.disinfoVelocity
          : baseEvent.disinfoVelocity,
      scenarioDelta:
        (aiData.scenarioDelta as LiveEvent['scenarioDelta']) ||
        baseEvent.scenarioDelta,
      achEvidence:
        (aiData.achEvidence as LiveEvent['achEvidence']) ||
        baseEvent.achEvidence,
      redTeamCounter: String(
        aiData.redTeamCounter || baseEvent.redTeamCounter
      ),
      aiAnalyzed: true,
      filmScene: aiFilm
        ? {
            id: `scene-${baseEvent.id}`,
            act,
            sceneNumber: baseEvent.sequence,
            timecode: `T+${String(baseEvent.elapsedMinutes).padStart(3, '0')}m`,
            location: String(aiFilm.location || mergedCoords.city),
            title: String(aiFilm.title || baseEvent.title),
            protagonists: String(
              aiFilm.protagonists || 'Forensic & Operations Team'
            ),
            groundedReality: String(
              aiFilm.groundedReality || baseEvent.summary
            ),
            dramaticConflict: String(aiFilm.dramaticConflict || ''),
            dialogueExcerpt: String(aiFilm.dialogueExcerpt || ''),
            linkedEventId: baseEvent.id,
            dominantScenarioAtBeat: currentProbs.dominant,
          }
        : generateFilmBeatFromEvent(
            baseEvent,
            currentProbs,
            baseEvent.sequence,
            locale
          ),
    };
  };

  const handleAddEvent = async (draft: EventDraftInput, useAi: boolean) => {
    setApiError(null);
    const nextSequence = events.length + 1;
    const lastElapsed = events[events.length - 1]?.elapsedMinutes ?? 0;
    const baseEvent = buildDeterministicEventAnalysis(
      draft,
      nextSequence,
      lastElapsed + 16,
      locale
    );

    if (!useAi) {
      const nextList = [...events, baseEvent];
      const nextProbs = computeScenarioProbabilities(nextList);
      baseEvent.filmScene = generateFilmBeatFromEvent(
        baseEvent,
        nextProbs,
        nextSequence,
        locale
      );
      setEvents(nextList);
      setSelectedItem({ kind: 'event', id: baseEvent.id });
      setIsAddModalOpen(false);
      return;
    }

    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/analyze-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'analyze',
          locale,
          event: baseEvent,
          contextEvents: localizedEvents,
          mathMetrics,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setApiError(payload.error || UI_COPY[locale].geminiErrTitle);
        return;
      }
      const enriched = mergeAiAnalysisIntoEvent(baseEvent, payload.analysis);
      setEvents((prev) => [...prev, enriched]);
      setSelectedItem({ kind: 'event', id: enriched.id });
      setIsAddModalOpen(false);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : UI_COPY[locale].geminiErrConnect
      );
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleRunDeepAiOnExisting = async (target: LiveEvent) => {
    setApiError(null);
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/analyze-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'analyze',
          locale,
          event: target,
          contextEvents: localizedEvents.filter((e) => e.id !== target.id),
          mathMetrics,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setApiError(payload.error || UI_COPY[locale].geminiErrTitle);
        return;
      }
      const enriched = mergeAiAnalysisIntoEvent(target, payload.analysis);
      setEvents((prev) =>
        prev.map((ev) => (ev.id === target.id ? enriched : ev))
      );
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : UI_COPY[locale].geminiErrConnect
      );
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleSimulateAiEvent = async () => {
    setApiError(null);
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/analyze-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'simulate_next',
          locale,
          contextEvents: localizedEvents,
          mathMetrics,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setApiError(payload.error || UI_COPY[locale].geminiErrTitle);
        return;
      }

      const nextSequence = events.length + 1;
      const lastEvent = localizedEvents[localizedEvents.length - 1];
      const skeleton = buildDeterministicEventAnalysis(
        {
          title: String(payload.analysis?.title || 'Projected Live Event'),
          summary: String(payload.analysis?.summary || 'Live path projection'),
          sector: 'finance',
          track: 'contagion',
          threatMechanism: 'algo_contagion',
          platformLayer: 'financial_hft',
          city: 'Tokyo',
          lat: 35.6762,
          lng: 139.6503,
          sourceName: String(
            payload.analysis?.sourceName || 'Predictive Trajectory Unit'
          ),
          reliabilityGrade: 'B2',
          spofNode: String(
            payload.analysis?.spofNode ||
              lastEvent?.spofNode ||
              'Central Clearing Node'
          ),
          parentEventId: lastEvent?.id ?? null,
          marketImpactBps: 30,
          latencySpikeMs: 120,
          disinfoVelocity: 40,
        },
        nextSequence,
        (lastEvent?.elapsedMinutes ?? 0) + 18,
        locale
      );
      const enriched = mergeAiAnalysisIntoEvent(skeleton, payload.analysis);
      setEvents((prev) => [...prev, enriched]);
      setSelectedItem({ kind: 'event', id: enriched.id });
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : UI_COPY[locale].geminiErrConnect
      );
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-[#F3F4F6]">
      <TopNav
        locale={locale}
        onChangeLocale={setLocale}
        probabilities={probabilities}
        onResetSelection={() => setSelectedItem(null)}
        isProMode={isProMode}
        onToggleProMode={() => {
          setIsProMode((value) => !value);
          setIsStreaming(false);
          setSelectedItem(null);
          setIsAddModalOpen(false);
          setIsBackendOpen(false);
        }}
        onOpenAddEvent={() => setIsAddModalOpen(true)}
      />
      <GatewayNavigation locale={locale} />

      {senseCoverageNote && (
        <section
          aria-label={locale === 'ar' ? 'تغطية مصادر الرصد' : 'Global signal source coverage'}
          className="mx-4 mt-3 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/70 md:mx-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-white/90">
              {locale === 'ar' ? 'تغطية المصادر: جزئية' : 'Source coverage: partial'}
            </p>
            {senseSourceCounts && (
              <p aria-live="polite" className="tabular-nums">
                USGS {senseSourceCounts.usgsCount ?? 0} · NASA EONET {senseSourceCounts.eonetCount ?? 0}
              </p>
            )}
          </div>
          <p className="mt-1 leading-relaxed">{senseCoverageNote}</p>
        </section>
      )}

      {/* Primary Experience: Full-Screen Interactive World Map */}
      <main id="global-intelligence">
        <FullScreenMapCanvas
          locale={locale}
          isProMode={isProMode}
          events={mapPresentation.events}
          forecasts={mapPresentation.forecasts}
          geodesicArcs={mapPresentation.geodesicArcs}
          globalSignals={globalSignals}
          lastSenseUtc={lastSenseUtc}
          isSensingNow={isSensingNow}
          autoSenseEnabled={autoSenseEnabled}
          onToggleAutoSense={() => setAutoSenseEnabled((v) => !v)}
          onSenseNow={() => void handleSenseNow()}
          onOpenCloudAgents={() => {
            setIsProMode(true);
            setBackendTab('cloud_agent');
            setIsBackendOpen(true);
          }}
          qClockMinuteTick={qClockMinuteTick}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          isStreaming={effectiveStreaming}
          onToggleStream={() => {
            if (remainingSeedEvents.length === 0) return;
            setIsStreaming((v) => !v);
          }}
          onStepForward={handleStepForward}
          onResetTimeline={handleResetTimeline}
          onSimulateAiEvent={handleSimulateAiEvent}
          isSimulatingAi={isAnalyzingAi}
          hasMoreSeedEvents={remainingSeedEvents.length > 0}
        />
      </main>

      <LiveNewsPanel locale={locale} />
      <CisaKevPanel locale={locale} />
      <ProjectEconomicsPanel locale={locale} />
      <LinkScannerPanel locale={locale} />
      <AgentMarketplacePanel locale={locale} />
      <TestnetReadinessPanel locale={locale} />

      {apiError && (
        <div
          role="alert"
          className="fixed top-16 left-4 right-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-md border border-[#DC2626] bg-[#1F0910]/95 px-4 py-3 text-xs font-medium text-[#FDA4AF] shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            aria-label={UI_COPY[locale].closeLabel}
            className="rounded p-1 hover:bg-white/10"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}



      {/* Instant Full Scenario Slide-Over on Clicking ANY News, Forecast, Global Signal, or Encrypted Map Node */}
      <ScenarioDetailDrawer
        locale={locale}
        dossier={selectedDossier}
        onClose={() => setSelectedItem(null)}
        onAnalyzeEventWithAi={handleRunDeepAiOnExisting}
        onSimulateNextWithAi={handleSimulateAiEvent}
        isAnalyzingAi={isAnalyzingAi}
        onOpenBackendMechanics={() => {
          setSelectedItem(null);
          setIsProMode(true);
          setBackendTab('semiotics');
          setIsBackendOpen(true);
        }}
      />

      {/* Hidden-by-default Backend Mechanics Modal (Dual Maps, Pi Math, ACH, Cloud SoloHost/Hermes, x402) */}
      <BackendMechanicsModal
        open={isProMode && isBackendOpen}
        onClose={() => setIsBackendOpen(false)}
        activeTab={backendTab}
        onChangeTab={setBackendTab}
        locale={locale}
        events={localizedEvents}
        globalSignals={globalSignals}
        graph={trajectoryGraph}
        probabilities={probabilities}
        mathMetrics={mathMetrics}
        forecasts={forecasts}
        achRankings={achRankings}
        platformMatrix={platformMatrix}
        redTeamNotes={redTeamNotes}
        onAddRedTeamNote={(note) =>
          setRedTeamNotes((prev) => [
            {
              ...note,
              id: `rt-${Date.now()}`,
              createdAt: new Date().toISOString().slice(11, 19) + ' UTC',
            },
            ...prev,
          ])
        }
        selectedEventId={selectedEventId}
        onSelectEventOnMap={(id) => setSelectedItem({ kind: 'event', id })}
        onSelectEncryptedNodeOnMap={(nodeId) =>
          setSelectedItem({ kind: 'encrypted_node', id: nodeId })
        }
        isStreaming={effectiveStreaming}
        onToggleStream={() => {
          if (remainingSeedEvents.length === 0) return;
          setIsStreaming((v) => !v);
        }}
        onStepForward={handleStepForward}
        onResetTimeline={handleResetTimeline}
        onSimulateAiEvent={handleSimulateAiEvent}
        isSimulatingAi={isAnalyzingAi}
        hasMoreSeedEvents={remainingSeedEvents.length > 0}
      />

      <AddEventModal
        open={isAddModalOpen}
        locale={locale}
        existingEvents={localizedEvents}
        onClose={() => setIsAddModalOpen(false)}
        onSubmitEvent={handleAddEvent}
        isSubmitting={isAnalyzingAi}
      />
    </div>
  );
}

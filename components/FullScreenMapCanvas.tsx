'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Newspaper,
  TrendingUp,
  Radio,
  Globe,
  Cable,
  Compass,
  ZoomIn,
  ZoomOut,
  Cloud,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AppLocale,
  ForecastBranch,
  GeodesicArc,
  GlobalSensedSignal,
  LiveEvent,
  MapLayerKey,
  RegionViewKey,
  SelectedMapItem,
  TimeRangeKey,
} from '@/lib/types';
import { SCENARIO_META } from '@/lib/trajectory-engine';
import { EPISTEMIC_TIER_META } from '@/lib/decoder-engine';
import {
  ENCRYPTED_MAP_NODES,
  MARITIME_CHOKEPOINTS,
  REGION_VIEWBOX_PRESETS,
  SUBSEA_CABLES,
  computeQClockWorldSweep,
  filterSignalsByTimeRange,
} from '@/lib/world-monitor-engine';
import {
  UI_COPY,
  getEncryptedNodeCopy,
  getEpistemicCopy,
  getRegionLabel,
  getSectorCopy,
} from '@/lib/i18n';

interface FullScreenMapCanvasProps {
  locale: AppLocale;
  isProMode: boolean;
  events: LiveEvent[];
  forecasts: ForecastBranch[];
  geodesicArcs: GeodesicArc[];
  globalSignals: GlobalSensedSignal[];
  lastSenseUtc: string | null;
  isSensingNow: boolean;
  autoSenseEnabled: boolean;
  onToggleAutoSense: () => void;
  onSenseNow: () => void;
  onOpenCloudAgents: () => void;
  qClockMinuteTick: number;
  selectedItem: SelectedMapItem | null;
  onSelectItem: (item: SelectedMapItem) => void;
  isStreaming: boolean;
  onToggleStream: () => void;
  onStepForward: () => void;
  onResetTimeline: () => void;
  onSimulateAiEvent: () => void;
  isSimulatingAi: boolean;
  hasMoreSeedEvents: boolean;
}

const MAP_W = 1200;
const MAP_H = 580;

function projectEquirectangular(lat: number, lng: number): { x: number; y: number } {
  const clampedLat = Math.max(-78, Math.min(78, lat));
  const clampedLng = Math.max(-180, Math.min(180, lng));
  return {
    x: Number((((clampedLng + 180) / 360) * MAP_W).toFixed(2)),
    y: Number((((90 - clampedLat) / 180) * MAP_H).toFixed(2)),
  };
}

function buildGeodesicCurve(
  from: { x: number; y: number },
  to: { x: number; y: number },
  index = 0
): { d: string; midX: number; midY: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const stagger = index % 2 === 0 ? 0 : 32;
  const archOffset = Math.min(130, Math.max(26, dist * 0.22) + stagger);
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 - archOffset;
  return {
    d: `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`,
    midX,
    midY: (from.y + to.y) / 2 - archOffset * 0.56,
  };
}

// World continental silhouettes in 1200x580 Equirectangular coordinates
const CONTINENT_PATHS: { id: string; d: string }[] = [
  {
    id: 'north-america',
    d: 'M 94 88 L 186 70 L 288 74 L 354 98 L 390 135 L 354 172 L 342 204 L 318 230 L 294 256 L 266 268 L 246 248 L 222 232 L 192 212 L 162 172 L 115 138 Z',
  },
  {
    id: 'greenland',
    d: 'M 402 38 L 470 32 L 502 58 L 462 94 L 418 86 Z',
  },
  {
    id: 'south-america',
    d: 'M 314 278 L 378 280 L 442 312 L 470 352 L 438 412 L 398 474 L 370 515 L 350 505 L 342 438 L 326 372 L 302 324 Z',
  },
  {
    id: 'europe',
    d: 'M 558 86 L 624 70 L 690 78 L 710 118 L 682 154 L 650 163 L 614 166 L 583 159 L 562 135 Z',
  },
  {
    id: 'africa',
    d: 'M 566 188 L 642 184 L 698 212 L 738 248 L 746 296 L 718 352 L 688 424 L 654 436 L 624 384 L 610 324 L 574 292 L 550 248 Z',
  },
  {
    id: 'asia',
    d: 'M 706 78 L 828 65 L 984 70 L 1094 94 L 1122 136 L 1070 172 L 1026 196 L 994 236 L 942 256 L 894 270 L 852 256 L 802 252 L 754 232 L 714 194 L 698 139 Z',
  },
  {
    id: 'maritime-se-asia',
    d: 'M 922 280 L 962 276 L 986 298 L 946 308 Z M 1002 285 L 1042 288 L 1046 308 L 1006 304 Z',
  },
  {
    id: 'australia',
    d: 'M 970 358 L 1050 348 L 1099 377 L 1090 432 L 1027 444 L 974 418 Z',
  },
  {
    id: 'antarctica',
    d: 'M 140 544 L 380 532 L 680 536 L 980 530 L 1110 546 L 1110 572 L 140 572 Z',
  },
];

type MapFilterMode = 'all' | 'events' | 'forecasts';

interface PositionedPin {
  item: SelectedMapItem;
  label: string;
  sublabel: string;
  ariaLabel: string;
  trueX: number;
  trueY: number;
  labelX: number;
  labelY: number;
  offset: boolean;
  accentColor: string;
  boxW: number;
}

export default function FullScreenMapCanvas({
  locale,
  isProMode,
  events,
  forecasts,
  geodesicArcs,
  globalSignals,
  lastSenseUtc,
  isSensingNow,
  autoSenseEnabled,
  onToggleAutoSense,
  onSenseNow,
  onOpenCloudAgents,
  qClockMinuteTick,
  selectedItem,
  onSelectItem,
  isStreaming,
  onToggleStream,
  onStepForward,
  onResetTimeline,
  onSimulateAiEvent,
  isSimulatingAi,
  hasMoreSeedEvents,
}: FullScreenMapCanvasProps) {
  const [filterMode, setFilterMode] = useState<MapFilterMode>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('all');
  const [regionView, setRegionView] = useState<RegionViewKey>('global');
  const [zoomMult, setZoomMult] = useState(1);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [layers, setLayers] = useState<Record<MapLayerKey, boolean>>({
    live_events: true,
    global_sensors: true,
    subsea_chokepoints: true,
    encrypted_maps: true,
  });

  const displayLayers = useMemo(() => ({
    ...layers,
    live_events: isProMode && layers.live_events,
    encrypted_maps: isProMode && layers.encrypted_maps,
  }), [isProMode, layers]);

  const copy = UI_COPY[locale];
  const lastEvent = events[events.length - 1] ?? null;

  const filteredSignals = useMemo(
    () => filterSignalsByTimeRange(globalSignals, timeRange),
    [globalSignals, timeRange]
  );

  const sweep = useMemo(
    () => computeQClockWorldSweep(qClockMinuteTick),
    [qClockMinuteTick]
  );

  // Dynamic World Monitor camera viewBox calculation
  const viewBox = useMemo(() => {
    const preset = REGION_VIEWBOX_PRESETS[regionView];
    const effectiveScale = Math.max(1, preset.baseScale * zoomMult);
    const vw = MAP_W / effectiveScale;
    const vh = MAP_H / effectiveScale;
    const vx = Math.max(0, Math.min(MAP_W - vw, preset.centerX - vw / 2));
    const vy = Math.max(0, Math.min(MAP_H - vh, preset.centerY - vh / 2));
    return { x: vx, y: vy, w: vw, h: vh };
  }, [regionView, zoomMult]);

  // Unified collision avoidance across all visible layers: events, forecasts, encrypted nodes & global sensors
  const positionedPins = useMemo<PositionedPin[]>(() => {
    const placed: PositionedPin[] = [];

    const candidateOffsets: [number, number][] = [
      [0, -34],
      [0, 34],
      [104, 0],
      [-104, 0],
      [92, -32],
      [-92, 32],
      [92, 32],
      [-92, -32],
      [0, -66],
      [0, 66],
      [142, -26],
      [-142, 26],
      [142, 26],
      [-142, -26],
      [0, -96],
      [0, 96],
      [176, 0],
      [-176, 0],
      [154, -58],
      [-154, 58],
    ];

    const placeItem = (
      candidate: Omit<PositionedPin, 'labelX' | 'labelY' | 'offset'>
    ) => {
      let lx = Math.max(76, Math.min(MAP_W - 76, candidate.trueX));
      let ly = Math.max(36, Math.min(MAP_H - 30, candidate.trueY));
      let usedOffset = false;

      const overlaps = (cx: number, cy: number) =>
        placed.some((p) => {
          const minDx = (p.boxW + candidate.boxW) * 0.5 + 10;
          return Math.abs(p.labelX - cx) < minDx && Math.abs(p.labelY - cy) < 28;
        });

      if (overlaps(lx, ly)) {
        for (const [dx, dy] of candidateOffsets) {
          const tx = Math.max(76, Math.min(MAP_W - 76, candidate.trueX + dx));
          const ty = Math.max(36, Math.min(MAP_H - 30, candidate.trueY + dy));
          if (!overlaps(tx, ty)) {
            lx = tx;
            ly = ty;
            usedOffset = true;
            break;
          }
        }
      }

      placed.push({
        ...candidate,
        labelX: lx,
        labelY: ly,
        offset: usedOffset,
      });
    };

    if (displayLayers.live_events) {
      if (filterMode === 'all' || filterMode === 'events') {
        for (const ev of events) {
          const pt = projectEquirectangular(ev.coordinates.lat, ev.coordinates.lng);
          const label = `#${ev.sequence} ${ev.coordinates.city}`;
          const sublabel = getSectorCopy(ev.sector, locale);
          placeItem({
            item: { kind: 'event', id: ev.id },
            label,
            sublabel,
            ariaLabel: `${label}: ${sublabel}`,
            trueX: pt.x,
            trueY: pt.y,
            accentColor: '#E11D48',
            boxW: 122,
          });
        }
      }

      if (filterMode === 'all' || filterMode === 'forecasts') {
        for (const fc of forecasts) {
          const pt = projectEquirectangular(
            fc.projectedCoords.lat,
            fc.projectedCoords.lng
          );
          const label = `${copy.forecastTag} ${fc.projectedCoords.city}`;
          const sublabel = `${fc.horizonLabel} · ${fc.probability}%`;
          placeItem({
            item: { kind: 'forecast', id: fc.id },
            label,
            sublabel,
            ariaLabel: `${label}: ${sublabel}`,
            trueX: pt.x,
            trueY: pt.y,
            accentColor: SCENARIO_META[fc.targetScenario].color,
            boxW: 152,
          });
        }
      }
    }

    if (displayLayers.encrypted_maps) {
      for (const node of ENCRYPTED_MAP_NODES) {
        const pt = projectEquirectangular(node.lat, node.lng);
        const tr = getEncryptedNodeCopy(node, locale);
        placeItem({
          item: { kind: 'encrypted_node', id: node.id },
          label: node.codeSymbol,
          sublabel: tr.title,
          ariaLabel: `${node.codeSymbol} — ${tr.title}`,
          trueX: pt.x,
          trueY: pt.y,
          accentColor: '#C084FC',
          boxW: 112,
        });
      }
    }

    if (displayLayers.global_sensors) {
      for (const sig of filteredSignals.slice(0, 12)) {
        const pt = projectEquirectangular(sig.lat, sig.lng);
        placeItem({
          item: { kind: 'global_signal', id: sig.id },
          label: sig.severityLabel,
          sublabel: sig.title,
          ariaLabel: `${sig.source}: ${sig.title} (${sig.severityLabel})`,
          trueX: pt.x,
          trueY: pt.y,
          accentColor: '#F59E0B',
          boxW: 92,
        });
      }
    }

    return placed;
  }, [
    events,
    forecasts,
    filteredSignals,
    filterMode,
    copy.forecastTag,
    displayLayers.live_events,
    displayLayers.encrypted_maps,
    displayLayers.global_sensors,
    locale,
  ]);

  // Convert true MAP_W/H coordinate to active zoomed viewport %
  const toViewportPct = (x: number, y: number) => ({
    leftPct: ((x - viewBox.x) / viewBox.w) * 100,
    topPct: ((y - viewBox.y) / viewBox.h) * 100,
  });

  const isSelected = (item: SelectedMapItem) =>
    selectedItem?.kind === item.kind && selectedItem?.id === item.id;

  const toggleLayer = (key: MapLayerKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Pi sinusoidal harmonic wave across world longitudes
  const piWavePath = useMemo(() => {
    const pts: string[] = [];
    for (let x = 0; x <= MAP_W; x += 24) {
      const lng = (x / MAP_W) * 360 - 180;
      const rad = ((lng + sweep.activeLng) * Math.PI) / 180;
      const lat = 42 * Math.sin(rad);
      const y = ((90 - lat) / 180) * MAP_H;
      pts.push(`${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [sweep.activeLng]);

  const activeMeridianX = ((sweep.activeLng + 180) / 360) * MAP_W;
  const oppMeridianX = ((sweep.oppositeLng + 180) / 360) * MAP_W;

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] min-h-[580px] w-full flex-col bg-[#07070B]">
      {isProMode && (
        <div role="status" className="border-b border-violet-400/20 bg-violet-950/40 px-3 py-2 text-center text-[11px] text-violet-100">
          {locale === 'ar'
            ? 'وضع المحترفين: الأحداث والمسارات التوضيحية محاكاة وليست بلاغات حية مؤكدة.'
            : 'Pro Mode: scenario events and projections are simulations, not verified live incident reports.'}
        </div>
      )}
      {/* Compact Mobile-Only Action Strip (<640px) so map keeps maximum vertical space */}
      <div className="z-20 flex sm:hidden items-center justify-between gap-1.5 border-b border-[#1E1B4B] bg-[#0B0B14]/95 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={onToggleAutoSense}
            className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded border px-2 py-1 text-[11px] font-semibold ${
              autoSenseEnabled
                ? 'border-[#16A34A]/70 bg-[#16A34A]/15 text-[#4ADE80]'
                : 'border-[#312E81] bg-[#0C0D16] text-[#CBD5E1]'
            }`}
          >
            <Radio className="h-3 w-3" aria-hidden="true" />
            <span>{autoSenseEnabled ? copy.liveShort : copy.pausedShort}</span>
          </button>

          {isProMode && (
            <button
              type="button"
              onClick={onOpenCloudAgents}
              className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded border border-[#9333EA] bg-[#2E1065]/80 px-2 py-1 text-[11px] font-semibold text-white"
            >
              <Cloud className="h-3 w-3 text-[#C084FC]" aria-hidden="true" />
              <span>{copy.cloudShort}</span>
            </button>
          )}

          {isProMode && (
            <button
              type="button"
              onClick={onSimulateAiEvent}
              disabled={isSimulatingAi}
              className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded bg-[#7C3AED] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              <span>Gemini</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileToolsOpen((o) => !o)}
          aria-expanded={mobileToolsOpen}
          className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded border border-[#312E81] bg-[#101124] px-2 py-1 text-[11px] font-semibold text-[#E0E7FF]"
        >
          <SlidersHorizontal className="h-3 w-3 text-[#C084FC]" aria-hidden="true" />
          <span>{copy.layersShort}</span>
          {mobileToolsOpen ? (
            <ChevronUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Primary World Monitor Control Strip (always visible on >=sm, collapsible on mobile) */}
      <div className={`${mobileToolsOpen ? 'block' : 'hidden'} sm:block`}>
      <div className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1B4B] bg-[#0B0B14]/95 px-3 py-2 backdrop-blur-md sm:px-6">
        {/* Left: Time Range + Region Focus (World Monitor Style) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded border border-[#2B2856] bg-[#07070B] p-0.5">
            {(['1h', '6h', '24h', '48h', '7d', 'all'] as TimeRangeKey[]).map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setTimeRange(tr)}
                className={`whitespace-nowrap rounded px-2 py-1 font-latin-math text-[11px] font-semibold transition-colors ${
                  timeRange === tr
                    ? 'bg-[#7C3AED] text-white'
                    : 'text-[#A5B4FC] hover:text-white'
                }`}
              >
                {tr.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-[#A5B4FC] shrink-0" aria-hidden="true" />
            <label htmlFor="region-focus-select" className="sr-only">
              Region Focus
            </label>
            <select
              id="region-focus-select"
              value={regionView}
              onChange={(e) => {
                setRegionView(e.target.value as RegionViewKey);
                setZoomMult(1);
              }}
              className="rounded border border-[#2B2856] bg-[#0C0D16] px-2 py-1 text-xs font-semibold text-white"
            >
              {(Object.keys(REGION_VIEWBOX_PRESETS) as RegionViewKey[]).map((rk) => (
                <option key={rk} value={rk}>
                  {getRegionLabel(rk, locale)}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex items-center gap-1 rounded border border-[#2B2856] bg-[#0C0D16] p-0.5">
            <button
              type="button"
              onClick={() => setZoomMult((z) => Math.min(2.4, Number((z + 0.3).toFixed(2))))}
              aria-label="Zoom in map"
              className="rounded p-1 text-[#CBD5E1] hover:bg-[#191B38] hover:text-white"
            >
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setZoomMult((z) => Math.max(1, Number((z - 0.3).toFixed(2))))}
              aria-label="Zoom out map"
              className="rounded p-1 text-[#CBD5E1] hover:bg-[#191B38] hover:text-white"
            >
              <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Center/Right: Continuous Auto-Sense + Cloud Agents + Event Stream Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleAutoSense}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
              autoSenseEnabled
                ? 'border-[#16A34A]/70 bg-[#16A34A]/15 text-[#4ADE80]'
                : 'border-[#312E81] bg-[#0C0D16] text-[#CBD5E1]'
            }`}
          >
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{autoSenseEnabled ? copy.autoSenseOn : copy.autoSenseOff}</span>
          </button>

          <button
            type="button"
            disabled={isSensingNow}
            onClick={onSenseNow}
            className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md border border-[#312E81] bg-[#0C0D16] px-2.5 py-1 text-xs font-semibold text-[#E0E7FF] hover:border-[#9333EA] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isSensingNow ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{copy.scanNow}</span>
          </button>

          {isProMode && (
            <button
              type="button"
              onClick={onOpenCloudAgents}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-[#9333EA] bg-[#2E1065]/70 px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#7C3AED] transition-colors"
            >
              <Cloud className="h-3.5 w-3.5 text-[#C084FC]" aria-hidden="true" />
              <span>{copy.cloudAgentShort}</span>
            </button>
          )}

          {isProMode && (
            <button
              type="button"
              onClick={onSimulateAiEvent}
              disabled={isSimulatingAi}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md bg-[#7C3AED] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isSimulatingAi ? copy.simulatingGemini : copy.simulateGemini}</span>
            </button>
          )}
        </div>
      </div>

      {/* Layer Toggles & Stream Bar */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-[#161835] bg-[#07070B]/95 px-3 py-1.5 text-[11px] sm:px-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleLayer('live_events')}
            className={isProMode ? `whitespace-nowrap rounded border px-2 py-0.5 font-semibold transition-colors ${
              displayLayers.live_events
                ? 'border-[#E11D48] bg-[#2D0A18] text-white'
                : 'border-[#2B2856] text-[#A5B4FC]'
            }` : 'hidden'}
          >
            {copy.layerEvents} ({events.length + forecasts.length})
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('global_sensors')}
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 font-semibold transition-colors ${
              displayLayers.global_sensors
                ? 'border-[#D97706] bg-[#2A1B08] text-[#FBBF24]'
                : 'border-[#2B2856] text-[#A5B4FC]'
            }`}
          >
            <Globe className="h-3 w-3" aria-hidden="true" />
            <span>
              {copy.layerGlobal} ({filteredSignals.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('subsea_chokepoints')}
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 font-semibold transition-colors ${
              displayLayers.subsea_chokepoints
                ? 'border-[#0891B2] bg-[#082532] text-[#67E8F9]'
                : 'border-[#2B2856] text-[#A5B4FC]'
            }`}
          >
            <Cable className="h-3 w-3" aria-hidden="true" />
            <span>{copy.layerCables}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer('encrypted_maps')}
            className={isProMode ? `inline-flex items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 font-semibold transition-colors ${
              displayLayers.encrypted_maps
                ? 'border-[#9333EA] bg-[#2E1065]/70 text-[#E9D5FF]'
                : 'border-[#2B2856] text-[#A5B4FC]'
            }` : 'hidden'}
          >
            <Compass className="h-3 w-3" aria-hidden="true" />
            <span>
              {copy.layerEncrypted} ({ENCRYPTED_MAP_NODES.length})
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] tabular-nums">
          <div className={isProMode ? "hidden sm:flex items-center gap-1" : "hidden"}>
            {(['all', 'events', 'forecasts'] as MapFilterMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFilterMode(m)}
                className={`rounded px-2 py-0.5 font-semibold ${
                  filterMode === m ? 'bg-[#312E81] text-white' : 'text-[#A5B4FC]'
                }`}
              >
                {m === 'all'
                  ? copy.filterAll
                  : m === 'events'
                  ? copy.filterEvents
                  : copy.filterForecasts}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleStream}
            className={isProMode ? "inline-flex items-center gap-1 rounded border border-[#2B2856] px-2 py-0.5 text-[#CBD5E1] hover:text-white" : "hidden"}
          >
            {isStreaming ? (
              <Pause className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Play className="h-3 w-3" aria-hidden="true" />
            )}
            <span>{isStreaming ? copy.streamPause : copy.streamStart}</span>
          </button>

          <button
            type="button"
            onClick={onStepForward}
            disabled={!hasMoreSeedEvents}
            className={isProMode ? "inline-flex items-center gap-1 rounded border border-[#2B2856] px-2 py-0.5 text-[#CBD5E1] hover:text-white disabled:opacity-40" : "hidden"}
          >
            <SkipForward className="h-3 w-3" aria-hidden="true" />
            <span>{copy.nextEvent}</span>
          </button>

          <button
            type="button"
            onClick={onResetTimeline}
            aria-label={copy.resetMap}
            className={isProMode ? "inline-flex items-center gap-1 rounded border border-[#2B2856] px-2 py-0.5 text-[#A5B4FC] hover:text-white" : "hidden"}
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>{copy.resetMap}</span>
          </button>

          {lastSenseUtc && (
            <span className="font-latin-math text-[10px] text-[#4ADE80]">
              UTC {lastSenseUtc.slice(11, 19)}{isProMode ? ` · Q#${sweep.sector}` : ''}
            </span>
          )}
        </div>
      </div>
      </div>

      {/* Main Full-Screen Interactive Multi-Layer World Map */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#07070B]">
        <div
          dir="ltr"
          data-testid="full-screen-map"
          className="relative h-full w-full overflow-x-auto overflow-y-hidden sm:overflow-hidden"
        >
          <div className="relative h-full min-w-[780px] w-full sm:min-w-0">
            <svg
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="map-vignette" cx="50%" cy="48%" r="65%">
                  <stop offset="0%" stopColor="#121433" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#07070B" stopOpacity="0.95" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#map-vignette)" />

              {/* Subtle Lat/Lng Graticule */}
              {[-60, -30, 0, 30, 60].map((lat) => {
                const y = ((90 - lat) / 180) * MAP_H;
                return (
                  <line
                    key={`lat-${lat}`}
                    x1="0"
                    y1={y}
                    x2={MAP_W}
                    y2={y}
                    stroke={lat === 0 ? '#312E81' : '#161835'}
                    strokeWidth={lat === 0 ? 1.1 : 0.7}
                    strokeDasharray={lat === 0 ? '6 4' : undefined}
                  />
                );
              })}
              {[-120, -60, 0, 60, 120].map((lng) => {
                const x = ((lng + 180) / 360) * MAP_W;
                return (
                  <line
                    key={`lng-${lng}`}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2={MAP_H}
                    stroke={lng === 0 ? '#312E81' : '#161835'}
                    strokeWidth={lng === 0 ? 1.1 : 0.7}
                    strokeDasharray={lng === 0 ? '6 4' : undefined}
                  />
                );
              })}

              {/* Continents */}
              {CONTINENT_PATHS.map((c) => (
                <path
                  key={c.id}
                  d={c.d}
                  fill="#121430"
                  stroke="#2B2856"
                  strokeWidth="1.2"
                />
              ))}

              {/* Layer: Subsea Internet Cables & Chokepoints */}
              {displayLayers.subsea_chokepoints &&
                SUBSEA_CABLES.map((cable, idx) => {
                  const p1 = projectEquirectangular(cable.from.lat, cable.from.lng);
                  const p2 = projectEquirectangular(cable.to.lat, cable.to.lng);
                  const curve = buildGeodesicCurve(p1, p2, idx);
                  return (
                    <path
                      key={cable.id}
                      d={curve.d}
                      fill="none"
                      stroke={cable.status === 'elevated_watch' ? '#06B6D4' : '#38BDF8'}
                      strokeWidth="1.3"
                      strokeDasharray="4 4"
                      strokeOpacity="0.55"
                    />
                  );
                })}

              {displayLayers.subsea_chokepoints &&
                MARITIME_CHOKEPOINTS.map((chk) => {
                  const pt = projectEquirectangular(chk.lat, chk.lng);
                  return (
                    <g key={chk.id}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={6.5}
                        fill="none"
                        stroke={chk.status === 'critical' ? '#E11D48' : '#22D3EE'}
                        strokeWidth="1"
                        strokeOpacity="0.65"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={2.5}
                        fill="#22D3EE"
                      />
                    </g>
                  );
                })}

              {/* Layer: Encrypted Maps Q-Clock Sweep + Pi Harmonic Wave */}
              {displayLayers.encrypted_maps && (
                <g>
                  <path
                    d={piWavePath}
                    fill="none"
                    stroke="#9333EA"
                    strokeWidth="1.2"
                    strokeDasharray="3 5"
                    strokeOpacity="0.45"
                  />
                  <line
                    x1={activeMeridianX}
                    y1={0}
                    x2={activeMeridianX}
                    y2={MAP_H}
                    stroke="#C084FC"
                    strokeWidth="1.1"
                    strokeDasharray="4 3"
                    strokeOpacity="0.5"
                  />
                  <line
                    x1={oppMeridianX}
                    y1={0}
                    x2={oppMeridianX}
                    y2={MAP_H}
                    stroke="#E11D48"
                    strokeWidth="0.9"
                    strokeDasharray="2 4"
                    strokeOpacity="0.4"
                  />
                </g>
              )}

              {/* Layer: Geodesic Arcs for Observed News & Forecasts */}
              {displayLayers.live_events &&
                geodesicArcs.map((arc, idx) => {
                  const p1 = projectEquirectangular(
                    arc.fromCoords.lat,
                    arc.fromCoords.lng
                  );
                  const p2 = projectEquirectangular(
                    arc.toCoords.lat,
                    arc.toCoords.lng
                  );
                  const curve = buildGeodesicCurve(p1, p2, idx);
                  const isArcSelected =
                    selectedItem?.kind === 'event' &&
                    (selectedItem.id === arc.fromEventId ||
                      selectedItem.id === arc.toEventId);

                  return (
                    <g key={arc.id}>
                      <motion.path
                        d={curve.d}
                        fill="none"
                        stroke={isArcSelected ? '#E11D48' : '#7C3AED'}
                        strokeWidth={isArcSelected ? 2.6 : 1.6}
                        initial={{ pathLength: 0.1, opacity: 0.35 }}
                        animate={{
                          pathLength: 1,
                          opacity: isArcSelected ? 1 : 0.72,
                        }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                      <text
                        x={curve.midX}
                        y={curve.midY - 5}
                        textAnchor="middle"
                        fill={isArcSelected ? '#FDA4AF' : '#C084FC'}
                        fontSize="10"
                        fontFamily="var(--font-mono)"
                      >
                        {arc.distanceKm} km
                      </text>
                    </g>
                  );
                })}

              {displayLayers.live_events &&
                lastEvent &&
                forecasts.map((fc, idx) => {
                  const pStart = projectEquirectangular(
                    lastEvent.coordinates.lat,
                    lastEvent.coordinates.lng
                  );
                  const pEnd = projectEquirectangular(
                    fc.projectedCoords.lat,
                    fc.projectedCoords.lng
                  );
                  const curve = buildGeodesicCurve(pStart, pEnd, idx + 1);
                  const activeFc =
                    selectedItem?.kind === 'forecast' &&
                    selectedItem.id === fc.id;
                  return (
                    <path
                      key={`fc-arc-${fc.id}`}
                      d={curve.d}
                      fill="none"
                      stroke={SCENARIO_META[fc.targetScenario].color}
                      strokeWidth={activeFc ? 2.5 : 1.5}
                      strokeDasharray="6 4"
                      strokeOpacity={activeFc ? 1 : 0.78}
                    />
                  );
                })}

              {/* Cross-Map Harmonic Links from Global Sensors -> Nearest Encrypted Node */}
              {displayLayers.global_sensors &&
                displayLayers.encrypted_maps &&
                filteredSignals.slice(0, 12).map((sig) => {
                  const node = ENCRYPTED_MAP_NODES.find(
                    (n) => n.id === sig.nearestEncryptedId
                  );
                  if (!node) return null;
                  const p1 = projectEquirectangular(sig.lat, sig.lng);
                  const p2 = projectEquirectangular(node.lat, node.lng);
                  return (
                    <line
                      key={`corr-${sig.id}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#F59E0B"
                      strokeWidth="0.9"
                      strokeDasharray="2 3"
                      strokeOpacity="0.55"
                    />
                  );
                })}

              {/* True Geo Dots + Leader Hairlines for Main Events/Forecasts */}
              {positionedPins.map((pin) => {
                const active = isSelected(pin.item);
                return (
                  <g key={`anchor-${pin.item.kind}-${pin.item.id}`}>
                    {pin.offset && (
                      <line
                        x1={pin.trueX}
                        y1={pin.trueY}
                        x2={pin.labelX}
                        y2={pin.labelY}
                        stroke={active ? '#FFFFFF' : pin.accentColor}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}
                    <circle
                      cx={pin.trueX}
                      cy={pin.trueY}
                      r={active ? 5 : 3.5}
                      fill={pin.accentColor}
                      stroke="#07070B"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Unified Collision-Free Interactive Pins (News, Forecasts, Encrypted Maps, Global Sensors) */}
            {positionedPins.map((pin) => {
              const active = isSelected(pin.item);
              const { leftPct, topPct } = toViewportPct(pin.labelX, pin.labelY);
              if (leftPct < -5 || leftPct > 105 || topPct < -5 || topPct > 105) {
                return null;
              }

              if (pin.item.kind === 'global_signal') {
                return (
                  <button
                    key={`gsig-${pin.item.id}`}
                    type="button"
                    onClick={() => onSelectItem(pin.item)}
                    aria-label={pin.ariaLabel}
                    aria-pressed={active}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-10 flex items-center gap-1 rounded border px-1.5 py-0.5 font-latin-math text-[10px] font-semibold shadow transition-all ${
                      active
                        ? 'z-20 border-white bg-[#92400E] text-white scale-110'
                        : 'border-[#F59E0B]/70 bg-[#1B1206]/95 text-[#FDE68A] hover:border-white'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF24]" />
                    <span className="whitespace-nowrap">{pin.label}</span>
                  </button>
                );
              }

              if (pin.item.kind === 'encrypted_node') {
                return (
                  <button
                    key={`enc-${pin.item.id}`}
                    type="button"
                    onClick={() => onSelectItem(pin.item)}
                    aria-label={pin.ariaLabel}
                    aria-pressed={active}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-10 flex items-center gap-1 rounded border px-2 py-0.5 font-latin-math text-[10px] font-bold shadow transition-all ${
                      active
                        ? 'z-20 border-white bg-[#6D28D9] text-white scale-110'
                        : 'border-[#C084FC]/80 bg-[#1F0B3B]/95 text-[#E9D5FF] hover:border-white'
                    }`}
                  >
                    <span aria-hidden="true">◆</span>
                    <span className="whitespace-nowrap">{pin.label}</span>
                  </button>
                );
              }

              const isForecast = pin.item.kind === 'forecast';
              return (
                <button
                  key={`pin-${pin.item.kind}-${pin.item.id}`}
                  type="button"
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                  onClick={() => onSelectItem(pin.item)}
                  aria-label={pin.ariaLabel}
                  aria-pressed={active}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                    borderColor: active
                      ? '#FFFFFF'
                      : isForecast
                      ? pin.accentColor
                      : '#6366F1',
                  }}
                  className={`absolute z-10 flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E11D48] ${
                    isForecast ? 'border-dashed' : ''
                  } ${
                    active
                      ? 'z-20 bg-[#2D0A18] text-white scale-105'
                      : isForecast
                      ? 'bg-[#0B0B18]/95 text-[#E0E7FF] hover:bg-[#1E1038]'
                      : 'bg-[#101124]/95 text-white hover:border-[#C084FC]'
                  }`}
                >
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: pin.accentColor }}
                  />
                  <span className="whitespace-nowrap">{pin.label}</span>
                  <span className="hidden sm:inline text-[10px] font-normal text-[#C7D2FE]">
                    {isForecast ? `(${pin.sublabel})` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gentle Top-Center Hint Banner on Desktop/Tablet when no drawer is open */}
        {!selectedItem && (
          <div
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            className="pointer-events-none absolute inset-x-0 top-3 z-20 hidden sm:flex justify-center px-3"
          >
            <div className="rounded-md border border-[#312E81] bg-[#0B0B14]/90 px-3 py-1.5 text-center text-xs font-medium text-[#E0E7FF] backdrop-blur-md">
              {copy.mapHintPre}{' '}
              <span className="font-bold text-[#FDA4AF]">{copy.mapHintEvents}</span>{' '}
              {copy.mapHintOr}{' '}
              <span className="font-bold text-[#C084FC]">{copy.mapHintForecasts}</span>{' '}
              {copy.mapHintPost}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Docked Interactive Feed: Observed Events + Live Global Sensors + Encrypted Nodes + Forecasts */}
      <div className="z-20 border-t border-[#2B2856] bg-[#0B0B14]/95 px-3 py-2 sm:px-6 sm:py-3 backdrop-blur-md">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[#A5B4FC]">
            <span>{isProMode ? copy.feedHeader : (locale === 'ar' ? 'إشارات موثقة من المصادر' : 'Source-attributed signals')}</span>
            {isProMode && <span className="hidden sm:inline text-[#CBD5E1]">{copy.feedLegend}</span>}
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {events.map((ev) => {
              const active = isSelected({ kind: 'event', id: ev.id });
              const tierMeta = EPISTEMIC_TIER_META[ev.epistemicTier ?? 'plausible'];
              return (
                <button
                  key={`feed-${ev.id}`}
                  type="button"
                  onClick={() => onSelectItem({ kind: 'event', id: ev.id })}
                  className={`flex min-w-[230px] max-w-[260px] shrink-0 flex-col justify-between rounded-md border p-2.5 text-start transition-all ${
                    active
                      ? 'border-[#E11D48] bg-[#2D0A18] text-white'
                      : 'border-[#2B2856] bg-[#101124] text-[#F3F4F6] hover:border-[#9333EA]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] text-[#FDA4AF]">
                    <span className="inline-flex items-center gap-1 font-bold">
                      <Newspaper className="h-3 w-3" aria-hidden="true" />#{ev.sequence} ·{' '}
                      {ev.coordinates.city}
                    </span>
                    <span className="font-semibold" style={{ color: tierMeta.color }}>
                      {getEpistemicCopy(ev.epistemicTier ?? 'plausible', locale).label}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs font-bold leading-snug">
                    {ev.title}
                  </div>
                </button>
              );
            })}

            {displayLayers.global_sensors &&
              filteredSignals.slice(0, 6).map((sig) => {
                const active = isSelected({ kind: 'global_signal', id: sig.id });
                return (
                  <button
                    key={`feed-gsig-${sig.id}`}
                    type="button"
                    onClick={() =>
                      onSelectItem({ kind: 'global_signal', id: sig.id })
                    }
                    className={`flex min-w-[225px] max-w-[255px] shrink-0 flex-col justify-between rounded-md border p-2.5 text-start transition-all ${
                      active
                        ? 'border-white bg-[#451A03] text-white'
                        : 'border-[#B45309]/60 bg-[#1B1206] text-[#FEF3C7] hover:border-[#FBBF24]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] text-[#FBBF24]">
                      <span className="inline-flex items-center gap-1 font-bold">
                        <Globe className="h-3 w-3" aria-hidden="true" />
                        {sig.source}
                      </span>
                      <span className="font-latin-math font-bold">
                        {sig.severityLabel}{isProMode ? ` · π=${sig.piResonanceIndex}` : ''}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-white">
                      {sig.title}
                    </div>
                  </button>
                );
              })}

            {displayLayers.encrypted_maps &&
              ENCRYPTED_MAP_NODES.slice(0, 4).map((node) => {
                const active = isSelected({ kind: 'encrypted_node', id: node.id });
                const tr = getEncryptedNodeCopy(node, locale);
                return (
                  <button
                    key={`feed-enc-${node.id}`}
                    type="button"
                    onClick={() =>
                      onSelectItem({ kind: 'encrypted_node', id: node.id })
                    }
                    className={`flex min-w-[225px] max-w-[255px] shrink-0 flex-col justify-between rounded-md border p-2.5 text-start transition-all ${
                      active
                        ? 'border-white bg-[#4C1D95] text-white'
                        : 'border-[#7C3AED]/70 bg-[#1A0D36] text-[#E9D5FF] hover:border-[#C084FC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] text-[#C084FC]">
                      <span className="font-latin-math font-bold">
                        ◆ {node.codeSymbol}
                      </span>
                      <span className="font-latin-math">Q#{node.qClockSector}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-white">
                      {tr.title}
                    </div>
                  </button>
                );
              })}

            {forecasts.map((fc) => {
              const active = isSelected({ kind: 'forecast', id: fc.id });
              const scMeta = SCENARIO_META[fc.targetScenario];
              return (
                <button
                  key={`feed-${fc.id}`}
                  type="button"
                  onClick={() => onSelectItem({ kind: 'forecast', id: fc.id })}
                  className={`flex min-w-[235px] max-w-[270px] shrink-0 flex-col justify-between rounded-md border border-dashed p-2.5 text-start transition-all ${
                    active
                      ? 'border-white bg-[#2E1065] text-white'
                      : 'border-[#7C3AED] bg-[#14102B] text-[#E0E7FF] hover:border-[#C084FC]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span
                      className="inline-flex items-center gap-1 font-bold"
                      style={{ color: scMeta.color }}
                    >
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      {copy.forecastTag} {fc.projectedCoords.city}
                    </span>
                    <span className="font-latin-math font-bold text-[#C084FC]">
                      {fc.horizonLabel} · {fc.probability}%
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-white">
                    {fc.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

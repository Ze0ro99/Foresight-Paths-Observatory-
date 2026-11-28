'use client';

import React from 'react';
import { Plus, SlidersHorizontal, Globe2, Languages } from 'lucide-react';
import { AppLocale, ScenarioId, ScenarioProbabilities } from '@/lib/types';
import { SCENARIO_META } from '@/lib/trajectory-engine';
import { LOCALE_OPTIONS, UI_COPY, getScenarioCopy } from '@/lib/i18n';

interface TopNavProps {
  locale: AppLocale;
  onChangeLocale: (locale: AppLocale) => void;
  probabilities: ScenarioProbabilities;
  onResetSelection: () => void;
  isProMode: boolean;
  onToggleProMode: () => void;
  onOpenAddEvent: () => void;
}

export default function TopNav({
  locale,
  onChangeLocale,
  probabilities,
  onResetSelection,
  isProMode,
  onToggleProMode,
  onOpenAddEvent,
}: TopNavProps) {
  const dominantId: ScenarioId = probabilities.dominant;
  const dominantMeta = SCENARIO_META[dominantId];
  const dominantTitle = getScenarioCopy(dominantId, locale).title;
  const copy = UI_COPY[locale];

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[#2B2856] bg-[#0B0B14]/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={onResetSelection}
          className="inline-flex min-w-0 items-center gap-1 sm:gap-2 whitespace-nowrap text-start text-[12px] sm:text-lg font-bold tracking-tight text-white hover:text-[#C084FC] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9333EA]"
        >
          <Globe2
            className="h-4 w-4 sm:h-5 sm:w-5 text-[#E11D48] shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">{copy.brandTitle}</span>
        </button>

        {/* Zone 2: Dominant Scenario + 5-Language Selector + Backend Studio */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <div className={isProMode ? 'hidden lg:flex items-center gap-2 text-xs text-[#CBD5E1] tabular-nums' : 'hidden'}>
            <span className="text-[#A5B4FC]">{copy.dominantLabel}</span>
            <span
              className="font-bold"
              style={{ color: dominantMeta.color }}
            >
              {dominantTitle} ({probabilities[dominantId]}%)
            </span>
          </div>

          <div className="inline-flex items-center gap-1 rounded-md border border-[#312E81] bg-[#0C0D16] px-1.5 py-1 hover:border-[#9333EA] transition-colors">
            <Languages className="h-3.5 w-3.5 text-[#C084FC] shrink-0" aria-hidden="true" />
            <label htmlFor="app-locale-select" className="sr-only">
              {copy.languageLabel}
            </label>
            <select
              id="app-locale-select"
              value={locale}
              onChange={(e) => onChangeLocale(e.target.value as AppLocale)}
              aria-label={copy.languageLabel}
              className="bg-transparent font-latin-math text-[11px] font-semibold text-[#C7D2FE] focus:outline-none cursor-pointer"
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-[#0B0B14] text-white">
                  {opt.nativeLabel}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleProMode}
            className="inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-[#312E81] bg-[#121329] px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-[#E0E7FF] hover:border-[#9333EA] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9333EA]"
          >
            <SlidersHorizontal
              className="h-3.5 w-3.5 text-[#C084FC]"
              aria-hidden="true"
            />
            <span>{isProMode ? (locale === 'ar' ? 'الوضع البسيط' : 'Simple Mode') : (locale === 'ar' ? 'وضع المحترفين' : 'Pro Mode')}</span>
          </button>
        </div>

        {/* Zone 3: 1 Primary CTA */}
        <div className={isProMode ? 'shrink-0' : 'hidden'}>
          <button
            type="button"
            onClick={onOpenAddEvent}
            className="inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 rounded-md bg-[#DC2626] px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E11D48]"
          >
            <Plus
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
              aria-hidden="true"
            />
            <span>{copy.addEventBtnShort}</span>
            <span className="hidden sm:inline">{copy.addEventBtnTail}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

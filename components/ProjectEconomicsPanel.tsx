'use client';

import React, { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import type { AppLocale } from '@/lib/types';
import { formatStroopsAsPi } from '@/lib/pi-amounts.mjs';
import { calculateProjectEconomics } from '@/lib/project-economics.mjs';

type Inputs = {
  grossRevenuePi: string;
  discountPercent: string;
  taxPercent: string;
  payrollPi: string;
  inventoryCostPi: string;
  operatingExpensesPi: string;
  stressRevenueDropPercent: string;
};

const INITIAL_INPUTS: Inputs = {
  grossRevenuePi: '3',
  discountPercent: '0',
  taxPercent: '0',
  payrollPi: '0.25',
  inventoryCostPi: '0.5',
  operatingExpensesPi: '0.25',
  stressRevenueDropPercent: '20',
};

const FIELDS: Array<{ key: keyof Inputs; kind: 'pi' | 'percent' }> = [
  { key: 'grossRevenuePi', kind: 'pi' },
  { key: 'discountPercent', kind: 'percent' },
  { key: 'taxPercent', kind: 'percent' },
  { key: 'payrollPi', kind: 'pi' },
  { key: 'inventoryCostPi', kind: 'pi' },
  { key: 'operatingExpensesPi', kind: 'pi' },
  { key: 'stressRevenueDropPercent', kind: 'percent' },
];

const LABELS: Record<keyof Inputs, [string, string]> = {
  grossRevenuePi: ['الإيرادات الإجمالية', 'Gross revenue'],
  discountPercent: ['الخصومات', 'Discounts'],
  taxPercent: ['نسبة الضريبة المُدخلة', 'User-entered tax rate'],
  payrollPi: ['الرواتب', 'Payroll'],
  inventoryCostPi: ['تكلفة المخزون', 'Inventory cost'],
  operatingExpensesPi: ['المصروفات التشغيلية', 'Operating expenses'],
  stressRevenueDropPercent: ['انخفاض الإيرادات في اختبار الضغط', 'Stress-test revenue reduction'],
};

const RESULT_LABELS: Record<string, [string, string]> = {
  grossRevenueStroops: ['الإيرادات الإجمالية', 'Gross revenue'],
  discountsStroops: ['قيمة الخصومات', 'Discount amount'],
  netSalesStroops: ['صافي المبيعات', 'Net sales'],
  estimatedTaxStroops: ['الضريبة التقديرية', 'Estimated tax'],
  totalCostsStroops: ['إجمالي التكاليف', 'Total costs'],
  netProfitStroops: ['صافي النتيجة التشغيلية', 'Net operating result'],
  stressedNetProfitStroops: ['النتيجة بعد صدمة الإيرادات', 'Result after revenue shock'],
};

type Calculation = ReturnType<typeof calculateProjectEconomics>;

function label(key: keyof Inputs, ar: boolean) {
  return LABELS[key][ar ? 0 : 1];
}

function formatPi(stroops: string) {
  const negative = stroops.startsWith('-');
  const unsigned = negative ? stroops.slice(1) : stroops;
  const formatted = formatStroopsAsPi(unsigned);
  return formatted === null ? '—' : `${negative ? '-' : ''}${formatted} Pi`;
}

function formatPercentBps(value: string) {
  const basisPoints = BigInt(value);
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const negative = basisPoints < zero;
  const absolute = negative ? -basisPoints : basisPoints;
  const whole = absolute / hundred;
  const fraction = (absolute % hundred).toString().padStart(2, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole.toString()}${fraction ? `.${fraction}` : ''}%`;
}

function ResultRow({
  labelText,
  value,
  emphasis = false,
}: {
  labelText: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-white/[0.07] py-2.5 last:border-0 ${emphasis ? 'font-semibold text-white' : 'text-slate-300'}`}>
      <span className="text-xs sm:text-sm">{labelText}</span>
      <span className={`font-mono text-sm tabular-nums ${emphasis ? 'text-emerald-300' : 'text-slate-100'}`}>{value}</span>
    </div>
  );
}

export default function ProjectEconomicsPanel({ locale }: { locale: AppLocale }) {
  const ar = locale === 'ar';
  const [inputs, setInputs] = useState<Inputs>(INITIAL_INPUTS);
  const result: Calculation = useMemo(
    () => calculateProjectEconomics(inputs),
    [inputs],
  );

  const update = (key: keyof Inputs, value: string) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const text = (arabic: string, english: string) => (ar ? arabic : english);

  return (
    <section
      id="project-economics"
      aria-labelledby="project-economics-title"
      dir={ar ? 'rtl' : 'ltr'}
      className="mx-4 my-4 rounded-xl border border-cyan-400/20 bg-[#0B1120] p-4 shadow-lg shadow-black/20 md:mx-6 md:p-5"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-200">
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="project-economics-title" className="text-base font-bold text-white sm:text-lg">
              {text('المشاريع والاقتصاد التشغيلي', 'Projects & operating economics')}
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">
              {text(
                'حاسبة مستقلة تعمل محلياً بعملة Pi فقط، لتقدير الإيرادات والتكاليف واختبار تحمّل المشروع.',
                'An independent local calculator for Pi-denominated revenue, costs, and project stress testing.',
              )}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-cyan-200">
          {text('Pi فقط · محلي', 'PI ONLY · LOCAL')}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {FIELDS.map(({ key, kind }) => (
            <label key={key} className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">
                {label(key, ar)}
                <span className="ms-1 text-[10px] text-slate-500">
                  {kind === 'pi' ? '(Pi)' : '(%)'}
                </span>
              </span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                value={inputs[key]}
                onChange={(event) => update(key, event.target.value)}
                aria-label={label(key, ar)}
                className="w-full rounded-lg border border-slate-700 bg-[#070B14] px-3 py-2.5 font-mono text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#080D17] px-3 py-2 sm:px-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">
              {text('ملخص الحساب', 'Calculation summary')}
            </h3>
            <span className="text-[10px] text-slate-500">
              {text('تقريب إلى أقرب stroop', 'Rounded to nearest stroop')}
            </span>
          </div>

          {result.ok ? (
            <>
              {Object.entries(RESULT_LABELS).map(([key, names]) => (
                <ResultRow
                  key={key}
                  labelText={names[ar ? 0 : 1]}
                  value={formatPi(result.values[key])}
                  emphasis={key === 'netProfitStroops'}
                />
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-400">{text('هامش الربح', 'Net margin')}</p>
                  <p className="mt-1 font-mono text-lg font-bold text-cyan-200">{formatPercentBps(result.values.marginBps)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-400">{text('هامش اختبار الضغط', 'Stress-test margin')}</p>
                  <p className="mt-1 font-mono text-lg font-bold text-amber-200">{formatPercentBps(result.values.stressedMarginBps)}</p>
                </div>
              </div>
            </>
          ) : (
            <div role="alert" className="rounded-lg border border-rose-400/30 bg-rose-950/20 p-3 text-xs text-rose-200">
              {text(
                'تحقق من المبالغ: استخدم Pi بدقة تصل إلى 7 منازل عشرية، والنسب من 0 إلى 100 بدقتين عشريتين.',
                'Check the inputs: Pi amounts allow up to 7 decimal places; percentages must be 0–100 with up to 2 decimals.',
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.05] p-3 text-[11px] leading-relaxed text-amber-100/80">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          {text(
            'الضريبة نسبة يحددها المستخدم وليست حكماً ضريبياً لدولة بعينها. هذا تقدير تشغيلي فقط؛ لا تُرسل البيانات إلى خادم، ولا تُنفّذ أي دفعة أو معاملة Pi.',
            'The tax rate is user-configured, not a jurisdiction-specific tax determination. This is an operational estimate only; inputs stay in the browser and no Pi payment or transaction is performed.',
          )}
        </p>
      </div>
    </section>
  );
}

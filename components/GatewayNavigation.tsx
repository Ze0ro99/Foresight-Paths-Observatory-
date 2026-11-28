'use client';

import React from 'react';
import { Calculator, Globe, Network, ScanSearch, Shield, Store } from 'lucide-react';
import type { AppLocale } from '@/lib/types';

const GATEWAYS = [
  { id: 'global-intelligence', icon: Globe, label: ['الخريطة الاستخباراتية', 'Intelligence map'] },
  { id: 'cyber-defense', icon: Shield, label: ['الدفاع السيبراني', 'Cyber defense'] },
  { id: 'project-economics', icon: Calculator, label: ['المشاريع والأسواق', 'Projects & markets'] },
  { id: 'agent-marketplace', icon: Store, label: ['سوق الوكلاء', 'Agent marketplace'] },
  { id: 'link-analyzer', icon: ScanSearch, label: ['فحص التطبيقات', 'App analyzer'] },
  { id: 'network-governance', icon: Network, label: ['الشبكة والحوكمة', 'Network & governance'] },
] as const;

export default function GatewayNavigation({ locale }: { locale: AppLocale }) {
  const ar = locale === 'ar';

  return (
    <nav
      aria-label={ar ? 'بوابات المنصة الرئيسية' : 'Main platform gateways'}
      dir={ar ? 'rtl' : 'ltr'}
      className="sticky top-14 z-20 border-b border-white/10 bg-[#090D17]/95 px-3 py-2 backdrop-blur-md md:px-6"
    >
      <div className="mx-auto flex max-w-[1600px] gap-2 overflow-x-auto">
        {GATEWAYS.map(({ id, icon: Icon, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-200" aria-hidden="true" />
            <span>{label[ar ? 0 : 1]}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

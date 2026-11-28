import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import { headers } from 'next/headers';
import { Analytics } from '@vercel/analytics/next';
import PiAppStudioSignIn from '@/components/PiAppStudioSignIn';

export const metadata: Metadata = {
  title: 'مرصد المسارات الاستشرافي — تحليل المخاطر الرقمية وسيناريو الاستقرار العالمي',
  description:
    'منصة بحثية واستشرافية لرسم خرائط المسارات اللحظية، تحليل الخريطتين والمعادلات الرياضية مع باي (π)، رصد التهديدات، وبناء سيناريو الفيلم العالمي الواقعي.',
  openGraph: {
    title: 'مرصد المسارات الاستشرافي — تحليل المخاطر الرقمية وسيناريو الاستقرار العالمي',
    description:
      'منصة بحثية واستشرافية لرسم خرائط المسارات اللحظية وتحليل المخاطر المتسلسلة في البنية التحتية الرقمية.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مرصد المسارات الاستشرافي — تحليل المخاطر الرقمية وسيناريو الاستقرار العالمي',
    description:
      'منصة بحثية واستشرافية لرسم خرائط المسارات اللحظية وتحليل المخاطر المتسلسلة في البنية التحتية الرقمية.',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="ar" dir="rtl">
      <head>
        <Script
          id="pi-browser-sdk"
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
          nonce={nonce}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-[#07070B] text-[#F3F4F6] antialiased selection:bg-[#9333EA]/30 selection:text-white"
      >
        {children}
        <PiAppStudioSignIn />
        <Analytics />
      </body>
    </html>
  );
}

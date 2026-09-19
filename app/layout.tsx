import type { Metadata } from 'next';
import { Noto_Sans, Noto_Serif, Noto_Sans_Malayalam, Noto_Serif_Malayalam } from 'next/font/google';
import './globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});
const notoSerif = Noto_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif',
  display: 'swap',
});
const notoSansMl = Noto_Sans_Malayalam({
  subsets: ['malayalam'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-malayalam',
  display: 'swap',
});
const notoSerifMl = Noto_Serif_Malayalam({
  subsets: ['malayalam'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif-malayalam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Arizon — Smart PDS | Kerala Civil Supplies',
  description:
    'Arizon — AI-powered ration shop stock visibility and anti-leakage platform for Kerala Public Distribution System.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoSerif.variable} ${notoSansMl.variable} ${notoSerifMl.variable}`}
    >
      <body className="page-canvas min-h-screen">{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://philjs.dev'),
  title: {
    default: 'PhilJS - The Modern Web Framework',
    template: '%s | PhilJS',
  },
  description: 'A fast, modern web framework with fine-grained reactivity, TypeScript-first APIs, and optional Rust integration for maximum performance.',
  keywords: ['philjs', 'javascript', 'typescript', 'rust', 'framework', 'signals', 'reactivity', 'wasm'],
  authors: [{ name: 'PhilJS Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://philjs.dev',
    siteName: 'PhilJS',
    title: 'PhilJS - The Modern Web Framework',
    description: 'A fast, modern web framework with fine-grained reactivity and optional Rust integration.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PhilJS Framework',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhilJS - The Modern Web Framework',
    description: 'A fast, modern web framework with fine-grained reactivity and optional Rust integration.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <div className="min-h-screen bg-white dark:bg-surface-950">
            <Header />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

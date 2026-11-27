import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import SiteShell from "./components/SiteShell"
import { ThemeProvider } from "./components/ThemeProvider"

// Self-host Google Fonts' exact Latin slices of Shippori Mincho via next/font/local.
// Using next/font/google triggers a Next.js subset-parsing bug on CJK fonts that
// preloads 360 unused Japanese Kanji .woff2 slices (~10.8 MB) + 489 @font-face rules.
const shipporiMincho = localFont({
  src: "./fonts/shippori-mincho-latin-500.woff2",
  weight: "500",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: "Times New Roman",
  variable: "--font-shippori",
})

// Weight 400 is only used for MDX blockquotes; load on demand without preloading globally.
const shipporiMinchoRegular = localFont({
  src: "./fonts/shippori-mincho-latin-400.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  variable: "--font-shippori-regular",
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
  preload: true,
  variable: "--font-plex-sans",
})

// Italic is only used inside MDX blog prose; avoid preloading 49 KB on /, /about, /blog, /contact.
const ibmPlexSansItalic = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["italic"],
  display: "swap",
  preload: false,
  variable: "--font-plex-sans-italic",
})

// Monospace metadata/code is unused on / and /contact; let routes that render it fetch on demand.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  variable: "--font-plex-mono",
})

// viewport-fit=cover lets the home hero continue under iOS Safari's floating
// toolbar (safe-area insets keep the nav clear of notches / the status bar)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: {
    default: "Mark Peng",
    template: "%s | Mark Peng",
  },
  description: "my personal website playground",
  icons: {
    icon: "/favicon.ico",
  }
}

const jsonLD = {
    "@context": "https://schema.org/",
    "@type": "Person",
    "name": "Mark Peng",
    "alternateName": "Mark P.",
    "url": "https://markpeng.me",
    "image": "",
    "sameAs": [
      "https://linkedin.com/in/markminpeng",
      "https://github.com/notMarkMP1"
    ],
    "jobTitle": "Software Engineer"  
}

// Runs synchronously before first paint to prevent flash of wrong theme (FOUC)
const themeInitScript = `
(function() {
  try {
    var root = document.documentElement;
    var stored = window.localStorage.getItem('nurture-theme');
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLD).replace(/</g, '\\u003c'),
        }}
        />
      </head>
      <body className={`${shipporiMincho.variable} ${shipporiMinchoRegular.variable} ${ibmPlexSans.variable} ${ibmPlexSansItalic.variable} ${ibmPlexMono.variable} font-body flex flex-col min-h-screen antialiased`}>
        <ThemeProvider>
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Shippori_Mincho, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import NavBar from "./components/NavBar"
import Footer from "./components/Footer"
import { ThemeProvider } from "./components/ThemeProvider"

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-shippori",
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-plex-sans",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
})

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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLD).replace(/</g, '\\u003c'),
        }}
        />
      </head>
      <body className={`${shipporiMincho.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} font-body flex flex-col min-h-screen antialiased`}>
        <ThemeProvider>
          <header className="w-full">
            <NavBar />
          </header>
          <main className="flex-grow flex flex-col">
            <div className="flex-grow">
              {children}
            </div>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

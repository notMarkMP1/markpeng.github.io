import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import NavBar from "./components/NavBar"
import Footer from "./components/Footer"
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mark Peng",
  description: "my personal website playground",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <header className="w-full">
          <NavBar />
        </header>
        <main className="flex-grow flex flex-col">
          <div className="flex-grow">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}

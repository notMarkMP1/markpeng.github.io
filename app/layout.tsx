import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import NavBar from "./components/NavBar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Personal Portfolio",
  description: "My personal portfolio website",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="w-full backdrop-blur-sm">
          <NavBar />
        </header>
        <main>
          <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

import { Metadata } from "next";
import Script from 'next/script'
import "./globals.css";

export const metadata: Metadata = {
  title: "for you",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://s.pageclip.co/v1/pageclip.css" media="screen" />
      </head>
      <body>
        <Script src="https://s.pageclip.co/v1/pageclip.js"></Script>

        {children}
      </body>
    </html>
  );
}

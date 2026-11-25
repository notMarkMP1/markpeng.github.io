'use client';

import dynamic from 'next/dynamic';
import HeroBackdrop from '@/app/components/hero/HeroBackdrop';
import HeroOverlay from '@/app/components/hero/HeroOverlay';
import { useSafariChrome } from '@/app/components/hero/safariChrome';

// three.js + both scenes load off the critical path; the CSS backdrop and the
// server-rendered overlay paint immediately while the canvas warms up.
const HeroCanvas = dynamic(() => import('@/app/components/hero/HeroCanvas'), { ssr: false });

export default function Home() {
  // iOS Safari: scene under the floating toolbar + status-bar tint
  useSafariChrome();
  return (
    <>
      <HeroBackdrop />
      <HeroCanvas />
      <HeroOverlay />
    </>
  );
}

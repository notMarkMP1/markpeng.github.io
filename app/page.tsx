'use client';

import dynamic from 'next/dynamic';
import HeroBackdrop from '@/app/components/hero/HeroBackdrop';
import HeroOverlay from '@/app/components/hero/HeroOverlay';

// three.js + both scenes load off the critical path; the CSS backdrop and the
// server-rendered overlay paint immediately while the canvas warms up.
const HeroCanvas = dynamic(() => import('@/app/components/hero/HeroCanvas'), { ssr: false });

export default function Home() {
  return (
    <>
      <HeroBackdrop />
      <HeroCanvas />
      <HeroOverlay />
    </>
  );
}

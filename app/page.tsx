'use client';

import { useSafariChrome } from '@/app/components/hero/safariChrome';

// HeroBackdrop, HeroCanvas, and HeroOverlay are coordinated by SiteShell in
// app/layout.tsx so leaving `/` smoothly animates the hero out and returning to
// `/` reveals the warm WebGL world without a reload flash.
export default function Home() {
  // iOS Safari: scene under the floating toolbar + status-bar tint (active on `/` only)
  useSafariChrome();
  return null;
}

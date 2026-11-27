'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import HeroBackdrop from '@/app/components/hero/HeroBackdrop';
import HeroOverlay from '@/app/components/hero/HeroOverlay';
import { useSafariChrome } from '@/app/components/hero/safariChrome';

// three.js + both hero worlds load only once `/` is visited; direct visitors to
// `/about`, `/blog`, or `/contact` never fetch or initialize WebGL.
const HeroCanvas = dynamic(() => import('@/app/components/hero/HeroCanvas'), { ssr: false });

/** Duration of the feathered canvas veil gliding between `/` and secondary routes. */
const VEIL_DURATION_MS = 460;
/** Duration of HeroOverlay gently drifting out when leaving `/`. */
const OVERLAY_EXIT_MS = 240;

type RouteTransitionKind = 'initial' | 'home-to-page' | 'page-to-home' | 'page-to-page';
type VeilPhase = 'idle' | 'to-page' | 'to-home';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  // iOS Safari 26: status-bar edge tint across all routes + bottom toolbar bleed on `/`
  useSafariChrome(isHome);

  const prevIsHomeRef = useRef<boolean | null>(null);
  const transitionKind: RouteTransitionKind =
    prevIsHomeRef.current === null
      ? 'initial'
      : prevIsHomeRef.current && !isHome
        ? 'home-to-page'
        : !prevIsHomeRef.current && isHome
          ? 'page-to-home'
          : 'page-to-page';

  const [hasVisitedHome, setHasVisitedHome] = useState(isHome);
  const [heroPaused, setHeroPaused] = useState(!isHome);
  const [overlayMounted, setOverlayMounted] = useState(isHome);
  const [overlayVisible, setOverlayVisible] = useState(isHome);
  const [fromHomePath, setFromHomePath] = useState<string | null>(null);
  const [veilPhase, setVeilPhase] = useState<VeilPhase>('idle');

  useEffect(() => {
    const prevIsHome = prevIsHomeRef.current;
    prevIsHomeRef.current = isHome;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isHome) {
      setHasVisitedHome(true);
      setHeroPaused(false);
      setFromHomePath(null);
      setOverlayMounted(true);

      // Returning from a secondary route: glide the veil down and unmount it once
      // finished so no overlay ever lingers over the hero or iOS Safari's toolbar.
      if (prevIsHome === false && !reducedMotion) {
        setVeilPhase('to-home');
        setOverlayVisible(false);
        const enterTimer = window.setTimeout(() => setOverlayVisible(true), 120);
        const clearVeilTimer = window.setTimeout(() => setVeilPhase('idle'), VEIL_DURATION_MS + 40);
        return () => {
          window.clearTimeout(enterTimer);
          window.clearTimeout(clearVeilTimer);
        };
      }

      setVeilPhase('idle');
      setOverlayVisible(true);
      return;
    }

    // Secondary route
    const justLeftHome = prevIsHome === true;
    setFromHomePath(justLeftHome && !reducedMotion ? pathname : null);

    if (!justLeftHome || reducedMotion) {
      setVeilPhase('idle');
      setOverlayVisible(false);
      setOverlayMounted(false);
      setHeroPaused(true);
      return;
    }

    // Leaving `/`: fade/lift HeroOverlay out, sweep the canvas veil up, pause WebGL
    // once covered, then unmount the veil so `body` owns the background natively
    // (letting content flow cleanly behind iOS 26 Safari's floating bottom toolbar).
    setVeilPhase('to-page');
    setOverlayVisible(false);
    const unmountOverlayTimer = window.setTimeout(() => setOverlayMounted(false), OVERLAY_EXIT_MS + 30);
    const pauseHeroTimer = window.setTimeout(() => setHeroPaused(true), VEIL_DURATION_MS + 20);
    const clearVeilTimer = window.setTimeout(() => setVeilPhase('idle'), VEIL_DURATION_MS + 70);

    return () => {
      window.clearTimeout(unmountOverlayTimer);
      window.clearTimeout(pauseHeroTimer);
      window.clearTimeout(clearVeilTimer);
    };
  }, [isHome, pathname]);

  const delaySecondaryEntry = transitionKind === 'home-to-page' || fromHomePath === pathname;
  const showOverlay = isHome || overlayMounted;
  const activeVeil: VeilPhase =
    transitionKind === 'home-to-page'
      ? 'to-page'
      : transitionKind === 'page-to-home'
        ? 'to-home'
        : veilPhase;

  return (
    <>
      {/* Invisible 11px top-edge sampler so iOS 26 Safari tints the status bar
          accurately on both `/` and secondary routes without caching stale colours. */}
      <div aria-hidden="true" data-surface={isHome ? 'hero' : 'page'} className="hero-top-tint" />

      {hasVisitedHome && (
        <>
          <HeroBackdrop active={isHome} paused={heroPaused} />
          <HeroCanvas active={isHome} paused={heroPaused} />
        </>
      )}

      {/* Transient feathered canvas veil: mounted ONLY during `/` <-> secondary
          route transitions, then unmounted so secondary pages have zero fixed
          overlays blocking iOS 26 Safari's translucent floating URL bar. */}
      {activeVeil !== 'idle' && (
        <div
          aria-hidden="true"
          data-phase={activeVeil}
          className="route-veil pointer-events-none fixed inset-0 z-[1] overflow-hidden"
        >
          <div className="route-veil-sheet" />
        </div>
      )}

      <header className="relative z-20 w-full">
        <NavBar />
      </header>

      <main className="relative z-10 flex-grow flex flex-col">
        {showOverlay && (
          <div
            aria-hidden={!isHome}
            data-visible={overlayVisible ? 'true' : 'false'}
            className={`hero-overlay-stage${isHome ? '' : ' pointer-events-none absolute inset-x-0 top-0'}`}
          >
            <HeroOverlay />
          </div>
        )}

        <div
          key={pathname}
          className={`flex-grow${!isHome && delaySecondaryEntry ? ' route-content-from-home' : ''}`}
        >
          {children}
        </div>
      </main>

      <Footer delayEntrance={delaySecondaryEntry} />
    </>
  );
}

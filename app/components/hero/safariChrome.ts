'use client';

import { useEffect, useRef } from 'react';
import { HERO_TRANSITION_MS } from './types';

/*
 * iOS / iPadOS 26 Safari chrome around the hero and secondary routes.
 *
 * Toolbar run-off (`/` only): Safari floats its toolbar over the page and keeps
 * drawing the document underneath it, but only as far as the document reaches,
 * and `100lvh` stops short of the physical screen bottom (58pt on an iPhone 17:
 * the strip held for the minimised toolbar). Below the document Safari shows
 * the page background. So on `/` the hero layers run `--hero-bleed` px past
 * 100lvh, down to the screen bottom. While the hero fits on screen, single-
 * finger panning is held still so that run-off never scrolls into view;
 * pinch-zoom (and panning once zoomed in) still works.
 *
 * Status bar (all routes): Safari 26 tints it from a fixed element touching the
 * top edge, taller than 10px with a solid background colour. `.hero-top-tint`
 * stays mounted across every route (painting nothing itself via background-clip:
 * text) and follows `html[data-safari-tint]` across hero <-> secondary routes
 * and Light <-> Dark toggles, nudging its height for two frames so Safari 26
 * drops its cached edge colour and re-samples cleanly.
 */

let bleedPx = 0;

/** Current bottom run-off of the hero layers below 100lvh, in CSS px (0 off iOS / off `/`). */
export function readHeroBleed() {
  return bleedPx;
}

const MAX_BLEED = 200;
/** When each hero theme sweep crosses the top edge of the sky, as a share of the transition. */
const TINT_DELAY = { light: 0.6, dark: 0.12 } as const;
/** When the rising / retreating route veil crosses the top edge of the screen. */
const ROUTE_TO_PAGE_TINT_DELAY_MS = 260;
const ROUTE_TO_HOME_TINT_DELAY_MS = 120;

type SafariTint = 'hero-light' | 'hero-dark' | 'page-light' | 'page-dark';

function isAppleMobile() {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function useSafariChrome(isHome: boolean) {
  const prevIsHomeRef = useRef<boolean | null>(null);

  // ---- Status-bar tint across all routes & theme toggles --------------------
  useEffect(() => {
    if (!isAppleMobile()) return;
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let tintTimer = 0;
    let refreshFrame = 0;
    const resample = () => {
      // Safari 26 doesn't always recompute a cached edge colour: changing the
      // sampler's size for two frames makes it look again
      cancelAnimationFrame(refreshFrame);
      root.dataset.heroTintRefresh = '';
      refreshFrame = requestAnimationFrame(() => {
        refreshFrame = requestAnimationFrame(() => {
          delete root.dataset.heroTintRefresh;
          refreshFrame = 0;
        });
      });
    };

    const currentTheme = (): 'light' | 'dark' => (root.dataset.theme === 'light' ? 'light' : 'dark');
    const desiredTint = (): SafariTint => {
      const theme = currentTheme();
      const liveHero = isHome && root.dataset.heroFallback !== 'true';
      return liveHero ? (`hero-${theme}` as const) : (`page-${theme}` as const);
    };

    const setTint = (next: SafariTint) => {
      if (root.dataset.safariTint === next) return;
      root.dataset.safariTint = next;
      resample();
    };

    const prevIsHome = prevIsHomeRef.current;
    prevIsHomeRef.current = isHome;

    // Initial mount sets tint immediately; route changes time it to when the
    // feathered veil crosses the top edge so the status bar matches what's below it.
    const nextRouteTint = desiredTint();
    if (prevIsHome === null || prevIsHome === isHome || reducedMotion.matches) {
      setTint(nextRouteTint);
    } else {
      const delay = isHome ? ROUTE_TO_HOME_TINT_DELAY_MS : ROUTE_TO_PAGE_TINT_DELAY_MS;
      tintTimer = window.setTimeout(() => setTint(desiredTint()), delay);
    }

    const observer = new MutationObserver(() => {
      const next = desiredTint();
      window.clearTimeout(tintTimer);
      if (reducedMotion.matches || !isHome || root.dataset.heroFallback === 'true') {
        setTint(next);
      } else {
        tintTimer = window.setTimeout(() => setTint(desiredTint()), HERO_TRANSITION_MS * TINT_DELAY[currentTheme()]);
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-hero-fallback'] });

    const onPageShow = () => resample();
    window.addEventListener('pageshow', onPageShow);

    return () => {
      observer.disconnect();
      window.clearTimeout(tintTimer);
      cancelAnimationFrame(refreshFrame);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [isHome]);

  // ---- Toolbar run-off & scroll hold (`/` only) -----------------------------
  useEffect(() => {
    if (!isHome || !isAppleMobile()) return;
    const root = document.documentElement;

    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:absolute;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);

    let holding = false;
    const hold = (e: TouchEvent) => {
      if (!holding || e.touches.length !== 1 || !e.cancelable) return;
      if ((window.visualViewport?.scale ?? 1) > 1.01) return;
      e.preventDefault();
    };

    const measure = () => {
      const lvh = probe.getBoundingClientRect().height;
      // iOS reports the screen in portrait whatever the orientation. The difference
      // also counts the status bar (unknowable from script), so the run-off
      // overshoots the screen bottom by that much, off-screen and harmless.
      const portrait = window.innerHeight >= window.innerWidth;
      const screenH = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
      const bleed = Math.round(Math.min(MAX_BLEED, Math.max(0, screenH - lvh)));
      // Only while nothing needs scrolling to reach (e.g. not a short landscape view)
      const overlay = document.querySelector('.hero-overlay');
      const contentBottom = overlay ? overlay.getBoundingClientRect().bottom + window.scrollY : Infinity;
      const next = bleed >= 1 && contentBottom <= window.innerHeight + 1 ? bleed : 0;
      holding = next > 0;
      if (next === bleedPx) return;
      bleedPx = next;
      if (next > 0) {
        root.style.setProperty('--hero-bleed', `${next}px`);
        root.dataset.heroBleed = '';
        if (window.scrollY !== 0) window.scrollTo(0, 0);
      } else {
        root.style.removeProperty('--hero-bleed');
        delete root.dataset.heroBleed;
      }
    };

    let measureFrame = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(measureFrame);
      measureFrame = requestAnimationFrame(measure);
    };
    measure();
    scheduleMeasure();
    document.fonts?.ready.then(scheduleMeasure).catch(() => {});
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('touchmove', hold, { passive: false });

    return () => {
      cancelAnimationFrame(measureFrame);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('touchmove', hold);
      probe.remove();
      bleedPx = 0;
      root.style.removeProperty('--hero-bleed');
      delete root.dataset.heroBleed;
    };
  }, [isHome]);
}

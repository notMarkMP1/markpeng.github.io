'use client';

import { useEffect, useLayoutEffect } from 'react';
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
 * and Light <-> Dark toggles, nudging its height so Safari 26 drops its cached
 * edge colour and re-samples cleanly.
 */

let bleedPx = 0;

/** Current bottom run-off of the hero layers below 100lvh, in CSS px (0 off iOS / off `/`). */
export function readHeroBleed() {
  return bleedPx;
}

const MAX_BLEED = 200;
/** Lead-in before telling Safari 26 to re-sample on `/` theme sweeps (accounts for Safari's own ~200-250ms fade). */
const TINT_DELAY = { light: 0.28, dark: 0.04 } as const;

type SafariTint = 'hero-light' | 'hero-dark' | 'page-light' | 'page-dark';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function isAppleMobile() {
  if (typeof navigator === 'undefined') return false;
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

let activeTintTimer = 0;
let activeRefreshFrame = 0;

function resampleTopTint() {
  const root = document.documentElement;
  // Safari 26 doesn't always recompute a cached edge colour: changing the
  // sampler's size for two frames makes it look again
  cancelAnimationFrame(activeRefreshFrame);
  root.dataset.heroTintRefresh = '';
  activeRefreshFrame = requestAnimationFrame(() => {
    activeRefreshFrame = requestAnimationFrame(() => {
      delete root.dataset.heroTintRefresh;
      activeRefreshFrame = 0;
    });
  });
}

function readCurrentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function computeSafariTint(isHome: boolean): SafariTint {
  const theme = readCurrentTheme();
  const liveHero = isHome && document.documentElement.dataset.heroFallback !== 'true';
  return liveHero ? (`hero-${theme}` as const) : (`page-${theme}` as const);
}

function applySafariTint(next: SafariTint) {
  const root = document.documentElement;
  if (root.dataset.safariTint === next) return;
  root.dataset.safariTint = next;
  resampleTopTint();
}

/**
 * Called synchronously on NavBar link tap so iOS 26 Safari starts its native
 * status-bar fade at t=0 rather than waiting for Next.js navigation + post-paint effects.
 */
export function hintSafariRouteTint(nextPath: string) {
  if (!isAppleMobile()) return;
  window.clearTimeout(activeTintTimer);
  applySafariTint(computeSafariTint(nextPath === '/'));
}

export function useSafariChrome(isHome: boolean) {
  // ---- Status-bar tint across all routes & theme toggles --------------------
  useIsomorphicLayoutEffect(() => {
    if (!isAppleMobile()) return;
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    window.clearTimeout(activeTintTimer);
    applySafariTint(computeSafariTint(isHome));

    const observer = new MutationObserver(() => {
      const next = computeSafariTint(isHome);
      window.clearTimeout(activeTintTimer);
      if (reducedMotion.matches || !isHome || root.dataset.heroFallback === 'true') {
        applySafariTint(next);
      } else {
        activeTintTimer = window.setTimeout(
          () => applySafariTint(computeSafariTint(isHome)),
          HERO_TRANSITION_MS * TINT_DELAY[readCurrentTheme()]
        );
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-hero-fallback'] });

    const onPageShow = () => resampleTopTint();
    window.addEventListener('pageshow', onPageShow);

    return () => {
      observer.disconnect();
      window.clearTimeout(activeTintTimer);
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

'use client';

import { useEffect } from 'react';
import { HERO_TRANSITION_MS } from './types';

/*
 * iOS / iPadOS 26 Safari chrome around the hero.
 *
 * Toolbar run-off: Safari floats its toolbar over the page and keeps drawing the
 * document underneath it, but only as far as the document reaches, and `100lvh`
 * stops short of the physical screen bottom (58pt on an iPhone 17: the strip held
 * for the minimised toolbar). Below the document Safari shows the page background.
 * So the hero layers run `--hero-bleed` px past 100lvh, down to the screen bottom.
 * The scenes stay composed for the 100lvh frame; their view simply continues into
 * the foreground below it. While the hero fits on screen, single-finger panning is
 * held still so that run-off never scrolls into view; pinch-zoom (and panning once
 * zoomed in) still works.
 *
 * Status bar: Safari tints it from a fixed element touching the top edge, but only
 * one taller than 10px with a solid background colour. `.hero-top-tint` is that
 * element, painting nothing itself (its background is clipped to text it doesn't
 * have). Its colour follows `html[data-hero-tint]`, switched when the transition
 * sweep actually reaches the top of the sky, then nudged so Safari re-samples it.
 */

let bleedPx = 0;

/** Current bottom run-off of the hero layers below 100lvh, in CSS px (0 off iOS). */
export function readHeroBleed() {
  return bleedPx;
}

const MAX_BLEED = 200;
/** When each sweep crosses the top edge of the sky, as a share of the transition. */
const TINT_DELAY = { light: 0.6, dark: 0.12 } as const;

function isAppleMobile() {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function useSafariChrome() {
  useEffect(() => {
    if (!isAppleMobile()) return;
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ---- Status-bar tint ------------------------------------------------------
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
    const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
    const setTint = (next: 'light' | 'dark') => {
      if (root.dataset.heroTint === next) return;
      root.dataset.heroTint = next;
      resample();
    };
    setTint(theme());
    const themeObserver = new MutationObserver(() => {
      const next = theme();
      window.clearTimeout(tintTimer);
      if (reducedMotion.matches) setTint(next);
      else tintTimer = window.setTimeout(() => setTint(next), HERO_TRANSITION_MS * TINT_DELAY[next]);
    });
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    const onPageShow = () => resample();
    window.addEventListener('pageshow', onPageShow);

    // ---- Toolbar run-off ------------------------------------------------------
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
    document.fonts?.ready.then(scheduleMeasure).catch(() => {});
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('touchmove', hold, { passive: false });

    return () => {
      themeObserver.disconnect();
      window.clearTimeout(tintTimer);
      cancelAnimationFrame(refreshFrame);
      cancelAnimationFrame(measureFrame);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('touchmove', hold);
      probe.remove();
      bleedPx = 0;
      root.style.removeProperty('--hero-bleed');
      delete root.dataset.heroBleed;
      delete root.dataset.heroTint;
      delete root.dataset.heroTintRefresh;
    };
  }, []);
}

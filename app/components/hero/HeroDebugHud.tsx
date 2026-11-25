'use client';

import React, { useEffect, useRef } from 'react';

/** Mutable diagnostics the canvas writes into (no React re-renders per frame). */
export interface HeroDebugInfo {
  /** Rendered frames so far (the compositor increments it). */
  frames: number;
  lines: Record<string, string | number>;
}

export function readHeroDebugFlag(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('herodebug');
  } catch {
    return false;
  }
}

/**
 * Tiny on-device readout for phone QA, shown only with `/?herodebug`: tier, pixel
 * ratio, MSAA samples, colour gamut, renderer and the rendered frame rate.
 */
export default function HeroDebugHud({ info }: { info: HeroDebugInfo }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    // Invisible probe for viewport units and safe-area insets (in CSS px)
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe);
    const unit = (value: string) => {
      probe.style.height = value;
      return Math.round(probe.getBoundingClientRect().height - parseFloat(getComputedStyle(probe).paddingTop) - parseFloat(getComputedStyle(probe).paddingBottom));
    };
    const viewport = () => {
      const cs = getComputedStyle(probe);
      const vv = window.visualViewport;
      const layer = document.querySelectorAll('.hero-layer')[1]?.getBoundingClientRect();
      return {
        view: `inner ${innerWidth}x${innerHeight} vv ${vv ? `${Math.round(vv.height)}+${Math.round(vv.offsetTop)}` : '?'} screen ${screen.width}x${screen.height}`,
        units: `svh ${unit('100svh')} lvh ${unit('100lvh')} dvh ${unit('100dvh')} vh ${unit('100vh')}`,
        safe: `t${parseFloat(cs.paddingTop)} b${parseFloat(cs.paddingBottom)} l${parseFloat(cs.paddingLeft)} r${parseFloat(cs.paddingRight)}`,
        page: `doc ${document.documentElement.scrollHeight} scrollY ${Math.round(scrollY)} layer ${layer ? `${Math.round(layer.top)}+${Math.round(layer.height)}` : '?'}`,
      };
    };

    let lastFrames = info.frames;
    let lastTime = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const fps = ((info.frames - lastFrames) * 1000) / Math.max(now - lastTime, 1);
      lastFrames = info.frames;
      lastTime = now;
      if (ref.current) {
        ref.current.textContent = Object.entries({ ...info.lines, ...viewport(), fps: fps.toFixed(0) })
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      }
    }, 500);
    return () => {
      window.clearInterval(id);
      probe.remove();
    };
  }, [info]);

  return (
    <pre
      ref={ref}
      className="pointer-events-none fixed left-2 top-20 z-50 m-0 max-w-[92vw] whitespace-pre-wrap rounded-md bg-black/70 px-2 py-1.5 font-mono text-[10px] leading-snug text-white"
    />
  );
}

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
    let lastFrames = info.frames;
    let lastTime = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const fps = ((info.frames - lastFrames) * 1000) / Math.max(now - lastTime, 1);
      lastFrames = info.frames;
      lastTime = now;
      if (ref.current) {
        ref.current.textContent = Object.entries({ ...info.lines, fps: fps.toFixed(0) })
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [info]);

  return (
    <pre
      ref={ref}
      className="pointer-events-none fixed left-2 top-20 z-50 m-0 max-w-[92vw] whitespace-pre-wrap rounded-md bg-black/70 px-2 py-1.5 font-mono text-[10px] leading-snug text-white"
    />
  );
}

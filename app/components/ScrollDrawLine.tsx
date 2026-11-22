'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import {
  generateOrganicPath,
  createRandomSeed,
  type ScribbleComposition,
  type ScribbleStyle,
} from '@/app/utils/generateOrganicPath';

interface ScrollDrawLineProps {
  /** Optional deterministic seed. Omit to generate a fresh random scribble on every refresh. */
  seed?: number;
  /** Optional macro silhouette ('auto' picks randomly per seed). */
  composition?: ScribbleComposition;
  /** Stroke personality ('auto' mixes loose/round, crisp, whip, and sharp styles). */
  style?: ScribbleStyle;
  /** Overall tangle density multiplier (default 1.0). */
  density?: number;
}

export default function ScrollDrawLine({
  seed,
  composition = 'auto',
  style = 'auto',
  density = 1.0,
}: ScrollDrawLineProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const animatedProgress = useRef(0);
  const rafId = useRef<number>(0);
  const catchUpStart = useRef(0);
  const prevTarget = useRef(0);
  const [pathLength, setPathLength] = useState(0);
  const [activeSeed, setActiveSeed] = useState<number | null>(seed ?? null);

  // Pick a fresh random seed on client mount when no fixed seed is supplied (hydration-safe)
  useEffect(() => {
    if (seed !== undefined) {
      setActiveSeed(seed);
    } else {
      setActiveSeed(createRandomSeed());
    }
  }, [seed]);

  // Generate path once per active seed
  const pathD = useMemo(() => {
    if (activeSeed === null) return '';
    return generateOrganicPath({ seed: activeSeed, composition, style, density });
  }, [activeSeed, composition, style, density]);

  // Measure path length after render
  useEffect(() => {
    if (!pathD || !pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    setPathLength(len);
    pathRef.current.style.strokeDasharray = `${len}`;
    pathRef.current.style.strokeDashoffset = `${len}`;
  }, [pathD]);

  // Continuous rAF loop with slow-then-fast catch-up
  useEffect(() => {
    if (pathLength === 0 || !pathRef.current) return;

    const path = pathRef.current;

    const animate = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      let targetProgress = 0;
      if (docHeight > 0) {
        targetProgress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
      }

      // Detect new scroll input → reset the ramp timer
      if (Math.abs(targetProgress - prevTarget.current) > 0.003) {
        catchUpStart.current = performance.now();
        prevTarget.current = targetProgress;
      }

      // Slow-then-fast: ramp the lerp factor over time
      const elapsed = performance.now() - catchUpStart.current;
      const t = Math.min(elapsed / 800, 1);
      const factor = 0.008 + t * t * 0.14;

      animatedProgress.current += (targetProgress - animatedProgress.current) * factor;

      if (Math.abs(targetProgress - animatedProgress.current) < 0.0005) {
        animatedProgress.current = targetProgress;
      }

      path.style.strokeDashoffset = `${pathLength * (1 - animatedProgress.current)}`;
      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [pathLength]);

  // Soft horizontal content-column mask: full crispness in the outer gutters,
  // smoothly dissolving to a faint atmospheric whisper behind the centered max-w-2xl text column.
  const contentMask =
    'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) max(0px, calc(50% - 410px)), rgba(0,0,0,0.22) max(0px, calc(50% - 280px)), rgba(0,0,0,0.22) min(100%, calc(50% + 280px)), rgba(0,0,0,1) min(100%, calc(50% + 410px)), rgba(0,0,0,1) 100%)';

  return (
    <div
      className="fixed inset-0 pointer-events-none hidden sm:block"
      style={{
        zIndex: 0,
        maskImage: contentMask,
        WebkitMaskImage: contentMask,
      }}
    >
      <div
        className="absolute"
        style={{
          top: '-5vh',
          left: 0,
          height: '110vh',
          width: 'calc(110vh * 800 / 1200)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 1200"
          className="w-full h-full"
        >
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            strokeWidth="2"
            stroke="white"
            strokeOpacity="0.18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import {
  generateOrganicPath,
  type ScribbleStyle,
} from '@/app/utils/generateOrganicPath';

const STYLES: { value: ScribbleStyle; label: string }[] = [
  { value: 'loose', label: 'Loose' },
  { value: 'crisp', label: 'Crisp' },
  { value: 'whip', label: 'Whip' },
  { value: 'sharp', label: 'Sharp' },
];

export default function ScribblePlayground() {
  const [seed, setSeed] = useState<number>(2021);
  const [style, setStyle] = useState<ScribbleStyle>('crisp');
  const [density, setDensity] = useState<number>(0.85);

  const pathD = useMemo(() => {
    return generateOrganicPath({
      seed,
      composition: 'cascade',
      style,
      density,
    });
  }, [seed, style, density]);

  const handleReroll = () => {
    setSeed((prev) => ((prev * 1664525 + 1013904223) >>> 0) % 99999);
  };

  return (
    <figure className="not-prose my-6 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tracking-wide text-[var(--color-text-primary)]">
            Interactive Stroke Sandbox
          </span>
          <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
            seed #{seed}
          </span>
        </div>

        <button
          type="button"
          onClick={handleReroll}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:border-[var(--color-border-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] cursor-pointer"
        >
          Regenerate
        </button>
      </div>

      <div className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-[var(--color-background)]">
        <svg
          viewBox="0 0 800 1200"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full p-2"
          aria-label={`Generated ${style} scribble curve with seed ${seed}`}
        >
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-primary)"
            strokeOpacity="0.65"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Stroke personality">
          {STYLES.map((item) => {
            const active = style === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setStyle(item.value)}
                aria-pressed={active}
                className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] cursor-pointer"
                style={{
                  backgroundColor: active
                    ? 'var(--color-primary-subtle)'
                    : 'transparent',
                  color: active
                    ? 'var(--color-primary)'
                    : 'var(--color-text-muted)',
                  border: active
                    ? '1px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2.5 text-xs text-[var(--color-text-muted)]">
          <span>Density</span>
          <input
            type="range"
            min={0.5}
            max={1.35}
            step={0.05}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="h-1.5 w-24 cursor-pointer rounded-lg bg-[var(--color-border)]"
            style={{ accentColor: 'var(--color-primary)' }}
          />
          <span className="w-8 text-right font-mono text-[var(--color-text-secondary)]">
            {density.toFixed(2)}
          </span>
        </label>
      </div>

      <figcaption className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
        Powered directly by <code className="font-mono text-[var(--color-text-secondary)]">generateOrganicPath()</code> — switch themes in the top nav to check stroke, surface, and control contrast in both Light and Dark mode.
      </figcaption>
    </figure>
  );
}

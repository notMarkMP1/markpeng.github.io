import type * as THREE from 'three';

export type HeroTheme = 'light' | 'dark';

export interface HeroTap {
  /** Normalized device coordinates (-1..1). */
  x: number;
  y: number;
}

/** Shared pointer / touch state written by window listeners, read by the live scene. */
export interface HeroInput {
  ndc: { x: number; y: number };
  /** Pointer (or a touch) is currently over the viewport. */
  active: boolean;
  touch: boolean;
  taps: HeroTap[];
}

export interface HeroFrameOptions {
  /** False under prefers-reduced-motion: time frozen, no interaction. */
  motion: boolean;
}

/**
 * Imperative scene contract used by the dual-scene compositor.
 * `update` advances time + any FBO physics (it may render into its own targets);
 * the compositor then renders `scene` with `camera` wherever it needs it.
 */
export interface HeroScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  /** Screen-space y (0 = bottom, 1 = top) of the horizon, for the transition sweep. */
  horizonUv(): number;
  resize(width: number, height: number): void;
  update(dt: number, input: HeroInput, options: HeroFrameOptions): void;
  dispose(): void;
}

export function createHeroInput(): HeroInput {
  return { ndc: { x: 0, y: 0 }, active: false, touch: false, taps: [] };
}

export const IDLE_INPUT: HeroInput = Object.freeze({
  ndc: Object.freeze({ x: 0, y: 0 }),
  active: false,
  touch: false,
  taps: Object.freeze([]) as unknown as HeroTap[],
}) as HeroInput;

'use client';

import React, { Component, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  buildQuality,
  detectEnvironment,
  probeRenderer,
  resolveTier,
  type HeroEnvironment,
  type HeroQuality,
  type HeroTier,
} from './capabilities';
import { createCompositePass, HERO_TRANSITION_MS, heroEase, themeToDawn, type CompositorPass } from './compositor';
import { createNightWaterStage } from './NightWaterStage';
import { createNurtureMeadowScene, prepareMeadowFlora, type PreparedMeadowFlora } from './NurtureMeadowScene';
import { createHeroInput, IDLE_INPUT, type HeroInput, type HeroScene, type HeroTheme } from './types';

/*
 * One persistent <Canvas> hosting both hero worlds (hero.md §6):
 *  • Only the active theme's scene is built on mount (fast first paint).
 *  • The inactive scene is built + shader-compiled + warmed on idle, then
 *    fully paused — zero per-frame cost until it is needed.
 *  • At rest exactly one scene renders straight to the default framebuffer.
 *  • On toggle both warm scenes render to two render targets and a single
 *    fullscreen pass dissolves them with a twilight / dawn horizon sweep.
 */

const PREWARM_DELAY_MS = 520;
const TARGET_LINGER_MS = 2400;
/** First-frame fade-in of the canvas over the CSS backdrop. */
const CANVAS_FADE_MS = 900;
/** Startup grace before the frame-time governor may lower the render resolution. */
const GOVERNOR_SETTLE_MS = 4000;
/** Pointer/touch quiet time after which high-refresh displays pace the idle scene. */
const IDLE_PACE_AFTER_MS = 3000;

function readTheme(): HeroTheme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

const noop = () => {};

type IdleHandle = { cancel: () => void };

function scheduleIdle(cb: () => void, delay: number): IdleHandle {
  let idleId: number | null = null;
  const w = window as Window & {
    requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const timer = window.setTimeout(() => {
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(cb, { timeout: 1500 });
    else cb();
  }, delay);
  return {
    cancel() {
      window.clearTimeout(timer);
      if (idleId !== null && w.cancelIdleCallback) w.cancelIdleCallback(idleId);
    },
  };
}

interface CompositorState {
  scenes: Partial<Record<HeroTheme, HeroScene>>;
  ready: Partial<Record<HeroTheme, boolean>>;
  current: HeroTheme;
  from: HeroTheme;
  to: HeroTheme;
  /** Linear transition clock 0..1 (eased in the shader uniform). */
  linear: number;
  direction: -1 | 0 | 1;
  rtFrom: THREE.WebGLRenderTarget | null;
  rtTo: THREE.WebGLRenderTarget | null;
  releaseTargetsAt: number;
  /** Pre-warmed scene still to be drawn once to the real canvas (hidden under the live frame). */
  screenWarm: HeroTheme | null;
  pass: CompositorPass;
  firstFrameSent: boolean;
  disposed: boolean;
}

/** Allocate (or resize) the two full-size transition targets to the drawing buffer. */
function ensureTargets(state: CompositorState, gl: THREE.WebGLRenderer, msaa: boolean) {
  const buffer = gl.getDrawingBufferSize(new THREE.Vector2());
  const w = Math.max(1, Math.floor(buffer.x));
  const h = Math.max(1, Math.floor(buffer.y));
  if (!state.rtFrom || !state.rtTo) {
    const options: THREE.RenderTargetOptions = {
      depthBuffer: true,
      stencilBuffer: false,
      samples: msaa ? 4 : 0,
      generateMipmaps: false,
    };
    state.rtFrom = new THREE.WebGLRenderTarget(w, h, options);
    state.rtTo = new THREE.WebGLRenderTarget(w, h, options);
  } else if (state.rtFrom.width !== w || state.rtFrom.height !== h) {
    state.rtFrom.setSize(w, h);
    state.rtTo.setSize(w, h);
  }
  return { w, h, rtFrom: state.rtFrom, rtTo: state.rtTo };
}

interface CompositorProps {
  quality: HeroQuality;
  themeRef: React.RefObject<HeroTheme>;
  input: HeroInput;
  reducedMotion: boolean;
  onFirstFrame: () => void;
}

function HeroCompositor({ quality, themeRef, input, reducedMotion, onFirstFrame }: CompositorProps) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useThree((s) => s.viewport.dpr);
  const stateRef = useRef<CompositorState | null>(null);
  // Frame-time governor state (see the end of useFrame)
  const governorRef = useRef({ settleUntil: 0, window: 0, slow: 0 });
  // Idle pacing: recent rAF intervals (min ≈ display refresh), skipped-frame carry
  const pacingRef = useRef({ deltas: new Float32Array(32), i: 0, skipped: 0, carry: 0 });
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useEffect(() => {
    const initial = readTheme();
    const state: CompositorState = {
      scenes: {},
      ready: {},
      current: initial,
      from: initial,
      to: initial,
      linear: 0,
      direction: 0,
      rtFrom: null,
      rtTo: null,
      releaseTargetsAt: 0,
      screenWarm: null,
      pass: createCompositePass(),
      firstFrameSent: false,
      disposed: false,
    };
    stateRef.current = state;
    // Ignore shader compilation / warmup frames before judging frame times
    governorRef.current.settleUntil = performance.now() + GOVERNOR_SETTLE_MS;
    const pendingCompiles: Promise<void>[] = [];

    const build = (theme: HeroTheme, flora?: PreparedMeadowFlora): HeroScene => {
      const existing = state.scenes[theme];
      if (existing) return existing;
      const { width, height } = sizeRef.current;
      const created =
        theme === 'light'
          ? createNurtureMeadowScene(gl, quality.meadow, width, height, flora)
          : createNightWaterStage(gl, quality.water, width, height);
      state.scenes[theme] = created;
      return created;
    };

    const compile = (theme: HeroTheme, warm: boolean) => {
      const finish = (target: HeroScene) => {
        if (state.disposed) return;
        if (warm) {
          // One paused warmup frame: steps its FBO physics once, uploads every
          // buffer, and pushes BOTH worlds + the composite pass through the real,
          // full-size transition targets. The driver's first allocation of those
          // multisampled targets (and the pipeline variants that draw into them)
          // stalled the first toggle of every visit by ~70–100 ms; paying it here,
          // at idle, keeps the click instant.
          const { rtFrom, rtTo } = ensureTargets(state, gl, quality.msaa);
          const warmPass = new THREE.WebGLRenderTarget(16, 16, { depthBuffer: false });
          const previous = gl.getRenderTarget();
          target.update(1 / 60, IDLE_INPUT, { motion: true });
          gl.setRenderTarget(rtTo);
          gl.render(target.scene, target.camera);
          const other = state.scenes[theme === 'light' ? 'dark' : 'light'];
          gl.setRenderTarget(rtFrom);
          if (other && state.ready[theme === 'light' ? 'dark' : 'light']) {
            gl.render(other.scene, other.camera);
          }
          state.pass.material.uniforms.tFrom.value = rtFrom.texture;
          state.pass.material.uniforms.tTo.value = rtTo.texture;
          gl.setRenderTarget(warmPass);
          gl.render(state.pass.scene, state.pass.camera);
          gl.setRenderTarget(previous);
          state.pass.material.uniforms.tFrom.value = null;
          state.pass.material.uniforms.tTo.value = null;
          warmPass.dispose();
          state.releaseTargetsAt = performance.now() + TARGET_LINGER_MS;
          state.screenWarm = theme;
        }
        state.ready[theme] = true;
        invalidate();
      };
      const job = async () => {
        // The meadow's grass is planted in idle slices first, so creating the
        // scene is never one long main-thread task
        let flora: PreparedMeadowFlora | undefined;
        if (theme === 'light' && !state.scenes.light) {
          const { width, height } = sizeRef.current;
          flora = await prepareMeadowFlora(quality.meadow, width, height);
          if (state.disposed) return;
        }
        const target = build(theme, flora);
        const programs = [target, ...target.passes].map((p) => gl.compileAsync(p.scene, p.camera));
        await Promise.all(programs).catch(noop);
        finish(target);
      };
      pendingCompiles.push(job().catch(noop));
    };

    // The sweep pass is first used mid-toggle: link it off the main thread up front
    pendingCompiles.push(gl.compileAsync(state.pass.scene, state.pass.camera).then(noop, noop));
    compile(initial, false);
    const prewarm = scheduleIdle(() => {
      if (state.disposed) return;
      compile(initial === 'light' ? 'dark' : 'light', true);
    }, PREWARM_DELAY_MS);

    return () => {
      state.disposed = true;
      prewarm.cancel();
      stateRef.current = null;
      const release = () => {
        state.scenes.light?.dispose();
        state.scenes.dark?.dispose();
        state.rtFrom?.dispose();
        state.rtTo?.dispose();
        state.pass.dispose();
      };
      // three keeps polling program status until compileAsync settles —
      // never delete programs out from under it (e.g. StrictMode remounts).
      if (pendingCompiles.length > 0) Promise.allSettled(pendingCompiles).then(release);
      else release();
    };
  }, [gl, quality, invalidate]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    state.scenes.light?.resize(size.width, size.height);
    state.scenes.dark?.resize(size.width, size.height);
    invalidate();
  }, [size.width, size.height, dpr, invalidate]);

  useFrame((_, delta) => {
    const state = stateRef.current;
    if (!state) return;
    const motion = !reducedMotion;
    const now = performance.now();
    const target = themeRef.current ?? state.current;

    // ---- Theme routing -----------------------------------------------------
    if (state.direction === 0) {
      if (target !== state.current) {
        if (!state.scenes[target]) {
          // Toggled before idle pre-warm finished: build now (rare path)
          const { width, height } = sizeRef.current;
          const created =
            target === 'light'
              ? createNurtureMeadowScene(gl, quality.meadow, width, height)
              : createNightWaterStage(gl, quality.water, width, height);
          state.scenes[target] = created;
          state.ready[target] = true;
        }
        if (motion && state.ready[state.current] && state.ready[target]) {
          state.from = state.current;
          state.to = target;
          state.linear = 0;
          state.direction = 1;
        } else if (state.ready[target]) {
          state.current = target;
        }
      }
    } else if (target === state.to) {
      state.direction = 1;
    } else if (target === state.from) {
      // Rapid re-toggle mid-sweep: reverse smoothly from the current position
      state.direction = -1;
    }

    // ---- Idle pacing -----------------------------------------------------------
    // No pointer/touch for a few seconds and no sweep: high-refresh displays render
    // every 2nd (240 Hz: 3rd) refresh, evenly paced at 60–83 fps. The ambient breeze,
    // clouds and water shimmer move slowly enough to look identical, and the GPU
    // does about half the work while the page just sits open. Any input or toggle
    // returns to the full refresh rate on the very next frame.
    const pacing = pacingRef.current;
    pacing.deltas[pacing.i++ & 31] = delta;
    let vsync = Infinity;
    for (let k = 0; k < 32; k++) {
      const d = pacing.deltas[k];
      if (d > 0 && d < vsync) vsync = d;
    }
    const idle =
      motion &&
      state.direction === 0 &&
      target === state.current &&
      input.taps.length === 0 &&
      now - input.lastActivity > IDLE_PACE_AFTER_MS;
    const every = idle ? Math.min(3, Math.max(1, Math.round(1 / 75 / vsync))) : 1;
    if (every > 1 && ++pacing.skipped < every) {
      pacing.carry += delta;
      return;
    }
    const frameDelta = delta + pacing.carry;
    pacing.skipped = 0;
    pacing.carry = 0;

    if (state.direction !== 0) {
      state.linear += state.direction * ((Math.min(frameDelta, 0.1) * 1000) / HERO_TRANSITION_MS);
      if (state.linear >= 1) {
        state.current = state.to;
        state.direction = 0;
        state.linear = 0;
        state.releaseTargetsAt = now + TARGET_LINGER_MS;
      } else if (state.linear <= 0) {
        state.current = state.from;
        state.direction = 0;
        state.linear = 0;
        state.releaseTargetsAt = now + TARGET_LINGER_MS;
      }
    }

    // ---- Advance only the live scene(s); everything else stays paused -------
    const dt = Math.min(frameDelta, 0.05);
    const options = { motion };
    if (state.direction !== 0) {
      const heading = state.direction === 1 ? state.to : state.from;
      state.scenes[state.from]?.update(dt, heading === state.from ? input : IDLE_INPUT, options);
      state.scenes[state.to]?.update(dt, heading === state.to ? input : IDLE_INPUT, options);
    } else if (state.ready[state.current]) {
      state.scenes[state.current]?.update(dt, input, options);
    }
    input.taps.length = 0;

    // ---- Render --------------------------------------------------------------
    if (state.direction === 0) {
      const live = state.scenes[state.current];
      if (!live || !state.ready[state.current]) return;
      gl.setRenderTarget(null);

      // One-time screen warmup: GPU drivers finish building pipelines lazily on
      // the first draw into each kind of target, so a scene only ever drawn
      // offscreen still stalls (~70–100 ms) the first time it hits the canvas —
      // which made the first light → dark toggle lag. Draw the pre-warmed world and
      // the sweep pass to the canvas once here; the live render below overwrites
      // both before the frame is presented.
      const warmTheme = state.screenWarm;
      if (warmTheme) {
        state.screenWarm = null;
        const warmScene = state.scenes[warmTheme];
        if (warmScene && state.ready[warmTheme] && warmTheme !== state.current) {
          gl.render(warmScene.scene, warmScene.camera);
          if (state.rtFrom && state.rtTo) {
            const uniforms = state.pass.material.uniforms;
            uniforms.tFrom.value = state.rtFrom.texture;
            uniforms.tTo.value = state.rtTo.texture;
            gl.render(state.pass.scene, state.pass.camera);
            uniforms.tFrom.value = null;
            uniforms.tTo.value = null;
          }
        }
      }

      gl.render(live.scene, live.camera);

      if (state.rtFrom && state.releaseTargetsAt && now > state.releaseTargetsAt) {
        state.rtFrom.dispose();
        state.rtTo?.dispose();
        state.rtFrom = null;
        state.rtTo = null;
        state.releaseTargetsAt = 0;
      }
    } else {
      const from = state.scenes[state.from];
      const to = state.scenes[state.to];
      if (!from || !to) return;

      const { w, h, rtFrom, rtTo } = ensureTargets(state, gl, quality.msaa);
      state.releaseTargetsAt = 0;

      gl.setRenderTarget(rtFrom);
      gl.render(from.scene, from.camera);
      gl.setRenderTarget(rtTo);
      gl.render(to.scene, to.camera);
      gl.setRenderTarget(null);

      const uniforms = state.pass.material.uniforms;
      uniforms.tFrom.value = rtFrom.texture;
      uniforms.tTo.value = rtTo.texture;
      uniforms.uProgress.value = heroEase(state.linear);
      uniforms.uDawn.value = themeToDawn(state.to);
      uniforms.uHorizon.value = (state.to === 'light' ? to : from).horizonUv();
      uniforms.uAspect.value = w / h;
      gl.render(state.pass.scene, state.pass.camera);
    }

    if (!state.firstFrameSent) {
      state.firstFrameSent = true;
      onFirstFrame();
    }

    // ---- Frame-time governor -----------------------------------------------------
    // A weaker GPU that can't hold ~42 fps at rest steps the render resolution down
    // a notch at a time (never back up during the visit, so it can't oscillate).
    const governor = governorRef.current;
    // Judged on full-rate frames only: idle-paced intervals are slow on purpose
    if (motion && every === 1 && state.direction === 0 && now > governor.settleUntil && frameDelta < 0.25) {
      governor.window += frameDelta;
      if (frameDelta > 1 / 42) governor.slow += frameDelta;
      if (governor.window >= 2) {
        const currentDpr = gl.getPixelRatio();
        if (governor.slow / governor.window > 0.6 && currentDpr > 1.01) {
          setDpr(Math.max(1, Math.round((currentDpr - 0.25) * 100) / 100));
          governor.settleUntil = now + GOVERNOR_SETTLE_MS / 2;
        }
        governor.window = 0;
        governor.slow = 0;
      }
    }
  }, 1);

  return null;
}

class CanvasErrorBoundary extends Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroCanvas() {
  const [env, setEnv] = useState<HeroEnvironment | null>(null);
  const [tier, setTier] = useState<HeroTier | null>(null);
  const [quality, setQuality] = useState<HeroQuality | null>(null);
  const [visible, setVisible] = useState(false);
  const themeRef = useRef<HeroTheme>('dark');
  const inputRef = useRef<HeroInput>(createHeroInput());
  const invalidateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    themeRef.current = readTheme();
    const detected = detectEnvironment();
    setEnv(detected);
    if (resolveTier(detected, null) === 3) setTier(3);

    // html[data-theme] is the single source of truth (set synchronously on toggle,
    // so the GPU sweep starts on the same frame as the CSS transitions).
    const observer = new MutationObserver(() => {
      themeRef.current = readTheme();
      invalidateRef.current?.();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () =>
      setEnv((prev) => (prev ? { ...prev, reducedMotion: motionQuery.matches } : prev));
    motionQuery.addEventListener('change', onMotionChange);

    // ---- Passive pointer / touch tracking (never preventDefault) -------------
    const input = inputRef.current;
    const setNdc = (cx: number, cy: number) => {
      input.ndc.x = (cx / window.innerWidth) * 2 - 1;
      input.ndc.y = -(cy / window.innerHeight) * 2 + 1;
    };
    const isInteractive = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest('a, button, input, textarea, select, nav, [role="button"]');
    const pushTap = () => {
      input.lastActivity = performance.now();
      if (input.taps.length < 4) input.taps.push({ x: input.ndc.x, y: input.ndc.y });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      setNdc(e.clientX, e.clientY);
      input.active = true;
      input.touch = false;
      input.lastActivity = performance.now();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || isInteractive(e.target)) return;
      setNdc(e.clientX, e.clientY);
      pushTap();
    };
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) input.active = false;
    };
    const onBlur = () => {
      input.active = false;
    };
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || isInteractive(e.target)) return;
      setNdc(touch.clientX, touch.clientY);
      input.touch = true;
      input.active = true;
      pushTap();
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || isInteractive(e.target)) return;
      setNdc(touch.clientX, touch.clientY);
      input.touch = true;
      input.active = true;
      input.lastActivity = performance.now();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) input.active = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('mouseout', onMouseOut, { passive: true });
    window.addEventListener('blur', onBlur);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      observer.disconnect();
      motionQuery.removeEventListener('change', onMotionChange);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Once the opaque canvas has fully faded in, the CSS backdrop underneath is pure
  // overhead: Chrome still re-rasterises its full-screen gradients whenever a theme
  // toggle cross-fades them, which stalled the first toggles by ~100–500 ms.
  // Hide it while the canvas covers it; it comes back for Tier 3 / context loss.
  const [covered, setCovered] = useState(false);
  const fadeMs = env?.reducedMotion ? 0 : CANVAS_FADE_MS;
  useEffect(() => {
    if (!visible || tier === 3) return;
    const timer = window.setTimeout(() => setCovered(true), fadeMs + 50);
    return () => window.clearTimeout(timer);
  }, [visible, tier, fadeMs]);
  useEffect(() => {
    if (!covered || tier === 3) return;
    const root = document.documentElement;
    root.dataset.heroCanvas = 'live';
    return () => {
      delete root.dataset.heroCanvas;
    };
  }, [covered, tier]);

  if (!env || tier === 3) return null;

  const reducedMotion = env.reducedMotion;
  const compact = env.isCompact || env.isTouch;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transition: reducedMotion ? 'none' : `opacity ${CANVAS_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <CanvasErrorBoundary onError={() => setTier(3)}>
        <Canvas
          flat
          linear
          dpr={compact ? [1, 1.25] : [1, 1.75]}
          frameloop={reducedMotion ? 'demand' : 'always'}
          gl={{
            antialias: true,
            alpha: false,
            stencil: false,
            powerPreference: 'high-performance',
          }}
          style={{ width: '100%', height: '100%', display: 'block' }}
          onCreated={({ gl, invalidate }) => {
            invalidateRef.current = invalidate;
            // Shader diagnostics are synchronous GPU round-trips on every program's
            // first use; keep them for development, skip them in production.
            gl.debug.checkShaderErrors = process.env.NODE_ENV !== 'production';
            const probe = probeRenderer(gl);
            const resolved = resolveTier(env, probe);
            if (resolved === 3) {
              setTier(3);
              return;
            }
            gl.domElement.addEventListener(
              'webglcontextlost',
              (event) => {
                event.preventDefault();
                setTier(3);
              },
              { once: true }
            );
            setTier(resolved);
            setQuality(buildQuality(env, resolved));
          }}
        >
          {quality && (
            <HeroCompositor
              quality={quality}
              themeRef={themeRef}
              input={inputRef.current}
              reducedMotion={reducedMotion}
              onFirstFrame={() => setVisible(true)}
            />
          )}
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

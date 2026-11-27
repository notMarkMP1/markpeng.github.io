'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  buildQuality,
  compactMaxDpr,
  detectEnvironment,
  canRenderHero,
  probeRenderer,
  type HeroEnvironment,
} from './capabilities';
import { createCompositePass, HERO_TRANSITION_MS, heroEase, themeToDawn, type CompositorPass } from './compositor';
import { readHeroBleed } from './safariChrome';
import { createHeroInput, IDLE_INPUT, type HeroInput, type HeroScene, type HeroTheme } from './types';

/*
 * One persistent native WebGL2 canvas hosting both hero worlds (hero.md §6):
 *  • Only the active theme's scene chunk is fetched and built on mount (fast first paint).
 *  • The inactive scene chunk is fetched + built + shader-compiled + warmed on idle,
 *    then fully paused — zero per-frame cost until it is needed.
 *  • At rest exactly one scene renders straight to the default framebuffer.
 *  • On toggle both warm scenes render to two render targets and a single
 *    fullscreen pass dissolves them with a twilight / dawn horizon sweep.
 *  • Uses imperative THREE.WebGLRenderer directly (no @react-three/fiber wrapper),
 *    preserving full Three.js tree-shaking and zero reconciler overhead.
 */

const PREWARM_DELAY_MS = 520;
const TARGET_LINGER_MS = 2400;
/** First-frame fade-in of the canvas over the CSS backdrop. */
const CANVAS_FADE_MS = 900;
/** Startup grace before the frame-time governor may lower the render resolution. */
const GOVERNOR_SETTLE_MS = 4000;
/** Pointer/touch quiet time after which high-refresh displays pace the idle scene. */
const IDLE_PACE_AFTER_MS = 3000;

let lightModulePromise: Promise<typeof import('./NurtureMeadowScene')> | null = null;
let darkModulePromise: Promise<typeof import('./NightWaterStage')> | null = null;

function loadLightModule() {
  return (lightModulePromise ??= import('./NurtureMeadowScene'));
}

function loadDarkModule() {
  return (darkModulePromise ??= import('./NightWaterStage'));
}

// Start fetching the active theme's scene chunk in parallel with HeroCanvas mount
if (typeof window !== 'undefined' && window.location.pathname === '/') {
  if (document.documentElement.dataset.theme === 'light') void loadLightModule();
  else void loadDarkModule();
}

/** Bottom run-off below the composed frame (iOS toolbar), never most of the canvas. */
function bleedFor(height: number) {
  return Math.min(readHeroBleed(), Math.floor(height * 0.3));
}

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
  compiling: Partial<Record<HeroTheme, boolean>>;
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

interface HeroCanvasProps {
  active?: boolean;
  paused?: boolean;
}

export default function HeroCanvas({ active = true, paused = false }: HeroCanvasProps) {
  const [env, setEnv] = useState<HeroEnvironment | null>(null);
  // The scene can't run here (no hardware WebGL2) or lost its context: switch to
  // the centered pre-Nurture fallback layout (html[data-hero-fallback="true"])
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);

  const themeRef = useRef<HeroTheme>('dark');
  const inputRef = useRef<HeroInput>(createHeroInput());
  const activeRef = useRef(active);
  activeRef.current = active;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const reducedMotionRef = useRef(false);
  reducedMotionRef.current = env?.reducedMotion ?? false;
  const wasActiveRef = useRef(active);

  const layerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CompositorState | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);
  const syncLoopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    themeRef.current = readTheme();
    const detected = detectEnvironment();
    setEnv(detected);
    if (!canRenderHero(detected, null)) setFailed(true);

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

    return () => {
      observer.disconnect();
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, []);

  // ---- Native Three.js WebGL2 renderer, dual-scene compositor & frame loop ----
  const initReady = !!env && !failed;
  const initialEnvRef = useRef<HeroEnvironment | null>(null);
  if (env && !initialEnvRef.current) initialEnvRef.current = env;

  useEffect(() => {
    const host = layerRef.current;
    const baseEnv = initialEnvRef.current;
    if (!initReady || !host || !baseEnv) return;

    let gl: THREE.WebGLRenderer;
    try {
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      gl = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        stencil: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setFailed(true);
      return;
    }

    // Match R3F's `flat` + `linear` settings exactly so shader output is bit-identical
    THREE.ColorManagement.enabled = true;
    gl.outputColorSpace = THREE.LinearSRGBColorSpace;
    gl.toneMapping = THREE.NoToneMapping;
    // Shader diagnostics are synchronous GPU round-trips on every program's
    // first use; keep them for development, skip them in production.
    gl.debug.checkShaderErrors = process.env.NODE_ENV !== 'production';

    if (!canRenderHero(baseEnv, probeRenderer(gl))) {
      gl.dispose();
      setFailed(true);
      return;
    }

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    gl.domElement.addEventListener('webglcontextlost', onContextLost, { once: true });

    // Wide gamut only where the canvas can really be tagged Display P3;
    // otherwise the shaders keep plain sRGB output (never double-converted)
    let p3Vivid = baseEnv.p3Vivid;
    const ctx = gl.getContext() as WebGL2RenderingContext & { drawingBufferColorSpace?: string };
    if (p3Vivid >= 0) {
      if ('drawingBufferColorSpace' in ctx) ctx.drawingBufferColorSpace = 'display-p3';
      if (ctx.drawingBufferColorSpace !== 'display-p3') p3Vivid = -1;
    }

    const quality = buildQuality({ ...baseEnv, p3Vivid });
    const compact = baseEnv.isCompact || baseEnv.isTouch;
    const maxDpr = compact ? compactMaxDpr(baseEnv) : 1.75;
    let currentDpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), maxDpr);

    const readSize = () => {
      const rect = host.getBoundingClientRect();
      return {
        width: Math.max(1, Math.round(rect.width || window.innerWidth)),
        height: Math.max(1, Math.round(rect.height || window.innerHeight)),
      };
    };

    const size = readSize();
    gl.setPixelRatio(currentDpr);
    gl.setSize(size.width, size.height, false);
    host.appendChild(gl.domElement);

    const initial = readTheme();
    const state: CompositorState = {
      scenes: {},
      ready: {},
      compiling: {},
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

    // Frame-time governor & idle pacing state
    const governor = { settleUntil: performance.now() + GOVERNOR_SETTLE_MS, window: 0, slow: 0 };
    const pacing = { deltas: new Float32Array(32), i: 0, skipped: 0, carry: 0 };
    const pendingCompiles: Promise<void>[] = [];

    let rafId = 0;
    let lastFrameTime = 0;

    const resizeScenes = (w: number, h: number) => {
      const bleed = bleedFor(h);
      state.scenes.light?.resize(w, h, bleed);
      state.scenes.dark?.resize(w, h, bleed);
    };

    const setDpr = (nextDpr: number) => {
      if (state.disposed) return;
      currentDpr = nextDpr;
      gl.setPixelRatio(currentDpr);
      gl.setSize(size.width, size.height, false);
      resizeScenes(size.width, size.height);
      invalidate();
    };

    const compile = (theme: HeroTheme, warm: boolean) => {
      if (state.disposed || state.ready[theme] || state.compiling[theme]) return;
      state.compiling[theme] = true;

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
        state.compiling[theme] = false;
        invalidate();
      };

      const job = async () => {
        let target = state.scenes[theme];
        if (!target) {
          if (theme === 'light') {
            const mod = await loadLightModule();
            if (state.disposed) return;
            // The meadow's grass is planted in idle slices first, so creating the
            // scene is never one long main-thread task
            const flora = await mod.prepareMeadowFlora(
              quality.meadow,
              size.width,
              size.height - bleedFor(size.height)
            );
            if (state.disposed) return;
            const bleed = bleedFor(size.height);
            target = mod.createNurtureMeadowScene(
              gl,
              quality.meadow,
              size.width,
              size.height - bleed,
              flora
            );
            if (bleed > 0) target.resize(size.width, size.height, bleed);
          } else {
            const mod = await loadDarkModule();
            if (state.disposed) return;
            const bleed = bleedFor(size.height);
            target = mod.createNightWaterStage(
              gl,
              quality.water,
              size.width,
              size.height - bleed
            );
            if (bleed > 0) target.resize(size.width, size.height, bleed);
          }
          state.scenes[theme] = target;
        }
        const programs = [target, ...target.passes].map((p) => gl.compileAsync(p.scene, p.camera));
        await Promise.all(programs).catch(noop);
        finish(target);
      };

      pendingCompiles.push(
        job().catch(() => {
          state.compiling[theme] = false;
        })
      );
    };

    const prewarm = scheduleIdle(() => {
      if (state.disposed) return;
      compile(initial === 'light' ? 'dark' : 'light', true);
    }, PREWARM_DELAY_MS);

    const stepFrame = (delta: number) => {
      if (state.disposed || pausedRef.current) return;
      const motion = !reducedMotionRef.current;
      const now = performance.now();
      const input = inputRef.current;
      const target = themeRef.current ?? state.current;

      // ---- Theme routing -----------------------------------------------------
      if (state.direction === 0) {
        if (target !== state.current) {
          if (!state.ready[target]) {
            // Toggled before idle pre-warm finished: kick off load + compile immediately
            prewarm.cancel();
            compile(target, false);
          } else if (motion && state.ready[state.current]) {
            state.from = state.current;
            state.to = target;
            state.linear = 0;
            state.direction = 1;
          } else {
            state.current = target;
          }
        }
      } else if (target === state.to) {
        state.direction = 1;
      } else if (target === state.from) {
        // Rapid re-toggle mid-sweep: reverse smoothly from the current position
        state.direction = -1;
      }

      // ---- Idle pacing -------------------------------------------------------
      // No pointer/touch for a few seconds and no sweep: high-refresh displays render
      // every 2nd (240 Hz: 3rd) refresh, evenly paced at 60–83 fps.
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

      // ---- Advance only the live scene(s); everything else stays paused ------
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

      // ---- Render ------------------------------------------------------------
      if (state.direction === 0) {
        const live = state.scenes[state.current];
        if (!live || !state.ready[state.current]) return;
        gl.setRenderTarget(null);

        // One-time screen warmup: GPU drivers finish building pipelines lazily on
        // the first draw into each kind of target, so draw the pre-warmed world and
        // sweep pass to the canvas once underneath the live frame.
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
        setVisible(true);
      }

      // ---- Frame-time governor -----------------------------------------------
      // A weaker GPU that can't hold ~42 fps at rest steps the render resolution down
      // a notch at a time (never back up during the visit, so it can't oscillate).
      if (motion && every === 1 && state.direction === 0 && now > governor.settleUntil && frameDelta < 0.25) {
        governor.window += frameDelta;
        if (frameDelta > 1 / 42) governor.slow += frameDelta;
        if (governor.window >= 2) {
          const activeDpr = gl.getPixelRatio();
          if (governor.slow / governor.window > 0.6 && activeDpr > 1.01) {
            setDpr(Math.max(1, Math.round((activeDpr - 0.25) * 100) / 100));
            governor.settleUntil = now + GOVERNOR_SETTLE_MS / 2;
          }
          governor.window = 0;
          governor.slow = 0;
        }
      }
    };

    const tick = (now: number) => {
      rafId = 0;
      if (state.disposed || pausedRef.current) return;
      const rawDelta = lastFrameTime > 0 ? (now - lastFrameTime) / 1000 : 1 / 60;
      lastFrameTime = now;
      const delta = rawDelta > 0 && rawDelta < 0.5 ? rawDelta : 1 / 60;
      stepFrame(delta);
      if (!state.disposed && !pausedRef.current && !reducedMotionRef.current) {
        rafId = requestAnimationFrame(tick);
      }
    };

    function invalidate() {
      if (state.disposed || pausedRef.current) return;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    const syncLoop = () => {
      if (state.disposed) return;
      if (pausedRef.current) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        lastFrameTime = 0;
        return;
      }
      if (!reducedMotionRef.current) {
        if (!rafId) {
          lastFrameTime = 0;
          rafId = requestAnimationFrame(tick);
        }
      } else {
        invalidate();
      }
    };

    invalidateRef.current = invalidate;
    syncLoopRef.current = syncLoop;

    const resizeObserver = new ResizeObserver(() => {
      if (state.disposed) return;
      const next = readSize();
      if (next.width === size.width && next.height === size.height) return;
      size.width = next.width;
      size.height = next.height;
      gl.setSize(size.width, size.height, false);
      resizeScenes(size.width, size.height);
      invalidate();
    });
    resizeObserver.observe(host);

    // The sweep pass is first used mid-toggle: link it off the main thread up front
    pendingCompiles.push(gl.compileAsync(state.pass.scene, state.pass.camera).then(noop, noop));
    compile(initial, false);
    syncLoop();

    return () => {
      state.disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      prewarm.cancel();
      gl.domElement.removeEventListener('webglcontextlost', onContextLost);
      gl.domElement.remove();
      stateRef.current = null;
      invalidateRef.current = null;
      syncLoopRef.current = null;

      const release = () => {
        state.scenes.light?.dispose();
        state.scenes.dark?.dispose();
        state.rtFrom?.dispose();
        state.rtTo?.dispose();
        state.pass.dispose();
        gl.dispose();
      };
      // three keeps polling program status until compileAsync settles —
      // never delete programs out from under it (e.g. StrictMode remounts).
      if (pendingCompiles.length > 0) Promise.allSettled(pendingCompiles).then(release);
      else release();
    };
  }, [initReady]);

  // Sync loop state with paused / reducedMotion toggles
  useEffect(() => {
    syncLoopRef.current?.();
  }, [paused, env?.reducedMotion]);

  // When returning to `/` after being away, snap silently to the current theme
  // (in case Light/Dark was toggled on another route) and paint an immediate frame.
  useEffect(() => {
    const wasActive = wasActiveRef.current;
    wasActiveRef.current = active;
    const state = stateRef.current;
    if (!state || !active || wasActive) return;

    const currentTheme = readTheme();
    themeRef.current = currentTheme;
    if (state.current !== currentTheme && state.ready[currentTheme]) {
      state.current = currentTheme;
      state.from = currentTheme;
      state.to = currentTheme;
      state.direction = 0;
      state.linear = 0;
    }
    invalidateRef.current?.();
  }, [active]);

  // ---- Passive pointer / touch tracking (active on `/` only; never preventDefault) ----
  useEffect(() => {
    const input = inputRef.current;
    if (!active) {
      input.active = false;
      input.taps.length = 0;
      return;
    }

    // Relative to the canvas layer itself: on phones it is taller than the visible
    // viewport (it runs on under the browser toolbar)
    const setNdc = (cx: number, cy: number) => {
      const rect = layerRef.current?.getBoundingClientRect();
      const left = rect ? rect.left : 0;
      const top = rect ? rect.top : 0;
      const width = rect && rect.width > 0 ? rect.width : window.innerWidth;
      const height = rect && rect.height > 0 ? rect.height : window.innerHeight;
      input.ndc.x = ((cx - left) / width) * 2 - 1;
      input.ndc.y = -((cy - top) / height) * 2 + 1;
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
      input.active = false;
      input.taps.length = 0;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [active]);

  // Once the opaque canvas has fully faded in, skip painting the initial-paint
  // backdrop underneath it; if the canvas fails or loses its context, switch to
  // the centered pre-Nurture fallback layout (globals.css).
  const [covered, setCovered] = useState(false);
  const fadeMs = env?.reducedMotion ? 0 : CANVAS_FADE_MS;
  useEffect(() => {
    if (!visible || failed) return;
    const timer = window.setTimeout(() => setCovered(true), fadeMs + 50);
    return () => window.clearTimeout(timer);
  }, [visible, failed, fadeMs]);
  useEffect(() => {
    if (!covered || failed) return;
    const root = document.documentElement;
    root.dataset.heroCanvas = 'live';
    return () => {
      delete root.dataset.heroCanvas;
    };
  }, [covered, failed]);
  useEffect(() => {
    if (!failed) return;
    const root = document.documentElement;
    root.dataset.heroFallback = 'true';
    return () => {
      delete root.dataset.heroFallback;
    };
  }, [failed]);

  if (!env || failed) return null;

  const reducedMotion = env.reducedMotion;

  return (
    // .hero-layer: fixed on desktop, in-document on touch so the scene continues
    // under iOS Safari's floating toolbar (see globals.css)
    <div
      ref={layerRef}
      aria-hidden="true"
      className={`hero-layer pointer-events-none z-0 overflow-hidden${active ? '' : ' hero-layer-inactive'}`}
      style={{
        opacity: visible ? 1 : 0,
        visibility: paused ? 'hidden' : 'visible',
        transition: reducedMotion ? 'none' : `opacity ${CANVAS_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    />
  );
}

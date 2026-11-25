import * as THREE from 'three';

/**
 * Hero rendering tiers (hero.md §7):
 *  1 — Real ping-pong FBO physics (water wave PDE + meadow spring field)
 *  2 — Zero-FBO analytical fallbacks (ripple ring buffer + touch-wake array)
 *  3 — No WebGL2 / software renderer → static CSS backdrop only
 */
export type HeroTier = 1 | 2 | 3;

export interface HeroEnvironment {
  isCompact: boolean;
  isTouch: boolean;
  reducedMotion: boolean;
  /** Device looks like a constrained phone GPU (few cores / little memory). */
  constrained: boolean;
  /** Manual QA override via `/?heroTier=1|2|3`. */
  forcedTier: HeroTier | null;
  hasWebGL2Api: boolean;
}

export interface RendererProbe {
  isWebGL2: boolean;
  halfFloatFbo: boolean;
  softwareRenderer: boolean;
  rendererName: string;
}

export interface WaterQuality {
  /** 0 → analytical ripple ring buffer (Tier 2). */
  simRes: number;
  segX: number;
  segZ: number;
  skyOctaves: number;
}

export interface MeadowQuality {
  /** 0 → analytical 6-point touch-wake array (Tier 2). */
  springRes: number;
  tufts: number;
  bladesPerTuft: [number, number];
  filler: number;
  groundCover: number;
  plumes: number;
  flowerPatches: number;
  petals: number;
  pollen: number;
  bladeSegments: number;
  /** Fuller blades on phones so a lighter instance budget still reads lush. */
  widthScale: number;
  /**
   * Planted field spread the counts above are authored for. Wider viewports plant a
   * wider field, so every count scales with the spread to keep the same density.
   */
  densitySpread: number;
}

export interface HeroQuality {
  tier: 1 | 2;
  compact: boolean;
  msaa: boolean;
  water: WaterQuality;
  meadow: MeadowQuality;
}

const SOFTWARE_RENDERER_RE = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i;

export function detectEnvironment(): HeroEnvironment {
  const isCompact = window.innerWidth < 768;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 8;
  const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 8;
  const constrained = isTouch && (cores <= 4 || memory <= 2);

  let forcedTier: HeroTier | null = null;
  try {
    const raw = new URLSearchParams(window.location.search).get('heroTier');
    if (raw === '1' || raw === '2' || raw === '3') forcedTier = Number(raw) as HeroTier;
  } catch {
    // ignore malformed URLs
  }

  return {
    isCompact,
    isTouch,
    reducedMotion,
    constrained,
    forcedTier,
    hasWebGL2Api: typeof window.WebGL2RenderingContext !== 'undefined',
  };
}

/**
 * Live capability probe run once on canvas creation: WebGL2, software-renderer
 * detection, and a real 4×4 HalfFloat + LinearFilter FBO completeness check.
 */
export function probeRenderer(gl: THREE.WebGLRenderer): RendererProbe {
  const ctx = gl.getContext();
  const isWebGL2 =
    typeof WebGL2RenderingContext !== 'undefined' && ctx instanceof WebGL2RenderingContext;

  let rendererName = '';
  try {
    const dbg = ctx.getExtension('WEBGL_debug_renderer_info');
    rendererName = String(
      dbg ? ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER)
    );
  } catch {
    rendererName = '';
  }
  const softwareRenderer = SOFTWARE_RENDERER_RE.test(rendererName);

  let halfFloatFbo = false;
  if (isWebGL2) {
    const hasColorBufferExt =
      !!ctx.getExtension('EXT_color_buffer_float') || !!ctx.getExtension('EXT_color_buffer_half_float');
    if (hasColorBufferExt) {
      const probe = new THREE.WebGLRenderTarget(4, 4, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
      });
      const previous = gl.getRenderTarget();
      try {
        gl.setRenderTarget(probe);
        halfFloatFbo = ctx.checkFramebufferStatus(ctx.FRAMEBUFFER) === ctx.FRAMEBUFFER_COMPLETE;
      } catch {
        halfFloatFbo = false;
      } finally {
        gl.setRenderTarget(previous);
        probe.dispose();
      }
    }
  }

  return { isWebGL2, halfFloatFbo, softwareRenderer, rendererName };
}

export function resolveTier(env: HeroEnvironment, probe: RendererProbe | null): HeroTier {
  if (env.forcedTier) return env.forcedTier;
  if (!env.hasWebGL2Api) return 3;
  if (!probe) return 1;
  if (!probe.isWebGL2 || probe.softwareRenderer) return 3;
  if (!probe.halfFloatFbo || env.constrained) return 2;
  return 1;
}

export function buildQuality(env: HeroEnvironment, tier: 1 | 2): HeroQuality {
  const compact = env.isCompact || (env.isTouch && Math.min(window.innerWidth, window.innerHeight) < 820);
  const fbo = tier === 1;

  if (compact) {
    return {
      tier,
      compact,
      msaa: false,
      water: { simRes: fbo ? 256 : 0, segX: 64, segZ: 48, skyOctaves: 2 },
      meadow: {
        springRes: fbo ? 128 : 0,
        tufts: 340,
        bladesPerTuft: [12, 18],
        filler: 1300,
        groundCover: 800,
        plumes: 96,
        flowerPatches: 20,
        petals: 22,
        pollen: 24,
        bladeSegments: 5,
        widthScale: 1.35,
        // Constrained / no-FBO phones plant ~25% lighter
        densitySpread: fbo ? 0.33 : 0.44,
      },
    };
  }

  return {
    tier,
    compact,
    msaa: true,
    water: { simRes: fbo ? 512 : 0, segX: 160, segZ: 120, skyOctaves: 4 },
    meadow: {
      springRes: fbo ? 256 : 0,
      tufts: 600,
      bladesPerTuft: [15, 23],
      filler: 3000,
      groundCover: 2400,
      plumes: 180,
      flowerPatches: 24,
      petals: 42,
      pollen: 56,
      bladeSegments: 7,
      widthScale: 1.18,
      densitySpread: 0.42,
    },
  };
}

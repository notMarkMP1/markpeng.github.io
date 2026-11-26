import * as THREE from 'three';

export interface HeroEnvironment {
  isCompact: boolean;
  isTouch: boolean;
  reducedMotion: boolean;
  /** Device looks like a constrained phone GPU (few cores / little memory). */
  constrained: boolean;
  hasWebGL2Api: boolean;
  /**
   * Wide-gamut output: -1 = plain sRGB; otherwise the display is Display-P3
   * capable and this is how far colours lean from "exactly as authored" (0)
   * toward the full P3 gamut (1).
   */
  p3Vivid: number;
}

export interface RendererProbe {
  isWebGL2: boolean;
  halfFloatFbo: boolean;
  softwareRenderer: boolean;
  rendererName: string;
}

export interface WaterQuality {
  /** Wave simulation resolution. */
  simRes: number;
  segX: number;
  segZ: number;
  skyOctaves: number;
  /** Wide-gamut output strength (see HeroEnvironment.p3Vivid). */
  p3Vivid: number;
}

export interface MeadowQuality {
  /** Spring-field simulation resolution. */
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
  /** Wide-gamut output strength (see HeroEnvironment.p3Vivid). */
  p3Vivid: number;
}

export interface HeroQuality {
  compact: boolean;
  msaa: boolean;
  water: WaterQuality;
  meadow: MeadowQuality;
}

/** How far wide-gamut displays lean toward the full Display-P3 gamut by default. */
const P3_DEFAULT_VIVID = 0.65;

const SOFTWARE_RENDERER_RE = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i;

export function detectEnvironment(): HeroEnvironment {
  const isCompact = window.innerWidth < 768;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 8;
  const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 8;
  // WebKit clamps hardwareConcurrency on iOS (it reports 2–4 whatever the chip),
  // so on Apple devices the core count says nothing; deviceMemory (Chromium) and
  // the live FBO probe + frame-time governor do the real work there.
  const appleMobile =
    /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const constrained = isTouch && (memory <= 2 || (!appleMobile && cores <= 4));

  const p3Vivid = window.matchMedia('(color-gamut: p3)').matches ? P3_DEFAULT_VIVID : -1;

  return {
    isCompact,
    isTouch,
    reducedMotion,
    constrained,
    hasWebGL2Api: typeof window.WebGL2RenderingContext !== 'undefined',
    p3Vivid,
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

/**
 * Whether the live scene runs here: it needs hardware WebGL2 with half-float render
 * targets for its physics. Anywhere else the hero keeps its flat CSS backdrop.
 * Before the context exists (`probe` null) only the API itself is checked.
 */
export function canRenderHero(env: HeroEnvironment, probe: RendererProbe | null): boolean {
  if (!env.hasWebGL2Api) return false;
  if (!probe) return true;
  return probe.isWebGL2 && !probe.softwareRenderer && probe.halfFloatFbo;
}

/** Max render pixel ratio for phones: capable ones go sharp, constrained ones stay light. */
export function compactMaxDpr(env: HeroEnvironment) {
  return env.constrained ? 1.5 : 2;
}

export function buildQuality(env: HeroEnvironment): HeroQuality {
  const compact = env.isCompact || (env.isTouch && Math.min(window.innerWidth, window.innerHeight) < 820);
  const p3Vivid = env.p3Vivid;

  if (compact) {
    // Capable phones (any modern iPhone, mid/high Android) get desktop-grade water
    // physics and detail at a sharper pixel ratio; the frame-time governor still
    // steps the resolution down on a phone that can't keep up.
    const capable = !env.constrained;
    return {
      compact,
      msaa: capable,
      water: capable
        ? { simRes: 512, segX: 128, segZ: 96, skyOctaves: 4, p3Vivid }
        : { simRes: 256, segX: 64, segZ: 48, skyOctaves: 2, p3Vivid },
      meadow: {
        springRes: capable ? 256 : 128,
        tufts: 340,
        bladesPerTuft: [12, 18],
        filler: 1300,
        groundCover: 800,
        plumes: 96,
        flowerPatches: 20,
        petals: 22,
        pollen: 24,
        bladeSegments: capable ? 6 : 5,
        widthScale: 1.35,
        // Constrained phones plant ~25% lighter
        densitySpread: capable ? 0.33 : 0.44,
        p3Vivid,
      },
    };
  }

  return {
    compact,
    msaa: true,
    water: { simRes: 512, segX: 160, segZ: 120, skyOctaves: 4, p3Vivid },
    meadow: {
      springRes: 256,
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
      p3Vivid,
    },
  };
}

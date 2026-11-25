import * as THREE from 'three';
import type { MeadowQuality } from './capabilities';
import { GAMUT_GLSL, gamutDefines } from './gamut';
import { applyBleed, applyFraming, canvasY, type CameraFraming, type FramingResult } from './framing';
import type { HeroFrameOptions, HeroInput, HeroScene } from './types';

/*
 * Light Mode — "Nurture" daylight sky + painterly botanical meadow (hero.md §5).
 *
 * Preserved from prototype 0d587a4: the cerulean sky + cumulus shader, the
 * prototype palette, the slightly-damp 256² spring-physics FBO, the calm v5
 * breeze and the rock-steady grounded camera.
 *
 * New: organic tuft clumping with FBM density pockets + canopy billows, S-curved
 * twisted blades with rounded cross-blade normals, foxtail seed plumes, clustered
 * buttercup / daisy patches, low ground-cover leaves, drifting cloud shadows that
 * share the sky's cloud FBM, macro warm-knoll / cool-hollow colour, backlit
 * subsurface glow, feathered foreground blades and brush-kicked pollen.
 */

// Spring-physics field bounds (world units) — preserved from the prototype
const FIELD_MIN_X = -14.0;
const FIELD_MAX_X = 14.0;
const FIELD_WIDTH = FIELD_MAX_X - FIELD_MIN_X;
const FIELD_MIN_Z = -13.0;
const FIELD_MAX_Z = 6.0;
const FIELD_DEPTH = FIELD_MAX_Z - FIELD_MIN_Z;

const WAKE_SLOTS = 6;
const STILL_TIME = 14.0;
/** Screen-space horizon of the validated prototype camera — sky layout is authored against it. */
const REFERENCE_HORIZON_UV = 0.5116;

const FRAMING: CameraFraming = {
  position: [0, 1.62, 6.2],
  look: [0, 2.05, -4.5],
  fov: 44,
  portraitFov: 58,
  portraitHorizonNdc: -0.18,
};

const SUN_DIR = new THREE.Vector3(0.3, 0.5, -0.81).normalize();

// ---------------------------------------------------------------------------
// CPU helpers
// ---------------------------------------------------------------------------
function terrainHeight(x: number, z: number): number {
  const broadHill =
    Math.sin(x * 0.21 + 0.55) * 0.26 + Math.cos(x * 0.11 - 0.3) * 0.2 + Math.cos(z * 0.26 + x * 0.08) * 0.13;
  const ridge = Math.max(0, -z - 1.5) * 0.062;
  return broadHill + ridge - 0.15;
}

function terrainBroad(x: number, z: number): number {
  return Math.sin(x * 0.21 + 0.55) * 0.26 + Math.cos(x * 0.11 - 0.3) * 0.2 + Math.cos(z * 0.26 + x * 0.08) * 0.13;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number, seed: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm2(x: number, y: number, seed: number, octaves = 3) {
  let v = 0;
  let amp = 0.5;
  let norm = 0;
  let px = x;
  let py = y;
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise(px, py, seed + i * 17);
    norm += amp;
    const nx = px * 1.6 - py * 1.2;
    py = px * 1.2 + py * 1.6;
    px = nx;
    amp *= 0.5;
  }
  return v / norm;
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Near-lens blades stay modest so stray stalks never stab up through the headline. */
function nearCameraFactor(z: number) {
  return z > 1.8 ? Math.max(0.56, 1 - (z - 1.8) * 0.14) : 1.0;
}

function canopyBillow(x: number, z: number) {
  return 0.8 + fbm2(x * 0.085 + 40.0, z * 0.085 - 7.0, 11) * 0.42;
}

// Accurate curved-hill raycast so the brush lands right where the pointer is
function intersectMeadowTerrain(ray: THREE.Ray, out: THREE.Vector3): boolean {
  if (ray.direction.y >= -0.015) return false;
  let t = (0.42 - ray.origin.y) / ray.direction.y;
  if (t <= 0.1 || t > 26) return false;
  for (let i = 0; i < 4; i++) {
    ray.at(t, out);
    const err = out.y - (terrainHeight(out.x, out.z) + 0.42);
    t -= err / ray.direction.y;
    if (t <= 0.1 || t > 26) return false;
  }
  ray.at(t, out);
  return (
    out.x >= FIELD_MIN_X + 0.5 &&
    out.x <= FIELD_MAX_X - 0.5 &&
    out.z >= FIELD_MIN_Z + 0.5 &&
    out.z <= FIELD_MAX_Z - 0.5
  );
}

// ---------------------------------------------------------------------------
// Shared GLSL
// ---------------------------------------------------------------------------

// Same sin-hash value noise as the validated sky so cloud shadows share its FBM
const NOISE_GLSL = /* glsl */ `
  float hashS(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noiseS(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hashS(i + vec2(0.0, 0.0)), hashS(i + vec2(1.0, 0.0)), u.x),
      mix(hashS(i + vec2(0.0, 1.0)), hashS(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbmS(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noiseS(p);
      p = rot * p * 2.02 + vec2(17.1, 31.7);
      a *= 0.5;
    }
    return v;
  }

  // 3-octave variant normalised to ~[0,1] for terrain-scale maps
  float fbmS3(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 3; i++) {
      v += a * noiseS(p);
      p = rot * p * 2.02 + vec2(17.1, 31.7);
      a *= 0.5;
    }
    return v / 0.875;
  }
`;

const FIELD_GLSL = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunDir;

  float terrainBroad(vec2 p) {
    return sin(p.x * 0.21 + 0.55) * 0.26 + cos(p.x * 0.11 - 0.3) * 0.2 + cos(p.y * 0.26 + p.x * 0.08) * 0.13;
  }

  // 0 = cool emerald-teal hollow, 1 = warm golden-olive sunlit knoll
  float macroWarmth(vec2 xz) {
    float knoll = smoothstep(-0.32, 0.42, terrainBroad(xz));
    float n = smoothstep(0.28, 0.72, fbmS3(xz * 0.07 + vec2(11.3, 4.1)));
    return clamp(knoll * 0.55 + n * 0.45, 0.0, 1.0);
  }

  // Ground projection of the sky's drifting cloud FBM (1 = under cloud shadow).
  // Same noise, same drift clock and direction as the cumulus layer above.
  float cloudShadowMask(vec2 xz, float t) {
    float drift = t * 0.010;
    vec2 p = xz * vec2(0.15, 0.2) - vec2(drift * 4.0, -drift * 0.6) + vec2(3.7, 1.3);
    float n = fbmS3(p) * 0.8 + noiseS(p * 3.1 + 7.0) * 0.2;
    return smoothstep(0.5, 0.6, n);
  }

  // Calm v5 meadow breeze
  float windWave(vec2 p, float t) {
    float w1 = sin(p.x * 0.28 + p.y * 0.20 + t * 0.66);
    float w2 = sin(p.x * 0.56 - p.y * 0.38 + t * 0.96) * 0.30;
    float gust = sin(p.x * 0.13 + p.y * 0.11 + t * 0.32) * 0.60;
    return (w1 + w2 + gust) * 0.36;
  }

  vec3 applyMeadowHaze(vec3 col, float dist) {
    float haze = smoothstep(9.5, 23.0, dist);
    return mix(col, vec3(0.6, 0.8, 0.8), haze * 0.42);
  }
`;

// Spring field sampling (Tier 1 FBO) or 6-point analytical touch wakes (Tier 2)
const BEND_GLSL = /* glsl */ `
  uniform sampler2D uSpringField;
  uniform vec2 uFieldMin;
  uniform vec2 uFieldSize;
  uniform vec4 uWakes[${WAKE_SLOTS}];

  vec2 springAt(vec2 xz) {
  #ifdef USE_SPRING_FBO
    vec2 fieldUv = (xz - uFieldMin) / uFieldSize;
    vec2 inside = step(vec2(0.0), fieldUv) * step(fieldUv, vec2(1.0));
    return texture2D(uSpringField, clamp(fieldUv, 0.0, 1.0)).xy * (inside.x * inside.y);
  #else
    vec2 disp = vec2(0.0);
    for (int i = 0; i < ${WAKE_SLOTS}; i++) {
      vec4 w = uWakes[i];
      if (w.w > 0.001) {
        vec2 d = xz - w.xy;
        float r2 = dot(d, d);
        float age = max(uTime - w.z, 0.0);
        float env = (1.0 - exp(-age * 9.0)) * exp(-age * 1.55);
        float osc = cos(age * 3.4);
        disp += (d * inversesqrt(r2 + 0.0004)) * exp(-r2 / 0.9) * env * osc * w.w;
      }
    }
    return disp;
  #endif
  }

  vec2 breezeOffset(vec2 rootXZ, float phase, float t, out float windAmt) {
    float w = windWave(rootXZ, t);
    windAmt = w;
    float flutter = sin(t * 1.45 + phase) * 0.012;
    return vec2(w * 0.135 + flutter, w * 0.055 - flutter * 0.35);
  }
`;

// ---------------------------------------------------------------------------
// 1. Slightly-damp spring-physics field (preserved from prototype)
// ---------------------------------------------------------------------------
const simVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const springSimFragmentShader = /* glsl */ `
  uniform sampler2D uPrevState;
  uniform vec2 uResolution;
  uniform float uDt;
  uniform vec2 uFieldSize;
  uniform vec2 uPrevMouse;
  uniform vec2 uCurrMouse;
  uniform vec2 uMouseVel;
  uniform float uMouseActive;
  uniform float uReset;

  varying vec2 vUv;

  vec2 closestPointOnSegment(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    float lenSq = dot(ab, ab);
    if (lenSq < 1e-6) return a;
    float t = clamp(dot(p - a, ab) / lenSq, 0.0, 1.0);
    return a + ab * t;
  }

  void main() {
    if (uReset > 0.5) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec2 texel = 1.0 / uResolution;
    vec4 state = texture2D(uPrevState, vUv);
    vec2 disp = state.xy;
    vec2 vel = state.zw;

    vec2 dL = texture2D(uPrevState, vUv - vec2(texel.x, 0.0)).xy;
    vec2 dR = texture2D(uPrevState, vUv + vec2(texel.x, 0.0)).xy;
    vec2 dD = texture2D(uPrevState, vUv - vec2(0.0, texel.y)).xy;
    vec2 dU = texture2D(uPrevState, vUv + vec2(0.0, texel.y)).xy;
    vec2 laplacian = (dL + dR + dD + dU) * 0.25 - disp;

    float stiffness = 6.4;
    float damping = 3.05;
    float coupling = 11.5;

    // Nonlinear clinging resistance — damp grass lingers before lifting
    float bendMag = length(disp);
    float dampHold = 1.0 / (1.0 + bendMag * 0.42);
    vec2 accel = -stiffness * dampHold * disp - damping * vel + coupling * laplacian;

    // Continuous swept capsule hand-brush
    if (uMouseActive > 0.5) {
      vec2 worldP = vUv * uFieldSize;
      vec2 closest = closestPointOnSegment(worldP, uPrevMouse, uCurrMouse);
      vec2 toPoint = worldP - closest;
      float dist = length(toPoint);

      float speed = length(uMouseVel);
      float radius = mix(0.82, 1.35, clamp(speed * 0.14, 0.0, 1.0));
      float falloff = exp(-(dist * dist) / (radius * radius));

      if (falloff > 0.002) {
        vec2 radialDir = dist > 0.001 ? (toPoint / dist) : vec2(0.0, 1.0);
        vec2 sweepForce = uMouseVel * 2.85;
        float partStrength = mix(2.2, 6.2, clamp(speed * 0.18, 0.0, 1.0));
        vec2 partForce = radialDir * partStrength;
        accel += (sweepForce + partForce - vel * 0.55) * falloff;
      }
    }

    vel += accel * uDt;
    disp += vel * uDt;

    float edge =
      smoothstep(0.0, 0.035, vUv.x) * smoothstep(0.0, 0.035, 1.0 - vUv.x) *
      smoothstep(0.0, 0.035, vUv.y) * smoothstep(0.0, 0.035, 1.0 - vUv.y);
    disp *= edge;
    vel *= edge;

    // GLSL ES 1.00-safe rational saturation
    float dLen = length(disp);
    if (dLen > 0.001) {
      float maxDisp = 1.65;
      disp = (disp / dLen) * (dLen / (1.0 + dLen / maxDisp));
    }
    vel = clamp(vel, vec2(-5.5), vec2(5.5));

    gl_FragColor = vec4(disp, vel);
  }
`;

// ---------------------------------------------------------------------------
// 2. Painterly daylight sky + cumulus banks (preserved from prototype)
// ---------------------------------------------------------------------------
const skyVertexShader = /* glsl */ `
  // Canvas uv -> composed-frame uv (scale, offset): (1, 0) unless the canvas runs on
  // below the frame (iOS toolbar run-off), where the sky keeps its exact placement
  uniform vec2 uFrameY;
  varying vec2 vUv;
  void main() {
    vUv = vec2(uv.x, uv.y * uFrameY.x + uFrameY.y);
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  ${GAMUT_GLSL}

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uHorizonShift;
  uniform float uCloudScale;

  varying vec2 vUv;

  ${NOISE_GLSL}

  float cloudPuff(vec2 p, vec2 center, vec2 radii, float fbmNoise, float detail) {
    vec2 q = (p - center) / (radii * uCloudScale);
    float d = length(q) - 1.0 + (fbmNoise - 0.5) * detail;
    return (1.0 - smoothstep(-0.22, 0.18, d));
  }

  // Cumulus banks + drifting wisps. Noise only ever widens a puff by up to
  // detail/2, so cumulus(cp, t, 0.0) == 0 proves no cloud can reach this pixel.
  float cumulus(vec2 cp, float aspect, float t, float nCloud) {
    // Right-side billowing cumulus bank
    float cRight = 0.0;
    cRight = max(cRight, cloudPuff(cp, vec2(aspect * 0.49, 0.43), vec2(0.42, 0.23), nCloud, 0.55));
    cRight = max(cRight, cloudPuff(cp, vec2(aspect * 0.43, 0.56), vec2(0.28, 0.19), nCloud, 0.62));
    cRight = max(cRight, cloudPuff(cp, vec2(aspect * 0.32, 0.36), vec2(0.26, 0.14), nCloud, 0.58));
    cRight = max(cRight, cloudPuff(cp, vec2(aspect * 0.54, 0.67), vec2(0.24, 0.16), nCloud, 0.52));

    // Left-side softer lower horizon clouds
    float cLeft = 0.0;
    cLeft = max(cLeft, cloudPuff(cp, vec2(-aspect * 0.48, 0.41), vec2(0.32, 0.16), nCloud, 0.58));
    cLeft = max(cLeft, cloudPuff(cp, vec2(-aspect * 0.31, 0.34), vec2(0.22, 0.11), nCloud, 0.52));
    cLeft = max(cLeft, cloudPuff(cp, vec2(-aspect * 0.52, 0.51), vec2(0.20, 0.12), nCloud, 0.56));

    // Calm slow-drifting upper wisps
    float driftX = mod(t * 0.015 + 1.2, 3.6) - 1.8;
    float cDrift1 = cloudPuff(cp, vec2(driftX, 0.69), vec2(0.36, 0.085), nCloud, 0.72) * 0.40;
    float driftX2 = mod(t * 0.010 + 2.9, 3.6) - 1.8;
    float cDrift2 = cloudPuff(cp, vec2(driftX2, 0.82), vec2(0.28, 0.065), nCloud, 0.75) * 0.28;

    return max(max(cRight, cLeft), max(cDrift1, cDrift2));
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vec2(vUv.x, vUv.y - uHorizonShift);
    float t = uTime;

    // Cerulean zenith -> sky blue -> pastel aqua -> luminous horizon
    vec3 zenithCol = vec3(0.305, 0.565, 0.885);   // #4e90e2
    vec3 midSkyCol = vec3(0.445, 0.715, 0.940);   // #71b6f0
    vec3 lowSkyCol = vec3(0.670, 0.872, 0.965);   // #abdef6
    vec3 horizonCol = vec3(0.845, 0.945, 0.972);  // #d7f1f8

    float skyT = clamp((uv.y - 0.24) / 0.76, 0.0, 1.0);
    vec3 sky = mix(horizonCol, lowSkyCol, smoothstep(0.0, 0.28, skyT));
    sky = mix(sky, midSkyCol, smoothstep(0.22, 0.65, skyT));
    sky = mix(sky, zenithCol, smoothstep(0.58, 1.0, skyT));

    // Warm sunlit breath above the centre ridge
    vec2 sunPos = vec2(0.50, 0.34);
    vec2 sunDiff = (uv - sunPos) * vec2(aspect * 0.74, 1.18);
    float sunGlow = exp(-dot(sunDiff, sunDiff) * 4.2);
    sky += vec3(0.14, 0.18, 0.14) * sunGlow * 0.55;

    vec2 cp = vec2((uv.x - 0.5) * aspect, uv.y);
    vec3 finalSky = sky;

    // Open sky (no puff can reach it, above the low horizon band) skips all cloud
    // noise; the result there is exactly the clear-sky gradient either way.
    if (uv.y < 0.44 || cumulus(cp, aspect, t, 0.0) > 0.0) {
      float drift = t * 0.010;
      float nLarge = fbmS(cp * 2.1 - vec2(drift * 1.4, 0.0));
      float nFine = fbmS(cp * 4.8 - vec2(drift * 2.2, 0.4));
      float nCloud = nLarge * 0.68 + nFine * 0.32;

      float lowBand = (1.0 - smoothstep(0.28, 0.44, uv.y)) * smoothstep(0.38, 0.72, nLarge) * 0.38;
      float cloudAlpha = clamp(cumulus(cp, aspect, t, nCloud) + lowBand * 0.32, 0.0, 1.0);

      float shadeSample = fbmS((cp + vec2(0.0, 0.06)) * 2.4 - vec2(drift * 1.4, 0.0));
      float topLight = smoothstep(0.30, 0.68, uv.y) * 0.45 + (1.0 - shadeSample) * 0.55;
      vec3 cloudShadow = vec3(0.765, 0.865, 0.950);
      vec3 cloudLit = vec3(0.992, 0.996, 0.988);
      vec3 cloudCol = mix(cloudShadow, cloudLit, clamp(topLight, 0.0, 1.0));

      float rim = smoothstep(0.15, 0.55, cloudAlpha) * (1.0 - smoothstep(0.55, 0.95, cloudAlpha));
      cloudCol += vec3(0.035, 0.045, 0.04) * rim;

      finalSky = mix(sky, cloudCol, cloudAlpha * 0.94);
    }
    finalSky += (hashS(gl_FragCoord.xy + fract(t) * 31.0) - 0.5) / 255.0;
    gl_FragColor = vec4(outputGamut(finalSky), 1.0);
  }
`;

// ---------------------------------------------------------------------------
// 3. Hillside floor — dark under-canopy roots → distant sunlit meadow mass
// ---------------------------------------------------------------------------
const groundVertexShader = /* glsl */ `
  varying vec3 vWorld;
  varying float vDist;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vDist = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const groundFragmentShader = /* glsl */ `
  ${GAMUT_GLSL}

  varying vec3 vWorld;
  varying float vDist;

  ${NOISE_GLSL}
  ${FIELD_GLSL}

  void main() {
    vec2 xz = vWorld.xz;
    float n = fbmS3(xz * vec2(0.55, 1.6));
    float streak = noiseS(xz * vec2(2.4, 9.0));
    float macro = macroWarmth(xz);

    // Under the canopy: deep damp root shade
    vec3 under = mix(vec3(0.1, 0.235, 0.12), vec3(0.18, 0.37, 0.18), n * 0.8 + streak * 0.2);
    // Far away the floor stands in for the sub-pixel canopy mass
    vec3 far = mix(vec3(0.27, 0.50, 0.22), vec3(0.47, 0.66, 0.29), n * 0.65 + streak * 0.35);
    vec3 col = mix(under, far, smoothstep(8.0, 18.5, vDist));

    vec3 warm = col * vec3(1.15, 1.05, 0.72) + vec3(0.03, 0.018, 0.0);
    vec3 cool = col * vec3(0.8, 0.97, 1.08) + vec3(0.0, 0.004, 0.012);
    col = mix(cool, warm, macro);

    float shadow = cloudShadowMask(xz, uTime);
    col *= mix(vec3(1.0), vec3(0.78, 0.84, 0.92), shadow);

    col = applyMeadowHaze(col, vDist);
    col += (hashS(gl_FragCoord.xy + 3.1) - 0.5) / 255.0;
    gl_FragColor = vec4(outputGamut(col), 1.0);
  }
`;

// ---------------------------------------------------------------------------
// 4. Clumped botanical grass (meadow blades, filler blades, ground-cover leaves)
// ---------------------------------------------------------------------------
const grassVertexShader = /* glsl */ `
  attribute vec4 aRoot;   // xyz root, w species (0 tuft blade, 1 filler, 2 ground-cover leaf)
  attribute vec4 aShape;  // x height, y width, z lean, w S-curve
  attribute vec4 aDir;    // xy lean direction, z phase, w twist
  attribute vec4 aTint;   // x shade, y dryness, z tuft hue, w unused

  varying vec3 vWorld;
  varying vec3 vN;
  varying vec3 vW;
  varying vec4 vData;     // x across(-1..1), y height, z cloud sun visibility, w near-lens feather
  varying vec3 vAlbedo;
  varying vec4 vFx;       // x bend magnitude, y bend toward sun, z wind, w distance
  varying float vGust;    // breeze-sheen band phase (0..1), smooth over a blade

  ${NOISE_GLSL}
  ${FIELD_GLSL}
  ${BEND_GLSL}

  vec3 bladeCenter(float hh, vec3 root, float H, vec2 ld, float lean, float sC, vec2 dynW, vec2 dynS, float drop) {
    float prof = lean * hh * hh - sC * hh * (1.0 - hh) * 0.9;
    vec2 off = ld * (H * prof) + dynW * pow(hh, 1.55) + dynS * pow(hh, 1.28);
    return root + vec3(off.x, H * hh - drop * pow(hh, 1.15), off.y);
  }

  void main() {
    float h = uv.y;
    float species = aRoot.w;
    vec3 root = aRoot.xyz;
    float H = aShape.x;
    float bw = aShape.y;
    float lean = aShape.z;
    float sC = aShape.w;
    vec2 ld = aDir.xy;
    float t = uTime;

    float windAmt;
    float windResp = species > 1.5 ? 0.3 : (species > 0.5 ? 0.8 : 1.0);
    vec2 dynW = breezeOffset(root.xz, aDir.z, t, windAmt) * windResp;
    vec2 spring = springAt(root.xz);
    vec2 dynS = spring * (0.94 * H) * (species > 1.5 ? 0.6 : 1.0);

    // Physical arc-length compression: bent blades bow down instead of stretching
    vec2 tipOff = ld * (H * lean) + dynW + dynS;
    float drop = min(H * 0.64, dot(tipOff, tipOff) / max(H * 1.28, 0.4));

    vec3 c0 = bladeCenter(h, root, H, ld, lean, sC, dynW, dynS, drop);
    vec3 cA = bladeCenter(min(h + 0.04, 1.0), root, H, ld, lean, sC, dynW, dynS, drop);
    vec3 cB = bladeCenter(max(h - 0.04, 0.0), root, H, ld, lean, sC, dynW, dynS, drop);
    vec3 T = normalize(cA - cB);

    // Gentle twist along the blade so sunlight rolls across each leaf
    float tw = aDir.w * h;
    vec3 W = normalize(vec3(-ld.y, 0.0, ld.x) * cos(tw) + vec3(ld.x, 0.0, ld.y) * sin(tw));

    float taper;
    if (species > 1.5) {
      // Broad ovate ground-cover leaf
      taper = pow(sin(3.14159 * mix(0.14, 1.0, h)), 0.72);
    } else {
      // Pinched base, gently swelling then tapering to a fine point
      taper = pow(1.0 - h, 0.66) * (0.62 + 0.38 * smoothstep(0.0, 0.22, h));
    }

    vec3 worldPos = c0 + W * (position.x * bw * taper);
    vec4 mv = viewMatrix * vec4(worldPos, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;

    // ---- Albedo: prototype palette + macro warmth + species + dryness -------
    float shade = aTint.x;
    vec3 col;
    if (species > 1.5) {
      vec3 gcRoot = vec3(0.11, 0.26, 0.14);
      vec3 gcMid = vec3(0.19, 0.42, 0.2);
      vec3 gcTip = vec3(0.30, 0.52, 0.25);
      col = mix(gcRoot, gcMid, smoothstep(0.0, 0.5, h));
      col = mix(col, gcTip, smoothstep(0.45, 1.0, h) * (0.6 + 0.4 * shade));
    } else {
      vec3 rootColor   = vec3(0.140, 0.320, 0.170);  // #24522b
      vec3 midColorA   = vec3(0.240, 0.510, 0.245);  // #3d823e
      vec3 midColorB   = vec3(0.330, 0.615, 0.270);  // #549d45
      vec3 tipSunColor = vec3(0.555, 0.760, 0.330);  // #8ec254
      vec3 tipRimColor = vec3(0.750, 0.865, 0.475);  // #bfdd79
      vec3 midColor = mix(midColorA, midColorB, shade);
      col = mix(rootColor, midColor, smoothstep(0.0, 0.48, h));
      col = mix(col, tipSunColor, smoothstep(0.46, 0.88, h));
      col = mix(col, tipRimColor, smoothstep(0.86, 1.0, h) * (0.28 + 0.32 * shade));
      if (species > 0.5) col *= 0.9;
    }

    float macro = macroWarmth(root.xz);
    vec3 warm = col * vec3(1.15, 1.05, 0.72) + vec3(0.034, 0.02, 0.0);
    vec3 cool = col * vec3(0.8, 0.97, 1.08) + vec3(0.0, 0.004, 0.012);
    col = mix(cool, warm, macro);
    col *= 1.0 + vec3(0.05, 0.022, -0.045) * aTint.z;
    col = mix(col, vec3(0.80, 0.74, 0.43), aTint.y * smoothstep(0.42, 1.0, h));

    vAlbedo = col;
    vWorld = worldPos;
    vN = normalize(cross(W, T));
    vW = W;

    float sunVis = 1.0 - cloudShadowMask(worldPos.xz, t);
    float nearLens = (1.0 - smoothstep(2.2, 5.2, dist));
    vData = vec4(position.x * 2.0, h, sunVis, nearLens);

    float bendMag = length(spring);
    vFx = vec4(clamp(bendMag, 0.0, 1.5), dot(spring, normalize(vec2(0.55, 0.83))), windAmt, dist);

    // Breeze sheen bands span ~20 world units, so per-vertex is exact to the eye
    // and keeps the noise out of the (overdrawn) fragment stage
    vGust = sin(dot(worldPos.xz, vec2(0.3, 0.16)) - t * 0.9 + noiseS(worldPos.xz * 0.18) * 2.2) * 0.5 + 0.5;
  }
`;

const grassFragmentShader = /* glsl */ `
  ${GAMUT_GLSL}

  varying vec3 vWorld;
  varying vec3 vN;
  varying vec3 vW;
  varying vec4 vData;
  varying vec3 vAlbedo;
  varying vec4 vFx;
  varying float vGust;

  ${NOISE_GLSL}
  ${FIELD_GLSL}

  void main() {
    float across = vData.x;
    float h = vData.y;
    float sunVis = vData.z;
    float nearLens = vData.w;

    // Blade edges (BLADE_EDGES, see capabilities.ts):
    //  0 soft  — alpha-to-coverage feather; foreground wisps feather like a shallow lens
    //  1 crisp — the geometry's own MSAA outline only
    //  2 clean — a one-pixel feather snapped to whole MSAA samples. GPUs dither any
    //            in-between coverage across neighbouring pixels, which phones show as
    //            a speckled fringe on every blade; whole samples leave nothing to dither.
  #if BLADE_EDGES == 1
    float alpha = 1.0;
  #else
    float edge = 1.0 - abs(across);
    // (edge widths kept > 0: smoothstep with equal edges is undefined, and Apple
    // GPUs really do return garbage for it)
    float aaw = clamp(fwidth(across) * 1.2, 1e-4, 0.6);
    #if BLADE_EDGES == 2
      float alpha = floor(smoothstep(0.0, aaw, edge) * 4.0 + 0.5) * 0.25;
    #else
      float alpha = smoothstep(0.0, aaw + nearLens * 0.6, edge);
    #endif
  #endif

    // Curved cylindrical cross-blade normal (±35°) with a subtle central spine crease
    vec3 Nf = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 W = normalize(vW);
    float crease = sign(across) * 0.16 * exp(-abs(across) * 9.0);
    vec3 N = normalize(Nf + W * (across * 0.70 - crease));

    vec3 L = uSunDir;
    vec3 V = normalize(cameraPosition - vWorld);
    float NdL = dot(N, L);

    float sunLight = mix(0.42, 1.0, sunVis);
    float ambLight = mix(0.88, 1.0, sunVis);

    vec3 skyAmb = vec3(0.80, 0.90, 1.0);
    vec3 groundAmb = vec3(0.56, 0.66, 0.44);
    vec3 amb = mix(groundAmb, skyAmb, clamp(N.y * 0.5 + 0.5, 0.0, 1.0));
    float ao = mix(0.56, 1.0, smoothstep(0.0, 0.62, h));
    float diff = clamp((NdL + 0.5) / 1.5, 0.0, 1.0);

    vec3 sunCol = vec3(1.0, 0.96, 0.86);
    vec3 shadeTint = mix(vec3(0.86, 0.92, 1.04), vec3(1.0), sunVis);
    vec3 col = vAlbedo * shadeTint * (amb * 0.78 * ao * ambLight + sunCol * diff * 0.5 * sunLight * mix(0.55, 1.0, ao));

    // Warm backlit subsurface scattering through thin upper blades
    float back = pow(max(dot(-V, L), 0.0), 3.0);
    float thin = smoothstep(0.28, 1.0, h) * mix(0.45, 1.0, clamp(-NdL, 0.0, 1.0));
    col += vAlbedo * vec3(1.05, 0.98, 0.52) * back * thin * 0.95 * sunLight;

    // Dewy sheen
    vec3 Hv = normalize(L + V);
    col += sunCol * pow(max(dot(N, Hv), 0.0), 28.0) * 0.08 * h * sunLight;

    // Breeze sheen: slow gust bands silvering the canopy as they roll through
    float gust = smoothstep(0.62, 1.0, vGust);
    col += vec3(0.03, 0.045, 0.018) * clamp(vFx.z * 0.5 + 0.5, 0.0, 1.0) * h;
    col += vec3(0.07, 0.085, 0.045) * gust * smoothstep(0.35, 1.0, h) * sunLight;

    // Parted damp trough + laid-down blades catching a dewy highlight
    float trough = smoothstep(0.08, 1.15, vFx.x);
    col *= 1.0 - 0.16 * trough * (1.0 - h * 0.55);
    col += vec3(0.06, 0.095, 0.05) * clamp(vFx.y, 0.0, 1.0) * smoothstep(0.35, 1.0, h) * 0.72;

    // Foreground depth softness: slightly lifted, warmer, defocused
    col = mix(col, col * 1.06 + vec3(0.025, 0.028, 0.008), nearLens * 0.55);

    col = applyMeadowHaze(col, vFx.w);
    gl_FragColor = vec4(outputGamut(col), alpha);
  }
`;

// ---------------------------------------------------------------------------
// 5. Foxtail / wild-oat seed plumes (axial billboards, feathery heads)
// ---------------------------------------------------------------------------
const PLUME_HEAD_START = 0.7;

const plumeVertexShader = /* glsl */ `
  attribute vec4 aRoot;   // xyz root, w seed
  attribute vec4 aShape;  // x height, y stem width, z head width, w lean
  attribute vec4 aDir;    // xy lean dir, z phase, w nod

  varying vec3 vWorld;
  varying vec4 vData;     // x across(-1..1), y height, z head t, w seed
  varying vec4 vLight;    // x sun visibility, y distance, z macro, w near-lens

  ${NOISE_GLSL}
  ${FIELD_GLSL}
  ${BEND_GLSL}

  vec3 plumeCenter(float hh, vec3 root, float H, vec2 ld, float lean, float nod, vec2 dynW, vec2 dynS, float drop) {
    float prof = lean * hh * hh + nod * pow(hh, 4.0);
    vec2 off = ld * (H * prof) + dynW * pow(hh, 1.4) * 1.3 + dynS * pow(hh, 1.25);
    return root + vec3(off.x, H * hh - drop * pow(hh, 1.15), off.y);
  }

  void main() {
    float h = uv.y;
    vec3 root = aRoot.xyz;
    float H = aShape.x;
    vec2 ld = aDir.xy;
    float t = uTime;

    float windAmt;
    vec2 dynW = breezeOffset(root.xz, aDir.z, t, windAmt);
    vec2 dynS = springAt(root.xz) * (0.94 * H);
    vec2 tipOff = ld * (H * (aShape.w + aDir.w)) + dynW * 1.3 + dynS;
    float drop = min(H * 0.6, dot(tipOff, tipOff) / max(H * 1.28, 0.4));

    vec3 c0 = plumeCenter(h, root, H, ld, aShape.w, aDir.w, dynW, dynS, drop);
    vec3 cA = plumeCenter(min(h + 0.03, 1.0), root, H, ld, aShape.w, aDir.w, dynW, dynS, drop);
    vec3 cB = plumeCenter(max(h - 0.03, 0.0), root, H, ld, aShape.w, aDir.w, dynW, dynS, drop);
    vec3 T = normalize(cA - cB);

    // Axial billboard: width always faces the lens so slender stems never vanish edge-on
    vec3 toCam = normalize(cameraPosition - c0);
    vec3 W = normalize(cross(T, toCam));

    float headT = clamp((h - ${PLUME_HEAD_START.toFixed(2)}) / ${(1 - PLUME_HEAD_START).toFixed(2)}, 0.0, 1.0);
    float headProfile = h >= ${PLUME_HEAD_START.toFixed(2)} ? pow(sin(3.14159 * mix(0.06, 1.0, headT)), 0.6) : 0.0;
    float width = aShape.y * (1.0 - h * 0.4) + aShape.z * headProfile;

    vec3 worldPos = c0 + W * (position.x * width);
    vec4 mv = viewMatrix * vec4(worldPos, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;

    vWorld = worldPos;
    vData = vec4(position.x * 2.0, h, headT, aRoot.w);
    vLight = vec4(1.0 - cloudShadowMask(worldPos.xz, t), dist, macroWarmth(root.xz), (1.0 - smoothstep(1.5, 3.4, dist)));
  }
`;

const plumeFragmentShader = /* glsl */ `
  ${GAMUT_GLSL}

  varying vec3 vWorld;
  varying vec4 vData;
  varying vec4 vLight;

  ${NOISE_GLSL}
  ${FIELD_GLSL}

  void main() {
    float across = vData.x;
    float h = vData.y;
    float headT = vData.z;
    float seed = vData.w;
    float sunVis = vLight.x;
    float u = abs(across);

    float alpha;
    vec3 albedo;
    if (h < ${PLUME_HEAD_START.toFixed(2)}) {
      float aaw = clamp(fwidth(across) * 1.2, 1e-4, 0.6);
      alpha = smoothstep(0.0, aaw, 1.0 - u);
      albedo = mix(vec3(0.30, 0.50, 0.22), vec3(0.62, 0.66, 0.36), smoothstep(0.2, ${PLUME_HEAD_START.toFixed(2)}, h));
    } else {
      // Feathery spindle seed head with fine upward-swept bristles
      float fuzz = noiseS(vec2(headT * 34.0 + seed * 40.0, u * 5.0));
      float body = 1.0 - smoothstep(0.38, 0.92, u + (fuzz - 0.5) * 0.42);
      float strands = smoothstep(0.62, 0.98, sin(headT * 96.0 - u * 16.0 + seed * 23.0) * 0.5 + 0.5);
      strands *= (1.0 - u * u) * smoothstep(0.02, 0.2, headT) * (1.0 - smoothstep(0.82, 1.0, headT));
      alpha = max(body, strands * 0.9);
      albedo = mix(vec3(0.56, 0.6, 0.32), vec3(0.84, 0.78, 0.54), smoothstep(0.0, 0.7, headT) * (1.0 - u * 0.4));
    }
    alpha *= 1.0 - vLight.w * 0.35;

    vec3 warm = albedo * vec3(1.06, 1.02, 0.88);
    albedo = mix(albedo * vec3(0.94, 1.0, 1.03), warm, vLight.z);

    vec3 L = uSunDir;
    vec3 V = normalize(cameraPosition - vWorld);
    float sunLight = mix(0.32, 1.0, sunVis);
    float back = pow(max(dot(-V, L), 0.0), 3.0);

    vec3 col = albedo * (vec3(0.80, 0.88, 0.96) * 0.78 * mix(0.93, 1.0, sunVis) + vec3(1.0, 0.96, 0.86) * 0.32 * sunLight);
    // Seed plumes catch the strongest backlit glow of the whole meadow
    col += albedo * vec3(1.05, 0.96, 0.6) * back * (0.22 + headT * 0.55) * sunLight;

    col = applyMeadowHaze(col, vLight.y);
    gl_FragColor = vec4(outputGamut(col), alpha);
  }
`;

// ---------------------------------------------------------------------------
// 6. Clustered wildflowers — buttercups & daisies on sunlit knolls
// ---------------------------------------------------------------------------
const flowerVertexShader = /* glsl */ `
  attribute vec4 aRoot;   // xyz root, w species (0 buttercup, 1 daisy)
  attribute vec4 aShape;  // x stem height, y head radius, z head spin, w seed
  attribute vec4 aDir;    // xy lean dir, z phase, w lean

  varying vec3 vWorld;
  varying vec4 vData;     // xy head coords (-1..1), z part (0 stem / 1 head), w species
  varying vec4 vLight;    // x sun visibility, y distance, z seed, w across (stem)

  ${NOISE_GLSL}
  ${FIELD_GLSL}
  ${BEND_GLSL}

  vec3 stemCenter(float hh, vec3 root, float H, vec2 ld, float lean, vec2 dynW, vec2 dynS, float drop) {
    vec2 off = ld * (H * lean * hh * hh) + dynW * pow(hh, 1.5) + dynS * pow(hh, 1.28);
    return root + vec3(off.x, H * hh - drop * pow(hh, 1.15), off.y);
  }

  void main() {
    float part = uv.x;
    float h = uv.y;
    vec3 root = aRoot.xyz;
    float H = aShape.x;
    vec2 ld = aDir.xy;
    float lean = aDir.w;
    float t = uTime;

    float windAmt;
    vec2 dynW = breezeOffset(root.xz, aDir.z, t, windAmt) * 0.9;
    vec2 dynS = springAt(root.xz) * (0.94 * H);
    vec2 tipOff = ld * (H * lean) + dynW + dynS;
    float drop = min(H * 0.6, dot(tipOff, tipOff) / max(H * 1.28, 0.4));

    vec3 worldPos;
    vec3 top = stemCenter(1.0, root, H, ld, lean, dynW, dynS, drop);
    vec3 toCam = normalize(cameraPosition - top);

    if (part < 0.5) {
      vec3 c0 = stemCenter(h, root, H, ld, lean, dynW, dynS, drop);
      vec3 cA = stemCenter(min(h + 0.05, 1.0), root, H, ld, lean, dynW, dynS, drop);
      vec3 cB = stemCenter(max(h - 0.05, 0.0), root, H, ld, lean, dynW, dynS, drop);
      vec3 T = normalize(cA - cB);
      vec3 W = normalize(cross(T, normalize(cameraPosition - c0)));
      worldPos = c0 + W * (position.x * 0.0075 * (1.0 - h * 0.3));
      vData = vec4(0.0, 0.0, 0.0, aRoot.w);
      vLight.w = position.x * 2.0;
    } else {
      // Head faces the open sky and leans toward the lens
      vec3 n = normalize(vec3(0.0, 1.0, 0.0) * 0.62 + toCam * 0.62 + vec3(ld.x, 0.0, ld.y) * 0.22);
      vec3 a1 = normalize(cross(n, abs(n.y) < 0.98 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
      vec3 a2 = cross(n, a1);
      float s = sin(aShape.z);
      float c = cos(aShape.z);
      vec2 p = vec2(position.x * c - position.y * s, position.x * s + position.y * c);
      worldPos = top + n * 0.004 + (a1 * p.x + a2 * p.y) * aShape.y;
      vData = vec4(position.xy, 1.0, aRoot.w);
      vLight.w = 0.0;
    }

    vec4 mv = viewMatrix * vec4(worldPos, 1.0);
    gl_Position = projectionMatrix * mv;
    vWorld = worldPos;
    vLight.x = 1.0 - cloudShadowMask(worldPos.xz, t);
    vLight.y = -mv.z;
    vLight.z = aShape.w;
  }
`;

const flowerFragmentShader = /* glsl */ `
  ${GAMUT_GLSL}

  varying vec3 vWorld;
  varying vec4 vData;
  varying vec4 vLight;

  ${NOISE_GLSL}
  ${FIELD_GLSL}

  void main() {
    float sunVis = vLight.x;
    float sunLight = mix(0.36, 1.0, sunVis);
    vec3 col;
    float alpha;

    if (vData.z < 0.5) {
      float u = abs(vLight.w);
      alpha = smoothstep(0.0, clamp(fwidth(vLight.w) * 1.2, 1e-4, 0.6), 1.0 - u);
      col = vec3(0.24, 0.46, 0.2) * (0.72 + 0.3 * sunLight);
    } else {
      vec2 p = vData.xy;
      float r = length(p);
      float a = atan(p.y, p.x);
      float aa = fwidth(r) * 1.2 + 0.02;

      if (vData.w < 0.5) {
        // Buttercup: five rounded glossy petals around a green-gold boss
        float petalR = 0.70 + 0.26 * pow(abs(cos(a * 2.5)), 0.6);
        alpha = (1.0 - smoothstep(petalR - aa, petalR, r));
        vec3 petal = mix(vec3(0.98, 0.80, 0.16), vec3(1.0, 0.92, 0.38), smoothstep(0.2, 0.75, r));
        float gloss = exp(-pow((r - 0.5) * 5.0, 2.0)) * smoothstep(0.2, 1.0, cos(a - 2.2));
        petal += vec3(0.22, 0.2, 0.1) * gloss;
        vec3 boss = vec3(0.72, 0.66, 0.20);
        col = mix(boss, petal, smoothstep(0.2, 0.3, r));
      } else {
        // Daisy: many slender white rays around a golden disc
        float rays = pow(abs(cos(a * 8.0 + vLight.z * 6.0)), 0.45);
        float petalR = 0.58 + 0.38 * rays;
        alpha = (1.0 - smoothstep(petalR - aa, petalR, r));
        vec3 petal = mix(vec3(0.84, 0.85, 0.9), vec3(0.95, 0.95, 0.93), smoothstep(0.25, 0.7, r));
        vec3 disc = mix(vec3(0.96, 0.74, 0.14), vec3(0.88, 0.6, 0.1), smoothstep(0.0, 0.22, r));
        col = mix(disc, petal, smoothstep(0.24, 0.32, r));
      }
      col *= 0.66 + 0.3 * sunLight;
      vec3 V = normalize(cameraPosition - vWorld);
      col += col * vec3(0.35, 0.3, 0.12) * pow(max(dot(-V, uSunDir), 0.0), 3.0) * sunLight * 0.5;
    }

    col = applyMeadowHaze(col, vLight.y);
    gl_FragColor = vec4(outputGamut(col), alpha);
  }
`;

// ---------------------------------------------------------------------------
// 7. Drifting sunlit petals (prototype) + brush-kicked pollen
// ---------------------------------------------------------------------------
const petalsVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vKind;
  varying float vAlpha;

  void main() {
    float t = uTime;
    vec3 p = position;
    p.x = mod(p.x + t * (0.24 + fract(aSeed * 3.1) * 0.22) + 9.0, 18.0) - 9.0;
    p.y += sin(t * (0.8 + fract(aSeed * 7.3) * 0.7) + aSeed * 12.0) * 0.3;
    p.z += cos(t * 0.65 + aSeed * 9.0) * 0.18;

    vKind = fract(aSeed * 13.7);
    vAlpha = 0.5 + 0.35 * sin(t * 1.3 + aSeed * 20.0);

    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * uPixelRatio * (155.0 / max(-mvPos.z, 1.5));
  }
`;

const petalsFragmentShader = /* glsl */ `
  ${GAMUT_GLSL}

  varying float vKind;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(vec2(c.x * 0.85, c.y * 1.35));
    float alpha = (1.0 - smoothstep(0.14, 0.5, d)) * vAlpha;
    if (alpha < 0.02) discard;

    vec3 yellowPetal = vec3(1.0, 0.93, 0.42);
    vec3 whiteMote = vec3(1.0, 1.0, 0.97);
    vec3 col = mix(yellowPetal, whiteMote, step(0.55, vKind));
    gl_FragColor = vec4(outputGamut(col), alpha * 0.84);
  }
`;

const pollenVertexShader = /* glsl */ `
  attribute float aAlpha;
  attribute float aSize;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * uPixelRatio * (150.0 / max(-mvPos.z, 1.0));
  }
`;

const pollenFragmentShader = /* glsl */ `
  ${GAMUT_GLSL}

  varying float vAlpha;

  void main() {
    if (vAlpha < 0.01) discard;
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = (1.0 - smoothstep(0.0, 0.5, d));
    float alpha = core * core * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(outputGamut(mix(vec3(1.0, 0.9, 0.48), vec3(1.0, 0.99, 0.9), core)), alpha);
  }
`;

// ---------------------------------------------------------------------------
// Geometry builders
// ---------------------------------------------------------------------------
function buildRibbon(rows: number[]): THREE.InstancedBufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  rows.forEach((v) => {
    positions.push(-0.5, v, 0, 0.5, v, 0);
    uvs.push(0, v, 1, v);
  });
  for (let i = 0; i < rows.length - 1; i++) {
    const r = i * 2;
    indices.push(r, r + 1, r + 2, r + 1, r + 3, r + 2);
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function evenRows(segments: number) {
  return Array.from({ length: segments + 1 }, (_, i) => i / segments);
}

function setInstanced(geo: THREE.InstancedBufferGeometry, name: string, data: Float32Array, size: number) {
  geo.setAttribute(name, new THREE.InstancedBufferAttribute(data, size));
}

interface GrassBuffers {
  root: Float32Array;
  shape: Float32Array;
  dir: Float32Array;
  tint: Float32Array;
  count: number;
}

/** Instance-count multiplier that keeps planting density constant as the field widens. */
function densityScale(q: MeadowQuality, spread: number) {
  return Math.min(3.0, Math.max(0.7, spread / q.densitySpread));
}

/** Half-width of the planted field at a given distance from the lens (frustum-fit). */
function fieldHalfWidth(z: number, spread: number, pad = 0.5) {
  return pad + (FRAMING.position[2] - z) * spread;
}

/**
 * Grass planting as a resumable generator: it pauses every few hundred blades so
 * the first build can be spread across short slices instead of one long
 * main-thread task. Run to the end synchronously (resize replants) it plants the
 * identical meadow: pausing never touches the random sequence.
 */
function* grassInstanceSteps(q: MeadowQuality, spread: number): Generator<void, GrassBuffers> {
  const rand = mulberry32(20210423);
  const k = densityScale(q, spread);
  const tuftCount = Math.round(q.tufts * k);
  const fillerCount = Math.round(q.filler * k);
  const groundCoverCount = Math.round(q.groundCover * k);
  const maxCount = tuftCount * q.bladesPerTuft[1] + fillerCount + groundCoverCount;
  const root = new Float32Array(maxCount * 4);
  const shape = new Float32Array(maxCount * 4);
  const dir = new Float32Array(maxCount * 4);
  const tint = new Float32Array(maxCount * 4);
  let n = 0;

  const push = (
    x: number,
    z: number,
    species: number,
    height: number,
    width: number,
    lean: number,
    sCurve: number,
    dx: number,
    dz: number,
    twist: number,
    shade: number,
    dry: number,
    hue: number
  ) => {
    const len = Math.hypot(dx, dz) || 1;
    // Direct writes (no per-blade temporary arrays); rand() order is unchanged
    const o = n * 4;
    root[o] = x;
    root[o + 1] = terrainHeight(x, z);
    root[o + 2] = z;
    root[o + 3] = species;
    shape[o] = height;
    shape[o + 1] = width;
    shape[o + 2] = lean;
    shape[o + 3] = sCurve;
    dir[o] = dx / len;
    dir[o + 1] = dz / len;
    dir[o + 2] = rand() * Math.PI * 2;
    dir[o + 3] = twist;
    tint[o] = shade;
    tint[o + 1] = dry;
    tint[o + 2] = hue;
    n++;
  };

  // A gentle prevailing lean so the meadow reads as one breeze-combed field
  const prevailing = 0.35;

  // --- Organic tufts: FBM density pockets, radiating blades, canopy billows ---
  let tufts = 0;
  let guard = 0;
  while (tufts < tuftCount && guard < tuftCount * 14) {
    guard++;
    const depthT = Math.pow(rand(), 1.05);
    const z = 5.2 - depthT * 20.6;
    const x = (rand() * 2 - 1) * fieldHalfWidth(z, spread);
    const density = fbm2(x * 0.16, z * 0.16, 7);
    const pocket = 0.22 + 0.78 * smoothstep(0.3, 0.62, density);
    if (rand() > pocket) continue;
    tufts++;

    const billow = canopyBillow(x, z);
    const nearF = nearCameraFactor(z);
    const tuftH = (0.72 + rand() * 0.42) * billow * nearF;
    const tuftR = (0.13 + rand() * 0.2) * (1 + depthT * 0.95);
    const blades = Math.round(q.bladesPerTuft[0] + rand() * (q.bladesPerTuft[1] - q.bladesPerTuft[0]));
    const tuftAngle = prevailing + (rand() - 0.5) * 1.7;
    const tdx = Math.cos(tuftAngle);
    const tdz = Math.sin(tuftAngle);
    const tuftShade = rand();
    const tuftHue = rand() * 2 - 1;
    const widthScale = (1 + depthT * 0.7) * q.widthScale;

    for (let b = 0; b < blades; b++) {
      const rr = Math.sqrt(rand());
      const theta = rand() * Math.PI * 2;
      const ox = Math.cos(theta);
      const oz = Math.sin(theta);
      const bx = x + ox * rr * tuftR;
      const bz = z + oz * rr * tuftR;
      const outward = 0.35 + rr * 0.95;
      const dx = ox * outward + tdx * 0.62 + (rand() - 0.5) * 0.3;
      const dz = oz * outward + tdz * 0.62 + (rand() - 0.5) * 0.3;
      const tall = rand() > 0.93 && z < 1.8 ? 1.22 : 1.0;
      const height = tuftH * (1 - 0.3 * rr) * (0.82 + rand() * 0.3) * tall;
      const width = (0.05 + rand() * 0.042) * widthScale * (0.6 + 0.4 * nearF);
      const lean = 0.1 + rr * 0.42 + rand() * 0.16;
      const sCurve = rand() * 0.36;
      const twist = (rand() - 0.5) * 1.5;
      const shade = Math.min(1, Math.max(0, tuftShade + (rand() - 0.5) * 0.36));
      const dry = rand() > 0.955 ? 0.35 + rand() * 0.45 : 0;
      push(bx, bz, 0, height, width, lean, sCurve, dx, dz, twist, shade, dry, tuftHue);
    }
    if ((tufts & 31) === 0) yield;
  }

  // --- Filler blades so the canopy never reads as bald between tufts ---------
  for (let i = 0; i < fillerCount; i++) {
    if ((i & 511) === 511) yield;
    const depthT = Math.pow(rand(), 1.1);
    const z = 5.0 - depthT * 20.2;
    const x = (rand() * 2 - 1) * fieldHalfWidth(z, spread);
    const billow = canopyBillow(x, z);
    const height = (0.5 + rand() * 0.34) * billow * nearCameraFactor(z);
    const angle = prevailing + (rand() - 0.5) * 3.2;
    push(
      x,
      z,
      1,
      height,
      (0.05 + rand() * 0.035) * (1 + depthT * 0.7) * q.widthScale,
      0.14 + rand() * 0.3,
      rand() * 0.3,
      Math.cos(angle),
      Math.sin(angle),
      (rand() - 0.5) * 1.4,
      rand(),
      0,
      rand() * 2 - 1
    );
  }

  // --- Low ground-cover rosettes keeping the meadow base lush and layered ----
  let gc = 0;
  let gcRosettes = 0;
  while (gc < groundCoverCount) {
    if ((++gcRosettes & 127) === 0) yield;
    const depthT = Math.pow(rand(), 1.35);
    const cz = 4.8 - depthT * 15.0;
    const cx = (rand() * 2 - 1) * fieldHalfWidth(cz, spread, 0.4);
    const leaves = 3 + Math.floor(rand() * 4);
    const baseAngle = rand() * Math.PI * 2;
    for (let l = 0; l < leaves && gc < groundCoverCount; l++, gc++) {
      const angle = baseAngle + (l / leaves) * Math.PI * 2 + (rand() - 0.5) * 0.6;
      const dx = Math.cos(angle);
      const dz = Math.sin(angle);
      push(
        cx + dx * 0.03,
        cz + dz * 0.03,
        2,
        (0.14 + rand() * 0.2) * (1 + depthT * 0.4),
        (0.07 + rand() * 0.06) * (1 + depthT * 0.6) * q.widthScale,
        0.55 + rand() * 0.45,
        0.08,
        dx,
        dz,
        (rand() - 0.5) * 0.8,
        rand(),
        0,
        rand() * 2 - 1
      );
    }
  }

  yield;
  sortNearFirst([root, shape, dir, tint], n);
  return { root, shape, dir, tint, count: n };
}

function runToEnd<T>(steps: Generator<void, T>): T {
  for (;;) {
    const r = steps.next();
    if (r.done) return r.value;
  }
}

/** Drive a step generator in ~6 ms slices, yielding the main thread between them. */
async function runSliced<T>(steps: Generator<void, T>, budgetMs = 6): Promise<T> {
  for (;;) {
    const deadline = performance.now() + budgetMs;
    for (;;) {
      const r = steps.next();
      if (r.done) return r.value;
      if (performance.now() >= deadline) break;
    }
    await yieldToMain();
  }
}

function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function buildGrassInstances(q: MeadowQuality, spread: number): GrassBuffers {
  return runToEnd(grassInstanceSteps(q, spread));
}

/**
 * Reorder instances nearest-first. Within one instanced draw the GPU shades blades
 * in buffer order, so near blades must land first for the depth test to reject the
 * (many) blades hidden behind them before they are shaded. A linear-time bucket
 * sort (~1 cm buckets) is plenty: exact order within a bucket doesn't matter.
 */
function sortNearFirst(buffers: Float32Array[], count: number) {
  const BUCKETS = 2048;
  const root = buffers[0];
  const camZ = FRAMING.position[2];
  const dist = new Float32Array(count);
  let maxDist = 0;
  for (let i = 0; i < count; i++) {
    const x = root[i * 4];
    const z = root[i * 4 + 2] - camZ;
    const d = Math.sqrt(x * x + z * z);
    dist[i] = d;
    if (d > maxDist) maxDist = d;
  }
  const scale = (BUCKETS - 1) / (maxDist || 1);
  const bucket = new Uint16Array(count);
  const start = new Uint32Array(BUCKETS + 1);
  for (let i = 0; i < count; i++) {
    const b = (dist[i] * scale) | 0;
    bucket[i] = b;
    start[b + 1]++;
  }
  for (let b = 0; b < BUCKETS; b++) start[b + 1] += start[b];
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) order[start[bucket[i]]++] = i;

  for (const buf of buffers) {
    const src = buf.slice(0, count * 4);
    for (let i = 0; i < count; i++) {
      const o = order[i] * 4;
      const d = i * 4;
      buf[d] = src[o];
      buf[d + 1] = src[o + 1];
      buf[d + 2] = src[o + 2];
      buf[d + 3] = src[o + 3];
    }
  }
}

function buildPlumeInstances(q: MeadowQuality, spread: number) {
  const rand = mulberry32(5150);
  const count = Math.round(q.plumes * densityScale(q, spread));
  const root = new Float32Array(count * 4);
  const shape = new Float32Array(count * 4);
  const dir = new Float32Array(count * 4);
  let n = 0;
  let guard = 0;
  while (n < count && guard < count * 30) {
    guard++;
    const depthT = Math.pow(rand(), 0.9);
    const z = 1.6 - depthT * 16.0;
    const x = (rand() * 2 - 1) * fieldHalfWidth(z, spread, 0.3);
    // Plumes gather in loose drifts
    const drift = fbm2(x * 0.13 + 9.0, z * 0.13 - 3.0, 23);
    if (rand() > smoothstep(0.42, 0.7, drift) * 0.95 + 0.03) continue;
    const billow = canopyBillow(x, z);
    let height = (1.02 + rand() * 0.34) * billow;
    if (z > 0) height = Math.min(height, 1.12);
    const angle = 0.3 + (rand() - 0.5) * 1.4;
    root.set([x, terrainHeight(x, z), z, rand()], n * 4);
    shape.set([height, 0.0075 * (1 + depthT * 0.8), (0.026 + rand() * 0.016) * (1 + depthT * 0.5), 0.06 + rand() * 0.16], n * 4);
    dir.set([Math.cos(angle), Math.sin(angle), rand() * Math.PI * 2, 0.04 + rand() * 0.12], n * 4);
    n++;
  }
  return { root, shape, dir, count: n };
}

function buildFlowerInstances(q: MeadowQuality, spread: number) {
  const rand = mulberry32(777);
  const patchCount = Math.round(q.flowerPatches * densityScale(q, spread));
  const maxCount = patchCount * 24;
  const root = new Float32Array(maxCount * 4);
  const shape = new Float32Array(maxCount * 4);
  const dir = new Float32Array(maxCount * 4);
  let n = 0;
  let patches = 0;
  let guard = 0;
  while (patches < patchCount && guard < patchCount * 60) {
    guard++;
    const depthT = Math.pow(rand(), 0.85);
    const pz = 3.4 - depthT * 14.5;
    const px = (rand() * 2 - 1) * fieldHalfWidth(pz, spread, 0.2) * 0.96;
    // Favour sunlit knolls
    const knoll = smoothstep(-0.25, 0.4, terrainBroad(px, pz));
    if (rand() > 0.15 + knoll * 0.85) continue;
    patches++;

    const daisyPatch = rand() < 0.42;
    const radius = (0.35 + rand() * 0.7) * (1 + depthT * 0.4);
    const count = 5 + Math.floor(rand() * 10);
    const sizeScale = 1 + depthT * 0.55;
    for (let i = 0; i < count && n < maxCount; i++) {
      const rr = Math.pow(rand(), 0.7) * radius;
      const th = rand() * Math.PI * 2;
      const x = px + Math.cos(th) * rr;
      const z = pz + Math.sin(th) * rr * 0.8;
      const isDaisy = rand() < 0.14 ? !daisyPatch : daisyPatch;
      const billow = canopyBillow(x, z);
      const height = (0.52 + rand() * 0.4) * billow * nearCameraFactor(z);
      const radiusHead = (isDaisy ? 0.026 + rand() * 0.01 : 0.021 + rand() * 0.008) * sizeScale;
      const angle = rand() * Math.PI * 2;
      root.set([x, terrainHeight(x, z), z, isDaisy ? 1 : 0], n * 4);
      shape.set([height, radiusHead, rand() * Math.PI * 2, rand()], n * 4);
      dir.set([Math.cos(angle), Math.sin(angle), rand() * Math.PI * 2, 0.05 + rand() * 0.14], n * 4);
      n++;
    }
  }
  return { root, shape, dir, count: n };
}

function buildFlowerGeometry(): THREE.InstancedBufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const stemRows = [0, 0.25, 0.5, 0.75, 1.0];
  stemRows.forEach((v) => {
    positions.push(-0.5, v, 0, 0.5, v, 0);
    uvs.push(0, v, 0, v);
  });
  for (let i = 0; i < stemRows.length - 1; i++) {
    const r = i * 2;
    indices.push(r, r + 1, r + 2, r + 1, r + 3, r + 2);
  }
  const base = stemRows.length * 2;
  positions.push(-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0);
  uvs.push(1, 1, 1, 1, 1, 1, 1, 1);
  indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);

  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function makeSpringTarget(res: number) {
  return new THREE.WebGLRenderTarget(res, res, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
}

// ---------------------------------------------------------------------------
// Scene factory
// ---------------------------------------------------------------------------
/** Lens-fit planting width for a viewport (needed = what the lens sees). */
function plantingSpread(aspect: number, fov: number) {
  const needed = THREE.MathUtils.clamp(aspect * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 1.14, 0.28, 1.2);
  // Headroom avoids replanting when mobile toolbars nudge the viewport
  return { needed, spread: Math.min(needed * 1.12, 1.25) };
}

export interface PreparedMeadowFlora {
  readonly spread: number;
  readonly grass: GrassBuffers;
}

/**
 * Plants the meadow's grass for a viewport in short idle slices (never one long
 * main-thread task). Pass the result to `createNurtureMeadowScene`; if the
 * viewport changed meanwhile, the scene simply replants synchronously.
 */
export async function prepareMeadowFlora(
  quality: MeadowQuality,
  width: number,
  height: number
): Promise<PreparedMeadowFlora> {
  const aspect = width / Math.max(height, 1);
  const lens = new THREE.PerspectiveCamera(FRAMING.fov, aspect, 0.1, 100);
  applyFraming(lens, aspect, FRAMING);
  const { spread } = plantingSpread(aspect, lens.fov);
  const grass = await runSliced(grassInstanceSteps(quality, spread));
  return { spread, grass };
}

export function createNurtureMeadowScene(
  gl: THREE.WebGLRenderer,
  quality: MeadowQuality,
  width: number,
  height: number,
  prepared?: PreparedMeadowFlora
): HeroScene {
  let preparedFlora = prepared;
  const useFbo = quality.springRes > 0;
  const springRes = quality.springRes;
  // Wide-gamut output for every colour pass (never the physics sim)
  const gamut = gamutDefines(quality.p3Vivid);
  const defines: Record<string, string> = { ...gamut };
  if (useFbo) defines.USE_SPRING_FBO = '';
  // Always defined: GLSL ES rejects an undefined macro inside #if
  defines.BLADE_EDGES = String(quality.bladeEdges);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FRAMING.fov, 1, 0.1, 100);
  let framing: FramingResult = applyFraming(camera, 16 / 9, FRAMING);
  const lookTarget = new THREE.Vector3(0, framing.lookY, framing.lookZ);
  camera.lookAt(lookTarget);
  const pixelRatio = { value: gl.getPixelRatio() };

  // Uniforms shared by every meadow material (one clock, one wind, one sun)
  const wakes = Array.from({ length: WAKE_SLOTS }, () => new THREE.Vector4(0, 0, -100, 0));
  const shared = {
    uTime: { value: 0 },
    uSunDir: { value: SUN_DIR.clone() },
    uSpringField: { value: null as THREE.Texture | null },
    uFieldMin: { value: new THREE.Vector2(FIELD_MIN_X, FIELD_MIN_Z) },
    uFieldSize: { value: new THREE.Vector2(FIELD_WIDTH, FIELD_DEPTH) },
    uWakes: { value: wakes },
  };

  // --- Spring field (Tier 1) -------------------------------------------------
  let fboA: THREE.WebGLRenderTarget | null = null;
  let fboB: THREE.WebGLRenderTarget | null = null;
  let simScene: THREE.Scene | null = null;
  let simCamera: THREE.OrthographicCamera | null = null;
  let simMaterial: THREE.ShaderMaterial | null = null;
  let simQuad: THREE.Mesh | null = null;
  if (useFbo) {
    fboA = makeSpringTarget(springRes);
    fboB = makeSpringTarget(springRes);
    shared.uSpringField.value = fboA.texture;
    simScene = new THREE.Scene();
    simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    simMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertexShader,
      fragmentShader: springSimFragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPrevState: { value: null },
        uResolution: { value: new THREE.Vector2(springRes, springRes) },
        uDt: { value: 1 / 60 },
        uFieldSize: { value: new THREE.Vector2(FIELD_WIDTH, FIELD_DEPTH) },
        uPrevMouse: { value: new THREE.Vector2(-99, -99) },
        uCurrMouse: { value: new THREE.Vector2(-99, -99) },
        uMouseVel: { value: new THREE.Vector2(0, 0) },
        uMouseActive: { value: 0 },
        uReset: { value: 1 },
      },
    });
    simQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial);
    simQuad.frustumCulled = false;
    simScene.add(simQuad);
  }

  // --- Sky -------------------------------------------------------------------
  const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    defines: gamut,
    depthWrite: false,
    // Drawn last at the far plane: early-z skips every sky pixel behind the meadow
    depthTest: true,
    toneMapped: false,
    uniforms: {
      uTime: shared.uTime,
      uResolution: { value: new THREE.Vector2(1280, 720) },
      uHorizonShift: { value: 0 },
      uCloudScale: { value: 1 },
      uFrameY: { value: new THREE.Vector2(1, 0) },
    },
  });
  const skyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMaterial);
  skyQuad.frustumCulled = false;
  skyQuad.renderOrder = 4;
  scene.add(skyQuad);

  // --- Hillside floor ----------------------------------------------------------
  const groundGeometry = new THREE.PlaneGeometry(48, 24, 72, 40);
  groundGeometry.rotateX(-Math.PI / 2);
  {
    const pos = groundGeometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const gx = pos.getX(i);
      const gz = pos.getZ(i) - 4.4; // z ∈ [-16.4, 7.6]
      pos.setZ(i, gz);
      pos.setY(i, terrainHeight(gx, gz) - 0.03);
    }
  }
  const groundMaterial = new THREE.ShaderMaterial({
    vertexShader: groundVertexShader,
    fragmentShader: groundFragmentShader,
    defines: gamut,
    toneMapped: false,
    uniforms: { uTime: shared.uTime, uSunDir: shared.uSunDir },
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.frustumCulled = false;
  ground.renderOrder = 3; // after the flora that covers most of it
  scene.add(ground);

  // --- Flora: grass, seed plumes, wildflowers (frustum-fit, replanted on big aspect changes)
  const makeFloraMaterial = (vertexShader: string, fragmentShader: string) =>
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      defines,
      side: THREE.DoubleSide,
      alphaToCoverage: true,
      toneMapped: false,
      uniforms: { ...shared },
    });
  const grassMaterial = makeFloraMaterial(grassVertexShader, grassFragmentShader);
  const plumeMaterial = makeFloraMaterial(plumeVertexShader, plumeFragmentShader);
  const flowerMaterial = makeFloraMaterial(flowerVertexShader, flowerFragmentShader);

  const grass = new THREE.Mesh(new THREE.InstancedBufferGeometry(), grassMaterial);
  const plumes = new THREE.Mesh(new THREE.InstancedBufferGeometry(), plumeMaterial);
  const flowers = new THREE.Mesh(new THREE.InstancedBufferGeometry(), flowerMaterial);
  // Opaque draw order, nearest occluders first: grass, plumes, flowers, ground, sky
  [grass, plumes, flowers].forEach((mesh, i) => {
    mesh.frustumCulled = false;
    mesh.renderOrder = i;
    scene.add(mesh);
  });

  const plumeRows = [0, 0.18, 0.36, 0.52, 0.63, PLUME_HEAD_START];
  for (let k = 1; k <= 8; k++) plumeRows.push(PLUME_HEAD_START + (k / 8) * (1 - PLUME_HEAD_START));

  let builtSpread = 0;
  const plantFlora = (spread: number) => {
    const grassData =
      preparedFlora && preparedFlora.spread === spread ? preparedFlora.grass : buildGrassInstances(quality, spread);
    preparedFlora = undefined;
    const grassGeometry = buildRibbon(evenRows(quality.bladeSegments));
    setInstanced(grassGeometry, 'aRoot', grassData.root.subarray(0, grassData.count * 4), 4);
    setInstanced(grassGeometry, 'aShape', grassData.shape.subarray(0, grassData.count * 4), 4);
    setInstanced(grassGeometry, 'aDir', grassData.dir.subarray(0, grassData.count * 4), 4);
    setInstanced(grassGeometry, 'aTint', grassData.tint.subarray(0, grassData.count * 4), 4);
    grassGeometry.instanceCount = grassData.count;

    const plumeData = buildPlumeInstances(quality, spread);
    const plumeGeometry = buildRibbon(plumeRows);
    setInstanced(plumeGeometry, 'aRoot', plumeData.root.subarray(0, plumeData.count * 4), 4);
    setInstanced(plumeGeometry, 'aShape', plumeData.shape.subarray(0, plumeData.count * 4), 4);
    setInstanced(plumeGeometry, 'aDir', plumeData.dir.subarray(0, plumeData.count * 4), 4);
    plumeGeometry.instanceCount = plumeData.count;

    const flowerData = buildFlowerInstances(quality, spread);
    const flowerGeometry = buildFlowerGeometry();
    setInstanced(flowerGeometry, 'aRoot', flowerData.root.subarray(0, flowerData.count * 4), 4);
    setInstanced(flowerGeometry, 'aShape', flowerData.shape.subarray(0, flowerData.count * 4), 4);
    setInstanced(flowerGeometry, 'aDir', flowerData.dir.subarray(0, flowerData.count * 4), 4);
    flowerGeometry.instanceCount = flowerData.count;

    grass.geometry.dispose();
    plumes.geometry.dispose();
    flowers.geometry.dispose();
    grass.geometry = grassGeometry;
    plumes.geometry = plumeGeometry;
    flowers.geometry = flowerGeometry;
    builtSpread = spread;
  };

  // --- Drifting petals ---------------------------------------------------------
  const petalRand = mulberry32(88421);
  const petalPositions = new Float32Array(quality.petals * 3);
  const petalSeeds = new Float32Array(quality.petals);
  const petalSizes = new Float32Array(quality.petals);
  for (let i = 0; i < quality.petals; i++) {
    petalPositions[i * 3] = (petalRand() * 2 - 1) * 8.5;
    petalPositions[i * 3 + 1] = 0.6 + petalRand() * 3.8;
    petalPositions[i * 3 + 2] = 3.2 - petalRand() * 11.0;
    petalSeeds[i] = petalRand();
    petalSizes[i] = 0.14 + petalRand() * 0.16;
  }
  const petalsGeometry = new THREE.BufferGeometry();
  petalsGeometry.setAttribute('position', new THREE.BufferAttribute(petalPositions, 3));
  petalsGeometry.setAttribute('aSeed', new THREE.BufferAttribute(petalSeeds, 1));
  petalsGeometry.setAttribute('aSize', new THREE.BufferAttribute(petalSizes, 1));
  const petalsMaterial = new THREE.ShaderMaterial({
    vertexShader: petalsVertexShader,
    fragmentShader: petalsFragmentShader,
    defines: gamut,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: { uTime: shared.uTime, uPixelRatio: pixelRatio },
  });
  const petals = new THREE.Points(petalsGeometry, petalsMaterial);
  petals.frustumCulled = false;
  petals.renderOrder = 5;
  scene.add(petals);

  // --- Brush-kicked pollen -----------------------------------------------------
  const pollenCount = quality.pollen;
  const pollenPos = new Float32Array(pollenCount * 3);
  const pollenAlpha = new Float32Array(pollenCount);
  const pollenSize = new Float32Array(pollenCount);
  const pollenVel = new Float32Array(pollenCount * 3);
  const pollenAge = new Float32Array(pollenCount).fill(1);
  const pollenLife = new Float32Array(pollenCount).fill(1);
  const pollenGeometry = new THREE.BufferGeometry();
  const pollenPosAttr = new THREE.BufferAttribute(pollenPos, 3);
  const pollenAlphaAttr = new THREE.BufferAttribute(pollenAlpha, 1);
  pollenPosAttr.setUsage(THREE.DynamicDrawUsage);
  pollenAlphaAttr.setUsage(THREE.DynamicDrawUsage);
  pollenGeometry.setAttribute('position', pollenPosAttr);
  pollenGeometry.setAttribute('aAlpha', pollenAlphaAttr);
  pollenGeometry.setAttribute('aSize', new THREE.BufferAttribute(pollenSize, 1));
  const pollenMaterial = new THREE.ShaderMaterial({
    vertexShader: pollenVertexShader,
    fragmentShader: pollenFragmentShader,
    defines: gamut,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: { uPixelRatio: pixelRatio },
  });
  const pollen = new THREE.Points(pollenGeometry, pollenMaterial);
  pollen.frustumCulled = false;
  pollen.renderOrder = 6;
  scene.add(pollen);
  let pollenAlive = 0;
  let pollenAccumulator = 0;

  const spawnPollen = (x: number, y: number, z: number) => {
    for (let i = 0; i < pollenCount; i++) {
      if (pollenAge[i] < pollenLife[i]) continue;
      pollenPos[i * 3] = x + (Math.random() - 0.5) * 0.5;
      pollenPos[i * 3 + 1] = y + Math.random() * 0.25;
      pollenPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
      pollenVel[i * 3] = 0.12 + Math.random() * 0.25;
      pollenVel[i * 3 + 1] = 0.32 + Math.random() * 0.36;
      pollenVel[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
      pollenAge[i] = 0;
      pollenLife[i] = 1.7 + Math.random() * 1.3;
      pollenSize[i] = 0.07 + Math.random() * 0.07;
      pollenGeometry.attributes.aSize.needsUpdate = true;
      return;
    }
  };

  const updatePollen = (dt: number) => {
    let alive = 0;
    for (let i = 0; i < pollenCount; i++) {
      if (pollenAge[i] >= pollenLife[i]) {
        pollenAlpha[i] = 0;
        continue;
      }
      alive++;
      pollenAge[i] += dt;
      const k = pollenAge[i] / pollenLife[i];
      pollenVel[i * 3] += (0.32 - pollenVel[i * 3]) * dt * 0.7;
      pollenVel[i * 3 + 1] *= 1 - dt * 0.55;
      pollenPos[i * 3] += pollenVel[i * 3] * dt;
      pollenPos[i * 3 + 1] += pollenVel[i * 3 + 1] * dt;
      pollenPos[i * 3 + 2] += pollenVel[i * 3 + 2] * dt;
      pollenAlpha[i] = smoothstep(0, 0.12, k) * (1 - smoothstep(0.5, 1, k)) * 0.95;
    }
    if (alive > 0 || pollenAlive > 0) {
      pollenPosAttr.needsUpdate = true;
      pollenAlphaAttr.needsUpdate = true;
    }
    pollenAlive = alive;
  };

  // --- Interaction state ---------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitVec = new THREE.Vector3();
  const prevHit = new THREE.Vector2();
  const smoothedVel = new THREE.Vector2();
  let hasPrevHit = false;
  // Last brush point stamped into the spring field. The field steps at a fixed 60 Hz,
  // so on high-refresh displays the next step sweeps on from here and no stretch of
  // the stroke is dropped between steps.
  const stamp = new THREE.Vector2();
  let hasStamp = false;
  let wakeCursor = 0;
  let lastWakeTime = -10;
  const lastWakePos = new THREE.Vector2(999, 999);

  let time = 0;
  let simFrame = 0;
  let simAccumulator = 0;

  const spawnWake = (x: number, z: number, strength: number) => {
    let slot = wakeCursor;
    let oldest = Infinity;
    for (let i = 0; i < WAKE_SLOTS; i++) {
      const start = wakes[i].w > 0 ? wakes[i].z : -Infinity;
      if (start < oldest) {
        oldest = start;
        slot = i;
      }
    }
    wakes[slot].set(x, z, time, strength);
    wakeCursor = (slot + 1) % WAKE_SLOTS;
  };

  let bleedPx = 0;
  let canvasH = height;
  const resize = (width: number, height: number, bleed = 0) => {
    const frameH = Math.max(height - bleed, 1);
    const aspect = width / frameH;
    bleedPx = bleed;
    canvasH = height;
    framing = applyFraming(camera, aspect, FRAMING);
    applyBleed(camera, width, height, bleed);

    // Plant only what the lens can see: tall phones get a narrow, dense field
    const { needed, spread } = plantingSpread(aspect, camera.fov);
    if (builtSpread === 0 || needed > builtSpread || needed < builtSpread * 0.62) {
      plantFlora(spread);
    }
    lookTarget.set(0, framing.lookY, framing.lookZ);
    camera.lookAt(lookTarget);
    camera.updateMatrixWorld();
    skyMaterial.uniforms.uResolution.value.set(width, frameH);
    skyMaterial.uniforms.uFrameY.value.set(bleed > 0 ? height / frameH : 1, bleed > 0 ? -bleed / frameH : 0);
    skyMaterial.uniforms.uHorizonShift.value = (framing.horizonNdc + 1) * 0.5 - REFERENCE_HORIZON_UV;
    skyMaterial.uniforms.uCloudScale.value = THREE.MathUtils.clamp(aspect / 1.25, 0.52, 1.0);
    pixelRatio.value = gl.getPixelRatio();
  };

  const update = (rawDt: number, input: HeroInput, options: HeroFrameOptions) => {
    const dt = Math.min(rawDt, 0.05);
    const motion = options.motion;
    if (motion) time += dt;
    else time = STILL_TIME;
    shared.uTime.value = time;

    // Rock-steady grounded camera — micro horizontal poise only
    const px = motion && input.active && !input.touch ? THREE.MathUtils.clamp(input.ndc.x, -1, 1) : 0;
    camera.position.x += (px * 0.045 - camera.position.x) * (1 - Math.exp(-dt * 1.6));
    if (!motion) camera.position.x = 0;
    camera.lookAt(lookTarget);
    camera.updateMatrixWorld();

    // Raycast the pointer onto the curved hillside
    let hitValid = false;
    let currLocalX = 0;
    let currLocalZ = 0;
    if (motion && input.active) {
      ndc.set(input.ndc.x, input.ndc.y);
      raycaster.setFromCamera(ndc, camera);
      if (intersectMeadowTerrain(raycaster.ray, hitVec)) {
        currLocalX = hitVec.x - FIELD_MIN_X;
        currLocalZ = hitVec.z - FIELD_MIN_Z;
        hitValid = true;
      }
    }

    if (hitValid) {
      if (hasPrevHit) {
        const rawVx = (currLocalX - prevHit.x) / Math.max(dt, 0.008);
        const rawVz = (currLocalZ - prevHit.y) / Math.max(dt, 0.008);
        const speed = Math.hypot(rawVx, rawVz);
        if (speed < 45) {
          const k = 1 - Math.exp(-dt * 11);
          smoothedVel.x += (THREE.MathUtils.clamp(rawVx, -12, 12) - smoothedVel.x) * k;
          smoothedVel.y += (THREE.MathUtils.clamp(rawVz, -12, 12) - smoothedVel.y) * k;
        } else {
          hasStamp = false; // teleport: start a fresh stroke
        }
      } else {
        hasPrevHit = true;
        smoothedVel.set(0, 0);
      }
      prevHit.set(currLocalX, currLocalZ);

      const speed = smoothedVel.length();
      // Rapid brushing kicks up a couple of sunlit pollen specks
      if (speed > 3.2 && pollenCount > 0) {
        pollenAccumulator += dt * Math.min((speed - 3.2) * 0.9, 4.5);
        while (pollenAccumulator >= 1) {
          pollenAccumulator -= 1;
          spawnPollen(hitVec.x, hitVec.y + 0.35, hitVec.z);
        }
      }

      // Tier 2: analytical damped wakes laid along the stroke
      if (!useFbo) {
        const moved = Math.hypot(hitVec.x - lastWakePos.x, hitVec.z - lastWakePos.y);
        if (moved > 0.38 && time - lastWakeTime > 0.07) {
          spawnWake(hitVec.x, hitVec.z, THREE.MathUtils.clamp(0.35 + speed * 0.06, 0.4, 0.95));
          lastWakePos.set(hitVec.x, hitVec.z);
          lastWakeTime = time;
        }
      }
    } else {
      hasPrevHit = false;
      hasStamp = false;
      smoothedVel.multiplyScalar(Math.exp(-dt * 7));
      lastWakePos.set(999, 999);
    }

    // Taps part the grass in a soft ring (touch devices especially)
    if (motion && input.taps.length > 0) {
      for (const tap of input.taps) {
        ndc.set(tap.x, tap.y);
        raycaster.setFromCamera(ndc, camera);
        if (intersectMeadowTerrain(raycaster.ray, hitVec)) {
          if (!useFbo) spawnWake(hitVec.x, hitVec.z, 0.9);
          if (pollenCount > 0) {
            spawnPollen(hitVec.x, hitVec.y + 0.4, hitVec.z);
            spawnPollen(hitVec.x, hitVec.y + 0.4, hitVec.z);
          }
        }
      }
    }

    if (motion) updatePollen(dt);

    // Step the spring field at a steady 60 Hz
    if (useFbo && simMaterial && simScene && simCamera && fboA && fboB && motion) {
      const fixedStep = 1 / 60;
      simAccumulator += dt;
      let steps = 0;
      while (simAccumulator >= fixedStep && steps < 2) {
        simAccumulator -= fixedStep;
        steps++;
      }
      // Never let a backlog build up behind a slow frame
      simAccumulator = Math.min(simAccumulator, fixedStep);

      if (steps > 0) {
        // Sweep from the last stamped point to the pointer, split evenly across steps
        const fromX = hasStamp ? stamp.x : currLocalX;
        const fromZ = hasStamp ? stamp.y : currLocalZ;
        const previousTarget = gl.getRenderTarget();
        for (let i = 0; i < steps; i++) {
          simFrame++;
          const src = simFrame % 2 === 0 ? fboA : fboB;
          const dst = simFrame % 2 === 0 ? fboB : fboA;
          const a = i / steps;
          const b = (i + 1) / steps;

          simMaterial.uniforms.uPrevState.value = src.texture;
          simMaterial.uniforms.uDt.value = fixedStep;
          simMaterial.uniforms.uPrevMouse.value.set(fromX + (currLocalX - fromX) * a, fromZ + (currLocalZ - fromZ) * a);
          simMaterial.uniforms.uCurrMouse.value.set(fromX + (currLocalX - fromX) * b, fromZ + (currLocalZ - fromZ) * b);
          simMaterial.uniforms.uMouseVel.value.copy(smoothedVel);
          simMaterial.uniforms.uMouseActive.value = hitValid ? 1 : 0;
          simMaterial.uniforms.uReset.value = simFrame <= 2 ? 1 : 0;

          gl.setRenderTarget(dst);
          gl.render(simScene, simCamera);
          shared.uSpringField.value = dst.texture;
        }
        gl.setRenderTarget(previousTarget);
        if (hitValid) {
          stamp.set(currLocalX, currLocalZ);
          hasStamp = true;
        }
      }
    }
  };

  const dispose = () => {
    skyMaterial.dispose();
    skyQuad.geometry.dispose();
    groundMaterial.dispose();
    groundGeometry.dispose();
    grassMaterial.dispose();
    grass.geometry.dispose();
    plumeMaterial.dispose();
    plumes.geometry.dispose();
    flowerMaterial.dispose();
    flowers.geometry.dispose();
    petalsMaterial.dispose();
    petalsGeometry.dispose();
    pollenMaterial.dispose();
    pollenGeometry.dispose();
    simMaterial?.dispose();
    simQuad?.geometry.dispose();
    fboA?.dispose();
    fboB?.dispose();
  };

  resize(width, height);

  return {
    scene,
    camera,
    passes: simScene && simCamera ? [{ scene: simScene, camera: simCamera }] : [],
    horizonUv: () => canvasY((framing.horizonNdc + 1) * 0.5, canvasH, bleedPx),
    resize,
    update,
    dispose,
  };
}

import * as THREE from 'three';
import type { WaterQuality } from './capabilities';
import { GAMUT_GLSL, gamutDefines } from './gamut';
import { applyBleed, applyFraming, canvasY, type CameraFraming, type FramingResult } from './framing';
import type { HeroFrameOptions, HeroInput, HeroScene } from './types';

/*
 * Dark Mode — "Get Your Wish" mirror water stage (hero.md §4).
 * Visual + mathematical foundation preserved from prototype 0d587a4
 * (`water-stage` mode), with the fireworks/moonlit draft modes removed,
 * a Tier 2 analytical ripple path, portrait framing and output dithering.
 */

// Square 1:1 world-space FBO covering the visible obsidian mirror stage
const SEA_MIN_X = -11.0;
const SEA_MIN_Z = -15.5;
const SEA_SPAN = 22.0; // X: [-11, +11], Z: [-15.5, +6.5]

const WAVE_DELTA = 1.12;
const WAVE_PRESSURE = 0.99;
const RIPPLE_SLOTS = 8;
/** Capsule wake radius in sim UV (≈0.34 world units). */
const WAKE_RADIUS = 0.0155;
/** Wake strength per unit of on-screen glide (aspect-corrected NDC per 60 Hz step). */
const WAKE_GAIN_PER_SCREEN = 6.0;
/** Frozen time used under prefers-reduced-motion so the stage renders as a calm still. */
const STILL_TIME = 7.5;

const FRAMING: CameraFraming = {
  position: [0, 1.55, 7.0],
  look: [0, 0.72, -12.0],
  fov: 44,
  portraitFov: 60,
  portraitHorizonNdc: -0.2,
};

// Shared analytical night sky — evaluated by BOTH the sky backdrop and the
// mirror water reflections so every ripple bends a pixel-accurate reflection.
const SHARED_SKY_GLSL = /* glsl */ `
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
      mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbmSky(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < SKY_OCTAVES; i++) {
      v += a * noise2(p);
      p = m * p * 2.04 + vec2(13.1, 29.3);
      a *= 0.5;
    }
    // Keep the 4-octave value range when running the lighter 2-octave mobile sky
    return v * (SKY_OCTAVES < 4 ? 1.25 : 1.0);
  }

  // Sky screen half-width (azimuth-plane units) and height (elevation)
  const float SCREEN_W = 0.44;
  const float SCREEN_H = 0.21;

  // The stage light: a luminous band inside the screen, raised off the waterline to
  // sit just behind the button row, so the scene reads as lit from around the text
  const float LIGHT_Y = 0.05;        // elevation of its peak
  const float LIGHT_UP = 0.05;       // long, soft upper tail
  const float LIGHT_TINT_UP = 0.032; // tight cyan core above the peak
  const float LIGHT_DOWN = 0.062;    // reach down to the waterline
  const float LIGHT_X = 0.3;         // horizontal falloff from the centre
  const float LIGHT_SIDE = 0.32;     // strength left toward the panel's sides

  // Get Your Wish night sky along normalized direction dir (dir.y >= 0)
  vec3 evalGetYourWishSky(vec3 dir, float uTime, float isReflection) {
    float elev = clamp(dir.y, 0.0, 1.0);
    // Perspective horizontal projection onto distant sky plane
    float az = dir.x / max(-dir.z, 0.18);

    // Stark night void (#07080b) -> deep midnight indigo (#0c1220) at the horizon
    vec3 zenith = vec3(0.028, 0.032, 0.044);
    vec3 horizonBase = vec3(0.048, 0.072, 0.125);
    vec3 col = mix(horizonBase, zenith, smoothstep(0.0, 0.42, elev));

    // Quiet sparse starfield
    vec2 starGrid = vec2(az * 24.0, elev * 38.0);
    vec2 sid = floor(starGrid);
    vec2 sf = fract(starGrid) - 0.5;
    float sr = hash12(sid);
    if (sr > 0.968 && elev > 0.04) {
      float dist = length(sf);
      float twinkle = 0.68 + 0.32 * sin(uTime * (1.2 + sr * 2.5) + sr * 50.0);
      float star = (1.0 - smoothstep(0.01, 0.11, dist)) * twinkle * smoothstep(0.04, 0.22, elev);
      col += vec3(0.76, 0.85, 1.0) * star * 0.55;
    }

    // Soft-edged luminous sky screen running right down to the waterline
    vec2 sc = vec2(az, elev - 0.005);
    float panel = (1.0 - smoothstep(SCREEN_W - 0.02, SCREEN_W + 0.06, abs(sc.x)))
      * (1.0 - smoothstep(SCREEN_H - 0.015, SCREEN_H + 0.055, sc.y));

    // The mirror hands back only what the screen emits (Fresnel dims it further),
    // so the sky is never darker than its own reflection
    float reflDim = mix(1.0, 0.9, isReflection);

    // Outside the panel only the bloom and seam remain: skip the cloud noise there
    if (panel > 0.0) {
      // Drifting clouds in saturated blues: vivid at a luminance text can sit on
      float cn = fbmSky(vec2(sc.x * 4.2 - uTime * 0.025, sc.y * 8.5));
      vec3 screenCol = mix(vec3(0.2, 0.52, 0.98), vec3(0.6, 0.84, 1.0), smoothstep(0.32, 0.76, cn));

      // The stage light, strongest at the centre; the clouds it passes through catch
      // it unevenly. Above its peak it eases out along a long stretched-exponential
      // tail instead of a Gaussian shoulder (no visible cut-off under the text), and
      // only its tight core turns cyan, so the tail rises in saturated blue.
      float dy = sc.y - LIGHT_Y + (cn - 0.5) * 0.03;
      float ax = sc.x / LIGHT_X;
      float across = mix(LIGHT_SIDE, 1.0, exp(-ax * ax));
      float u = abs(dy) / (dy > 0.0 ? LIGHT_UP : LIGHT_DOWN);
      float light = exp(-(dy > 0.0 ? pow(u, 1.6) : u * u)) * across;
      float tu = dy / (dy > 0.0 ? LIGHT_TINT_UP : LIGHT_DOWN);
      screenCol = mix(screenCol, vec3(0.58, 0.88, 1.0), exp(-tu * tu) * across * 0.5);

      col += screenCol * panel * (0.36 + 0.62 * light) * reflDim;
    }

    // Bloom spilling out of the panel into the void, centred on the light
    vec2 hq = vec2(sc.x, (sc.y - LIGHT_Y) / 0.32);
    col += vec3(0.1, 0.26, 0.55) * exp(-length(hq) * 2.2) * 0.4 * reflDim;

    // Faint seam where the screen meets the water
    float seam = exp(-pow(elev * 40.0, 2.0)) * (1.0 - smoothstep(SCREEN_W - 0.06, SCREEN_W + 0.05, abs(sc.x)));
    col += vec3(0.6, 0.85, 1.0) * seam * 0.16 * reflDim;

    return col;
  }

  // Direction toward the sky point with screen-plane azimuth p.x and elevation p.y
  vec3 skyPointDir(vec2 p) {
    float y = p.y * sqrt((1.0 + p.x * p.x) / max(1.0 - p.y * p.y, 1e-3));
    return normalize(vec3(p.x, y, -1.0));
  }

  // Gentle highlight shoulder: the stage light's core rolls off instead of clipping flat
  vec3 softClip(vec3 c) {
    vec3 over = max(c - 0.78, 0.0);
    return min(c, 0.78) + 0.22 * (1.0 - exp(-over / 0.22));
  }

  // Sub-LSB dither so the near-black gradients never band on 8-bit displays
  vec3 ditherOut(vec3 col, vec2 fragCoord, float t) {
    float n = hash12(fragCoord + fract(t * 7.13) * 91.7) + hash12(fragCoord.yx * 1.37 + 17.0) - 1.0;
    return col + n * (1.0 / 255.0);
  }
`;

// ---------------------------------------------------------------------------
// 1. Ping-pong wave heightfield (Tier 1)
// ---------------------------------------------------------------------------
const simVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const simFragmentShader = /* glsl */ `
  uniform int iFrame;
  uniform vec2 iPrevMouse;
  uniform vec2 iCurrMouse;
  uniform float iMouseGain;
  uniform float iMouseRadius;
  uniform vec3 iDrop;
  uniform vec2 iResolution;
  uniform sampler2D iChannel0;
  uniform float delta;
  uniform float iPressure;
  varying vec2 vUv;

  float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    if (iFrame <= 2) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec2 uv = vUv;
    vec2 texel = 1.0 / iResolution;

    vec4 curr = texture2D(iChannel0, uv);
    float h = curr.x;
    float v = curr.y;

    float hR = texture2D(iChannel0, uv + vec2(texel.x, 0.0)).x;
    float hL = texture2D(iChannel0, uv - vec2(texel.x, 0.0)).x;
    float hU = texture2D(iChannel0, uv + vec2(0.0, texel.y)).x;
    float hD = texture2D(iChannel0, uv - vec2(0.0, texel.y)).x;

    // Smooth absorbing boundary so waves glide offscreen cleanly
    float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float sponge = smoothstep(0.0, 0.07, edgeDist);

    float laplacian = (hR + hL + hU + hD) * 0.25 - h;
    float dt = clamp(delta, 0.2, 1.4);

    v += dt * laplacian * 1.28;
    h += dt * v;
    v -= 0.0028 * dt * h;
    v *= 1.0 - 0.0032 * dt;
    h *= mix(0.86, iPressure, sponge);

    // Bold continuous capsule wake along the cursor glide
    if (iMouseGain > 0.002) {
      float d = sdSegment(uv, iPrevMouse, iCurrMouse);
      float r = iMouseRadius;
      h += exp(-(d * d) / (r * r)) * iMouseGain;
    }

    // Click splash or quiet ambient droplet
    if (iDrop.z > 0.002) {
      float dd = distance(uv, iDrop.xy);
      float r = 0.019;
      h += exp(-(dd * dd) / (r * r)) * iDrop.z;
    }

    // GLSL ES 1.00-safe rational saturation (never tanh)
    h = h / (1.0 + abs(h) / 2.0);
    v = v / (1.0 + abs(v) / 2.0);

    vec2 grad = vec2((hR - hL) * 0.5, (hU - hD) * 0.5);
    gl_FragColor = vec4(h, v, grad.x, grad.y);
  }
`;

// ---------------------------------------------------------------------------
// 2. Ray-aligned night sky backdrop
// ---------------------------------------------------------------------------
const skyVertexShader = /* glsl */ `
  varying vec2 vNdc;
  void main() {
    vNdc = position.xy;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  ${GAMUT_GLSL}

  uniform float uTime;
  uniform mat4 uInvProj;
  uniform mat4 uCamMatrixWorld;
  varying vec2 vNdc;

  ${SHARED_SKY_GLSL}

  void main() {
    vec4 viewPos = uInvProj * vec4(vNdc, 1.0, 1.0);
    vec3 viewDir = normalize(viewPos.xyz / viewPos.w);
    vec3 worldDir = normalize((uCamMatrixWorld * vec4(viewDir, 0.0)).xyz);
    // Below the horizon, match the far mirror apron exactly so the waterline is seamless
    vec3 col = evalGetYourWishSky(vec3(worldDir.x, max(worldDir.y, 0.005), worldDir.z), uTime, 0.0);
    gl_FragColor = vec4(ditherOut(outputGamut(softClip(col)), gl_FragCoord.xy, uTime), 1.0);
  }
`;

// ---------------------------------------------------------------------------
// 3. Mirror-obsidian shallow water stage
// ---------------------------------------------------------------------------
const waterVertexShader = /* glsl */ `
  uniform sampler2D uRippleMap;
  uniform vec2 uSeaMin;
  uniform float uSeaSpan;

  varying vec3 vWorldPos;
  varying vec2 vSimUv;
  varying float vDist;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec2 simUv = (worldPos.xz - uSeaMin) / uSeaSpan;

  #ifdef USE_RIPPLE_FBO
    float simMask =
      smoothstep(0.0, 0.07, simUv.x) * smoothstep(0.0, 0.07, 1.0 - simUv.x) *
      smoothstep(0.0, 0.07, simUv.y) * smoothstep(0.0, 0.07, 1.0 - simUv.y);
    float rippleH = texture2D(uRippleMap, clamp(simUv, 0.0, 1.0)).x * simMask;
    worldPos.y += rippleH * 0.19;
  #endif

    vWorldPos = worldPos.xyz;
    vSimUv = simUv;

    vec4 mvPos = viewMatrix * worldPos;
    vDist = -mvPos.z;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const waterFragmentShader = /* glsl */ `
  ${GAMUT_GLSL}

  uniform float uTime;
  uniform sampler2D uRippleMap;
  uniform float uSimTexel;
  uniform vec4 uRipples[${RIPPLE_SLOTS}];

  varying vec3 vWorldPos;
  varying vec2 vSimUv;
  varying float vDist;

  ${SHARED_SKY_GLSL}

  // Whisper-subtle organic surface tension (no blocky sine swells)
  vec2 subtleMicroTension(vec2 p, float t) {
    vec2 drift = vec2(t * 0.07, -t * 0.05);
    float n1 = fbmSky(p * 0.35 + drift);
    float n2 = fbmSky(p * 0.35 + vec2(0.08, 0.0) + drift);
    float n3 = fbmSky(p * 0.35 + vec2(0.0, 0.08) + drift);
    return vec2(n2 - n1, n3 - n1) * 0.22;
  }

  void main() {
    float t = uTime;

  #ifdef USE_RIPPLE_FBO
    // Smooth 5-tap filtered gradient from the wave simulation
    float simMask =
      smoothstep(0.0, 0.07, vSimUv.x) * smoothstep(0.0, 0.07, 1.0 - vSimUv.x) *
      smoothstep(0.0, 0.07, vSimUv.y) * smoothstep(0.0, 0.07, 1.0 - vSimUv.y);
    vec2 uv = clamp(vSimUv, 0.002, 0.998);
    float eps = uSimTexel;
    vec2 gC = texture2D(uRippleMap, uv).zw;
    vec2 gX = texture2D(uRippleMap, uv + vec2(eps, 0.0)).zw + texture2D(uRippleMap, uv - vec2(eps, 0.0)).zw;
    vec2 gY = texture2D(uRippleMap, uv + vec2(0.0, eps)).zw + texture2D(uRippleMap, uv - vec2(0.0, eps)).zw;
    vec2 rippleGrad = ((gC * 2.0 + gX + gY) / 6.0) * simMask * 4.4;
  #else
    // Tier 2: analytical ring buffer of travelling circular waves
    vec2 rippleGrad = vec2(0.0);
    for (int i = 0; i < ${RIPPLE_SLOTS}; i++) {
      vec4 rp = uRipples[i];
      if (rp.w > 0.001) {
        vec2 d = vWorldPos.xz - rp.xy;
        float r = length(d);
        float age = t - rp.z;
        float waveFront = r - age * 2.6;
        float env = exp(-waveFront * waveFront * 2.8) * exp(-age * 1.15) * smoothstep(0.0, 0.08, age);
        float dWave = cos(waveFront * 9.5) * env * rp.w;
        rippleGrad += (d / max(r, 0.001)) * dWave * 0.62;
      }
    }
  #endif

    // Far water settles into a still, perfect mirror (no grazing-angle shimmer),
    // so the screen meets its own reflection exactly on the waterline
    float calm = smoothstep(16.0, 46.0, vDist);
    // Fully calm far water drops the micro-tension noise entirely
    vec2 microGrad = calm < 1.0 ? subtleMicroTension(vWorldPos.xz, t) : vec2(0.0);
    vec2 totalGrad = (microGrad + rippleGrad) * (1.0 - calm);

    vec3 N = normalize(vec3(-totalGrad.x, 1.0, -totalGrad.y));
    vec3 V = normalize(cameraPosition - vWorldPos);

    // Planar reflection vector bent by every ripple
    vec3 R = reflect(-V, N);
    R.y = abs(R.y);
    vec3 reflectedSky = evalGetYourWishSky(R, t, 1.0);

    // Glassy obsidian Fresnel — a polished stage floor mirrors more strongly than
    // open water, yet never above 1, so no reflection outshines its source
    float ndotv = max(dot(N, V), 0.0);
    float fresnel = 0.3 + 0.7 * pow(1.0 - ndotv, 2.6);

    vec3 waterBody = vec3(0.012, 0.016, 0.026);
    vec3 col = mix(waterBody, reflectedSky, fresnel);

    // Every highlight is lit by the screen itself (an area light), never a point
    // source: glitter where ripple facets catch the stage light's band behind the
    // text, and a soft rim where slopes face the panel.
    float rippleSlope = length(rippleGrad) * (1.0 - calm);
    vec2 scR = vec2(R.x / max(-R.z, 0.18), R.y - 0.005);
    vec3 lightL = skyPointDir(vec2(clamp(scR.x, -SCREEN_W * 0.7, SCREEN_W * 0.7), LIGHT_Y));
    vec3 panelL = skyPointDir(clamp(scR, vec2(-SCREEN_W, 0.0), vec2(SCREEN_W, SCREEN_H)) + vec2(0.0, 0.005));
    vec3 fillL = normalize(vec3(0.25, 0.72, 0.65));

    float lightGlint = pow(max(dot(N, normalize(lightL + V)), 0.0), 80.0)
      * (0.12 + min(rippleSlope * 2.6, 1.8)) * (1.0 - calm);
    float rippleRim = smoothstep(0.015, 0.28, rippleSlope);
    float panelRim = pow(max(dot(N, normalize(panelL + V)), 0.0), 26.0) * rippleRim;
    float fillRim = pow(max(dot(N, normalize(fillL + V)), 0.0), 26.0) * rippleRim;

    vec3 iceBlue = vec3(0.56, 0.76, 1.0);
    vec3 crispSilver = vec3(0.95, 0.98, 1.0);
    col += mix(iceBlue, crispSilver, 0.65) * lightGlint * 0.55;
    col += mix(iceBlue, crispSilver, 0.45) * (panelRim * 0.42 + fillRim * 0.18);

    gl_FragColor = vec4(ditherOut(outputGamut(softClip(col)), gl_FragCoord.xy, t), 1.0);
  }
`;

function makeSimTarget(res: number) {
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

export function createNightWaterStage(
  gl: THREE.WebGLRenderer,
  quality: WaterQuality,
  width: number,
  height: number
): HeroScene {
  const useFbo = quality.simRes > 0;
  const simRes = quality.simRes;
  // Shared by the sky + water colour passes (the wave sim has its own material)
  const defines: Record<string, string | number> = { SKY_OCTAVES: quality.skyOctaves, ...gamutDefines(quality.p3Vivid) };
  if (useFbo) defines.USE_RIPPLE_FBO = '';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FRAMING.fov, 1, 0.1, 360);
  let framing: FramingResult = applyFraming(camera, 16 / 9, FRAMING);
  const lookTarget = new THREE.Vector3(0, framing.lookY, framing.lookZ);
  camera.lookAt(lookTarget);

  // --- Wave simulation (Tier 1) -------------------------------------------
  let fboA: THREE.WebGLRenderTarget | null = null;
  let fboB: THREE.WebGLRenderTarget | null = null;
  let simScene: THREE.Scene | null = null;
  let simCamera: THREE.OrthographicCamera | null = null;
  let simMaterial: THREE.ShaderMaterial | null = null;
  let simQuad: THREE.Mesh | null = null;

  if (useFbo) {
    fboA = makeSimTarget(simRes);
    fboB = makeSimTarget(simRes);
    simScene = new THREE.Scene();
    simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    simMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertexShader,
      fragmentShader: simFragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        iFrame: { value: 0 },
        iPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
        iCurrMouse: { value: new THREE.Vector2(0.5, 0.5) },
        iMouseGain: { value: 0 },
        iMouseRadius: { value: WAKE_RADIUS },
        iDrop: { value: new THREE.Vector3(0.5, 0.5, 0) },
        iResolution: { value: new THREE.Vector2(simRes, simRes) },
        iChannel0: { value: null },
        delta: { value: WAVE_DELTA },
        iPressure: { value: WAVE_PRESSURE },
      },
    });
    simQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial);
    simQuad.frustumCulled = false;
    simScene.add(simQuad);
  }

  // --- Sky backdrop --------------------------------------------------------
  const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    defines,
    depthWrite: false,
    // Drawn last at the far plane: early-z skips every sky pixel behind the water
    depthTest: true,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uInvProj: { value: new THREE.Matrix4() },
      uCamMatrixWorld: { value: new THREE.Matrix4() },
    },
  });
  const skyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMaterial);
  skyQuad.frustumCulled = false;
  skyQuad.renderOrder = 10;
  scene.add(skyQuad);

  // --- Mirror water --------------------------------------------------------
  const ripples = Array.from({ length: RIPPLE_SLOTS }, () => new THREE.Vector4(0, 0, -100, 0));
  const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    defines,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uRippleMap: { value: fboA ? fboA.texture : null },
      uSimTexel: { value: useFbo ? 1 / simRes : 0 },
      uSeaMin: { value: new THREE.Vector2(SEA_MIN_X, SEA_MIN_Z) },
      uSeaSpan: { value: SEA_SPAN },
      uRipples: { value: ripples },
    },
  });
  const waterGeometry = new THREE.PlaneGeometry(58, 38, quality.segX, quality.segZ);
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0, -9.5);
  water.frustumCulled = false;
  scene.add(water);

  // Far mirror apron: carries the same glassy surface from the prototype stage's
  // far edge (z = -28.5) out toward the horizon, so the sky aperture rests right
  // on the waterline instead of floating above a strip of below-horizon sky.
  const apronGeometry = new THREE.PlaneGeometry(900, 272, 12, 12);
  const apron = new THREE.Mesh(apronGeometry, waterMaterial);
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(0, 0, -28.5 - 136 + 0.01);
  apron.frustumCulled = false;
  scene.add(apron);

  // --- Interaction state ---------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const seaPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const seaHit = new THREE.Vector3();
  const ndc = new THREE.Vector2();

  // Pointer eased in screen space (~25 ms) so 125 Hz mice glide on high-refresh displays
  const pointer = new THREE.Vector2();
  let hasPointer = false;

  // Last glide point actually stamped into the wave field. The sim runs at a fixed
  // 60 Hz, so on 120–240 Hz displays several frames pass between steps; each step
  // sweeps its capsule on from here, so no stretch of the glide is ever dropped.
  const stampUv = new THREE.Vector2();
  const stampNdc = new THREE.Vector2();
  let hasStamp = false;
  // Splashes wait here for the next sim step instead of being lost between steps
  const pendingDrops: THREE.Vector3[] = [];

  let aspect = width / Math.max(height, 1);
  // Canvas px per composed-frame px (> 1 only with a bottom bleed): keeps on-screen
  // glide measured against the composed frame, exactly as without the run-off
  let glideScale = 1;
  let bleedPx = 0;
  let canvasH = height;
  let time = 0;
  let simFrame = 0;
  let simAccumulator = 0;
  let nextAmbientDrop = 0.8;
  let rippleCursor = 0;
  let lastWakeRippleTime = -10;
  const lastWakeRippleNdc = new THREE.Vector2();
  let hasWakeRipple = false;

  const projectToSea = (x: number, y: number): THREE.Vector2 | null => {
    ndc.set(x, y);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.direction.y < -0.015 && raycaster.ray.intersectPlane(seaPlane, seaHit)) {
      return new THREE.Vector2(seaHit.x, seaHit.z);
    }
    return null;
  };

  const spawnRipple = (x: number, z: number, amplitude: number) => {
    // Overwrite the oldest slot of the analytical ring buffer
    let slot = rippleCursor;
    let oldest = Infinity;
    for (let i = 0; i < RIPPLE_SLOTS; i++) {
      const start = ripples[i].w > 0 ? ripples[i].z : -Infinity;
      if (start < oldest) {
        oldest = start;
        slot = i;
      }
    }
    ripples[slot].set(x, z, time, amplitude);
    rippleCursor = (slot + 1) % RIPPLE_SLOTS;
  };

  const queueDrop = (u: number, v: number, strength: number) => {
    if (pendingDrops.length < 4) pendingDrops.push(new THREE.Vector3(u, v, strength));
  };

  const resize = (w: number, h: number, bleed = 0) => {
    const frameH = Math.max(h - bleed, 1);
    aspect = w / Math.max(h, 1);
    glideScale = bleed > 0 ? h / frameH : 1;
    bleedPx = bleed;
    canvasH = h;
    framing = applyFraming(camera, w / frameH, FRAMING);
    applyBleed(camera, w, h, bleed);
    lookTarget.set(0, framing.lookY, framing.lookZ);
    camera.lookAt(lookTarget);
    camera.updateMatrixWorld();
  };

  const update = (rawDt: number, input: HeroInput, options: HeroFrameOptions) => {
    const dt = Math.min(rawDt, 0.05);
    const motion = options.motion;
    if (motion) time += dt;
    else time = STILL_TIME;

    skyMaterial.uniforms.uTime.value = time;
    waterMaterial.uniforms.uTime.value = time;

    // Grounded eye-level studio poise: zero vertical bounce, whisper horizontal drift
    const px = motion && input.active && !input.touch ? THREE.MathUtils.clamp(input.ndc.x, -1, 1) : 0;
    const targetX = px * 0.05;
    camera.position.x += (targetX - camera.position.x) * (1 - Math.exp(-dt * 1.8));
    if (!motion) camera.position.x = 0;
    camera.lookAt(lookTarget);
    camera.updateMatrixWorld();
    skyMaterial.uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
    skyMaterial.uniforms.uCamMatrixWorld.value.copy(camera.matrixWorld);

    // --- Pointer onto the mirror plane ------------------------------------
    let inSea = false;
    let currU = 0.5;
    let currV = 0.5;
    let hitDist = 10;

    if (motion && input.active) {
      if (!hasPointer) {
        pointer.set(input.ndc.x, input.ndc.y);
        hasPointer = true;
      } else {
        const k = 1 - Math.exp(-dt * 40);
        pointer.x += (input.ndc.x - pointer.x) * k;
        pointer.y += (input.ndc.y - pointer.y) * k;
      }
      const hit = projectToSea(pointer.x, pointer.y);
      if (hit) {
        const u = (hit.x - SEA_MIN_X) / SEA_SPAN;
        const v = (hit.y - SEA_MIN_Z) / SEA_SPAN;
        if (u > 0.03 && u < 0.97 && v > 0.03 && v < 0.97) {
          inSea = true;
          currU = u;
          currV = v;
          hitDist = camera.position.distanceTo(seaHit);
        }
      }
    } else {
      hasPointer = false;
    }
    if (!inSea) {
      hasStamp = false;
      hasWakeRipple = false;
    }

    // Wakes are sized by on-screen glide rather than world distance, so drifting up
    // toward the horizon (where one pixel spans a lot of water) feels as even as
    // gliding sideways. Distant wakes are a touch wider and softer so they still read.
    const depthT = THREE.MathUtils.smoothstep(hitDist, 9, 22);
    const wakeRadius = WAKE_RADIUS * (1 + depthT * 0.5);
    const wakeAtten = 1 - depthT * 0.35;

    // Tier 2: analytical wake rings laid along the glide, spaced evenly on screen
    if (!useFbo && inSea) {
      if (!hasWakeRipple) {
        lastWakeRippleNdc.copy(pointer);
        hasWakeRipple = true;
      } else {
        const moved = Math.hypot((pointer.x - lastWakeRippleNdc.x) * aspect, pointer.y - lastWakeRippleNdc.y) * glideScale;
        if (moved > 0.1 && time - lastWakeRippleTime > 0.12) {
          const amp = moved > 0.6 ? 0.3 : THREE.MathUtils.clamp(0.22 + moved * 0.75, 0.24, 0.5);
          spawnRipple(SEA_MIN_X + currU * SEA_SPAN, SEA_MIN_Z + currV * SEA_SPAN, amp * wakeAtten);
          lastWakeRippleNdc.copy(pointer);
          lastWakeRippleTime = time;
        }
      }
    }

    // --- Click / tap splash or quiet ambient droplet ------------------------
    if (motion && input.taps.length > 0) {
      for (const tap of input.taps) {
        const tapHit = projectToSea(tap.x, tap.y);
        if (!tapHit) continue;
        const u = (tapHit.x - SEA_MIN_X) / SEA_SPAN;
        const v = (tapHit.y - SEA_MIN_Z) / SEA_SPAN;
        if (u > 0.04 && u < 0.96 && v > 0.04 && v < 0.96) {
          if (useFbo) queueDrop(u, v, 0.92);
          else spawnRipple(tapHit.x, tapHit.y, 0.92);
        }
      }
    } else if (motion && time > nextAmbientDrop) {
      nextAmbientDrop = time + 2.5 + Math.random() * 2.4;
      const u = 0.28 + Math.random() * 0.44;
      const v = 0.34 + Math.random() * 0.46;
      if (useFbo) queueDrop(u, v, 0.32);
      else spawnRipple(SEA_MIN_X + u * SEA_SPAN, SEA_MIN_Z + v * SEA_SPAN, 0.32);
    }

    // --- Fixed 60 Hz ping-pong wave step (max 2 substeps / frame) ------------
    if (useFbo && simMaterial && simScene && simCamera && fboA && fboB) {
      if (!motion) return;
      const fixedStep = 1 / 60;
      simAccumulator += dt;
      let steps = 0;
      while (simAccumulator >= fixedStep && steps < 2) {
        simAccumulator -= fixedStep;
        steps++;
      }
      // Never let a backlog build up behind a slow frame
      simAccumulator = Math.min(simAccumulator, fixedStep);
      if (steps === 0) return;

      // Sweep from the last stamped point to the pointer, split evenly across steps
      let fromU = currU;
      let fromV = currV;
      let glide = 0;
      let entering = false;
      if (inSea) {
        if (hasStamp && Math.hypot(currU - stampUv.x, currV - stampUv.y) < 0.4) {
          fromU = stampUv.x;
          fromV = stampUv.y;
          glide = Math.hypot((pointer.x - stampNdc.x) * aspect, pointer.y - stampNdc.y) * glideScale;
        } else {
          entering = true;
        }
      }

      const previousTarget = gl.getRenderTarget();
      for (let i = 0; i < steps; i++) {
        simFrame++;
        const src = simFrame % 2 === 0 ? fboA : fboB;
        const dst = simFrame % 2 === 0 ? fboB : fboA;
        const a = i / steps;
        const b = (i + 1) / steps;

        let gain = 0;
        if (entering) {
          gain = i === 0 ? 0.24 : 0; // crisp entry ring
        } else if (inSea && glide > 0.0008) {
          gain = THREE.MathUtils.clamp((glide / steps) * WAKE_GAIN_PER_SCREEN, 0.14, 0.62) * wakeAtten;
        }
        const drop = pendingDrops.shift();

        simMaterial.uniforms.iFrame.value = simFrame;
        simMaterial.uniforms.iPrevMouse.value.set(fromU + (currU - fromU) * a, fromV + (currV - fromV) * a);
        simMaterial.uniforms.iCurrMouse.value.set(fromU + (currU - fromU) * b, fromV + (currV - fromV) * b);
        simMaterial.uniforms.iMouseGain.value = gain;
        simMaterial.uniforms.iMouseRadius.value = wakeRadius;
        if (drop) simMaterial.uniforms.iDrop.value.copy(drop);
        else simMaterial.uniforms.iDrop.value.set(0.5, 0.5, 0);
        simMaterial.uniforms.iChannel0.value = src.texture;

        gl.setRenderTarget(dst);
        gl.render(simScene, simCamera);
        waterMaterial.uniforms.uRippleMap.value = dst.texture;
      }
      gl.setRenderTarget(previousTarget);

      if (inSea) {
        stampUv.set(currU, currV);
        stampNdc.copy(pointer);
        hasStamp = true;
      }
    }
  };

  const dispose = () => {
    skyMaterial.dispose();
    skyQuad.geometry.dispose();
    waterMaterial.dispose();
    waterGeometry.dispose();
    apronGeometry.dispose();
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

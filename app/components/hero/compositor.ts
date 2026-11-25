import * as THREE from 'three';
import type { HeroTheme } from './types';

/** Shared with the CSS side so NavBar + HeroOverlay move on the exact same curve. */
export const HERO_TRANSITION_MS = 520;

/** cubic-bezier(0.22, 1, 0.36, 1) — evaluated with a few Newton steps. */
export function heroEase(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const x1 = 0.22;
  const y1 = 1;
  const x2 = 0.36;
  const y2 = 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const err = sampleX(t) - x;
    if (Math.abs(err) < 1e-5) break;
    const d = sampleDX(t);
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  t = Math.min(1, Math.max(0, t));
  return ((ay * t + by) * t + cy) * t;
}

const compositeVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/*
 * Twilight / horizon-sweep dissolve instead of a muddy 50/50 mix:
 *  • Day → Night: night falls from the zenith down to the horizon with a
 *    soft dusky rose-violet band riding the edge.
 *  • Night → Day: dawn light rises outward from the horizon line with a warm
 *    gold band, revealing the meadow above and below.
 */
const compositeFragmentShader = /* glsl */ `
  uniform sampler2D tFrom;
  uniform sampler2D tTo;
  uniform float uProgress;
  uniform float uDawn;
  uniform float uHorizon;
  uniform float uAspect;

  varying vec2 vUv;

  float hashC(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noiseC(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hashC(i), hashC(i + vec2(1.0, 0.0)), u.x),
      mix(hashC(i + vec2(0.0, 1.0)), hashC(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec3 a = texture2D(tFrom, vUv).rgb;
    vec3 b = texture2D(tTo, vUv).rgb;
    float p = uProgress;

    // Organic, slowly-morphing wave edge
    float x = vUv.x * uAspect;
    float wave = (noiseC(vec2(x * 2.2, p * 1.6)) - 0.5) * 0.11
      + sin(x * 3.1 + p * 2.4) * 0.018;

    float soft = 0.16;
    float sweep;
    if (uDawn > 0.5) {
      // Normalised distance from the horizon (0 on the line, 1 at screen edge).
      // Below the horizon dawn travels four times as fast: the whole meadow lights
      // up together with the horizon, and only the sky keeps the slow rise.
      float d = vUv.y > uHorizon
        ? (vUv.y - uHorizon) / max(1.0 - uHorizon, 0.001)
        : (uHorizon - vUv.y) / max(uHorizon, 0.001) * 0.25;
      d = d * 0.82 + wave;
      float edge = mix(-soft - 0.12, 1.0 + soft + 0.12, p);
      sweep = 1.0 - smoothstep(edge - soft, edge + soft, d);
    } else {
      float y = vUv.y + wave;
      float edge = mix(1.0 + soft + 0.12, -soft - 0.12, p);
      sweep = smoothstep(edge - soft, edge + soft, y);
    }

    // Blend a little global opacity in so no pixel ever snaps
    float m = clamp(sweep * 0.8 + p * 0.2, 0.0, 1.0);
    vec3 col = mix(a, b, m);

    // Atmospheric twilight band riding the sweep edge
    float band = sweep * (1.0 - sweep) * 4.0;
    vec3 dusk = vec3(0.86, 0.58, 0.66);
    vec3 dawn = vec3(1.0, 0.84, 0.58);
    vec3 tint = uDawn > 0.5 ? dawn : dusk;
    col = mix(col, col * tint * 1.12 + tint * 0.06, band * 0.32);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface CompositorPass {
  material: THREE.ShaderMaterial;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  dispose(): void;
}

export function createCompositePass(): CompositorPass {
  const material = new THREE.ShaderMaterial({
    vertexShader: compositeVertexShader,
    fragmentShader: compositeFragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      tFrom: { value: null },
      tTo: { value: null },
      uProgress: { value: 0 },
      uDawn: { value: 0 },
      uHorizon: { value: 0.5 },
      uAspect: { value: 1.78 },
    },
  });
  const scene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return {
    material,
    scene,
    camera,
    dispose() {
      material.dispose();
      quad.geometry.dispose();
    },
  };
}

export function themeToDawn(to: HeroTheme): number {
  return to === 'light' ? 1 : 0;
}

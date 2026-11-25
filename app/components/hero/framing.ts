import * as THREE from 'three';

export interface CameraFraming {
  /** Grounded eye-level camera position (landscape reference). */
  position: THREE.Vector3Tuple;
  /** Landscape reference look target — defines the validated horizon placement. */
  look: THREE.Vector3Tuple;
  fov: number;
  /** Vertical FOV used on tall portrait phones (aspect ≲ 0.62). */
  portraitFov: number;
  /** NDC y of the horizon on tall portrait phones (negative = below centre). */
  portraitHorizonNdc: number;
}

export interface FramingResult {
  /** Downward pitch in radians (negative = looking slightly up). */
  pitch: number;
  /** NDC y where the true horizon lands. */
  horizonNdc: number;
  lookY: number;
  lookZ: number;
}

const DEG = Math.PI / 180;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Keeps the validated landscape composition on desktop, and on portrait phones
 * (aspect < 0.85) widens the vertical FOV + re-pitches so the horizon settles
 * in the lower ~38–42% of the screen, clear of the stacked headline and buttons.
 */
export function applyFraming(
  camera: THREE.PerspectiveCamera,
  aspect: number,
  spec: CameraFraming
): FramingResult {
  const portrait = smoothstep(0.95, 0.62, aspect);
  const fov = THREE.MathUtils.lerp(spec.fov, spec.portraitFov, portrait);

  const [px, py, pz] = spec.position;
  const [, ly, lz] = spec.look;
  const reach = pz - lz;
  const landscapePitch = Math.atan2(py - ly, reach);
  const landscapeHorizonNdc = Math.tan(landscapePitch) / Math.tan((spec.fov / 2) * DEG);
  const horizonNdc = THREE.MathUtils.lerp(landscapeHorizonNdc, spec.portraitHorizonNdc, portrait);
  const pitch = Math.atan(horizonNdc * Math.tan((fov / 2) * DEG));

  camera.fov = fov;
  camera.aspect = aspect;
  camera.position.set(px, py, pz);
  camera.updateProjectionMatrix();

  return { pitch, horizonNdc, lookY: py - Math.tan(pitch) * reach, lookZ: pz - reach };
}

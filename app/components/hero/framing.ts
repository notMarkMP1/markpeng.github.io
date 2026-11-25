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

/**
 * Bottom run-off: the canvas is `bleed` px taller than the frame the scene is composed
 * for (`height - bleed`, framed by applyFraming above). The lens simply sees further
 * down into the foreground there; everything above stays exactly where it was.
 */
export function applyBleed(camera: THREE.PerspectiveCamera, width: number, height: number, bleed: number) {
  if (bleed > 0) camera.setViewOffset(width, height - bleed, 0, 0, width, height);
  else camera.clearViewOffset();
}

/**
 * Canvas-space (0 = bottom, 1 = top) y of a point at `frameY` within the composed
 * frame, when the canvas runs `bleed` px further down.
 */
export function canvasY(frameY: number, height: number, bleed: number) {
  return bleed > 0 ? (bleed + frameY * (height - bleed)) / height : frameY;
}

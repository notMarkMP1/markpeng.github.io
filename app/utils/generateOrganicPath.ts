/**
 * Pure-RNG procedural organic SVG path generator inspired by Porter Robinson's
 * "Nurture" era gestural scribbles (Samuel Burgess-Johnson).
 *
 * Produces a unique, continuous, hand-drawn tangled line on every seed through
 * a viewBox of 800×1200 across four distinct gestural personalities:
 * - 'loose' : Airy, buoyant, round calligraphic loops (closest to llline.svg)
 * - 'crisp' : Expressive mix of sweeping arcs and snappy pen-flick turns
 * - 'whip'  : Tall elongated vertical ribbons with crisp whip-back apexes
 * - 'sharp' : Taut, faceted "Get Your Wish"-style scribbles with rapid vertical
 *             cross-hatching framed by wide sweeping outer strokes
 */

// Mulberry32 — fast, seedable 32-bit PRNG
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ScribbleComposition = 'auto' | 'central' | 'double-knot' | 'cascade';
export type ScribbleStyle = 'auto' | 'loose' | 'crisp' | 'whip' | 'sharp';

export interface OrganicPathOptions {
  /** Deterministic seed — same seed always produces the same path. */
  seed?: number;
  /** Macro silhouette; defaults to 'auto' (picked by seed). */
  composition?: ScribbleComposition;
  /** Stroke personality; defaults to 'auto' (varies from loose & round to sharp & taut). */
  style?: ScribbleStyle;
  /** Overall tangle density multiplier (default 1.0; try 0.75–1.35). */
  density?: number;
}

/** Generate a fresh non-deterministic 32-bit seed (call on the client only). */
export function createRandomSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] || 1;
  }
  return Math.floor(Math.random() * 0xffffffff) || 1;
}

interface Waypoint {
  x: number;
  y: number;
  /** Local curve softness in [0, 1.1] (0 = straight corner, 1 = full round Catmull-Rom). */
  softness: number;
}

/** Softly compress values toward [min, max] using tanh so strokes never clip flat. */
function softClamp(val: number, min: number, max: number, margin = 60): number {
  const innerMin = min + margin;
  const innerMax = max - margin;
  if (val < innerMin) {
    return innerMin - margin * Math.tanh((innerMin - val) / margin);
  }
  if (val > innerMax) {
    return innerMax + margin * Math.tanh((val - innerMax) / margin);
  }
  return val;
}

/**
 * Calculates cubic Bezier control points from 4 Catmull-Rom waypoints,
 * modulated per endpoint by its `softness` factor so a single scribble
 * can smoothly transition between buoyant round loops and crisp pen-flicks.
 */
function modulatedCatmullRomToBezier(
  p0: Waypoint,
  p1: Waypoint,
  p2: Waypoint,
  p3: Waypoint,
  alpha: number
): [number, number, number, number] {
  const dt0 = Math.pow(Math.hypot(p1.x - p0.x, p1.y - p0.y), alpha);
  const dt1 = Math.pow(Math.hypot(p2.x - p1.x, p2.y - p1.y), alpha);
  const dt2 = Math.pow(Math.hypot(p3.x - p2.x, p3.y - p2.y), alpha);

  const eps = 1e-4;
  const t0 = 0;
  const t1 = t0 + (dt0 < eps ? eps : dt0);
  const t2 = t1 + (dt1 < eps ? eps : dt1);
  const t3 = t2 + (dt2 < eps ? eps : dt2);

  const m1x =
    (p1.x - p0.x) / (t1 - t0) -
    (p2.x - p0.x) / (t2 - t0) +
    (p2.x - p1.x) / (t2 - t1);
  const m1y =
    (p1.y - p0.y) / (t1 - t0) -
    (p2.y - p0.y) / (t2 - t0) +
    (p2.y - p1.y) / (t2 - t1);

  const m2x =
    (p2.x - p1.x) / (t2 - t1) -
    (p3.x - p1.x) / (t3 - t1) +
    (p3.x - p2.x) / (t3 - t2);
  const m2y =
    (p2.y - p1.y) / (t2 - t1) -
    (p3.y - p1.y) / (t3 - t1) +
    (p3.y - p2.y) / (t3 - t2);

  const s1 = (dt1 / 3) * p1.softness;
  const s2 = (dt1 / 3) * p2.softness;

  return [
    p1.x + s1 * m1x,
    p1.y + s1 * m1y,
    p2.x - s2 * m2x,
    p2.y - s2 * m2y,
  ];
}

interface KnotSpec {
  cx: number;
  cyStart: number;
  cyEnd: number;
  rxScale: number;
  ryScale: number;
  steps: number;
  tilt: number;
}

interface StyleParams {
  alpha: number;
  baseSoftness: [number, number];
  /** Angle dot threshold below which we bow hairpins out into round shoulders (null = allow sharp turns). */
  shoulderThreshold: number | null;
  minDist: number;
  stepAngle: [number, number];
  /** Probability of a rapid vertical/diagonal pen-slash burst (signature Get Your Wish move). */
  slashProb: number;
  /** Probability of a tall vertical rebound sweep. */
  reboundProb: number;
  /** Extra vertical stretch for ribbon-like styles. */
  verticalStretch: number;
  stepMultiplier: number;
}

const STYLE_CONFIG: Record<Exclude<ScribbleStyle, 'auto'>, StyleParams> = {
  loose: {
    alpha: 0.25,
    baseSoftness: [0.95, 1.05],
    shoulderThreshold: -0.68,
    minDist: 108,
    stepAngle: [1.05, 1.64],
    slashProb: 0,
    reboundProb: 0.13,
    verticalStretch: 1.0,
    stepMultiplier: 1.0,
  },
  crisp: {
    alpha: 0.5,
    baseSoftness: [0.42, 0.85],
    shoulderThreshold: -0.86,
    minDist: 96,
    stepAngle: [1.28, 1.95],
    slashProb: 0.1,
    reboundProb: 0.18,
    verticalStretch: 1.05,
    stepMultiplier: 1.05,
  },
  whip: {
    alpha: 0.38,
    baseSoftness: [0.58, 0.98],
    shoulderThreshold: -0.92,
    minDist: 116,
    stepAngle: [1.18, 1.78],
    slashProb: 0.04,
    reboundProb: 0.24,
    verticalStretch: 1.24,
    stepMultiplier: 0.88,
  },
  sharp: {
    alpha: 0.55,
    baseSoftness: [0.06, 0.26],
    shoulderThreshold: null,
    minDist: 92,
    stepAngle: [1.38, 2.15],
    slashProb: 0.18,
    reboundProb: 0.18,
    verticalStretch: 1.1,
    stepMultiplier: 1.18,
  },
};

/**
 * Generate a pure-RNG Nurture-inspired organic SVG path `d` string in an 800×1200 viewBox.
 */
export function generateOrganicPath(options: OrganicPathOptions = {}): string {
  const {
    seed = 42,
    composition = 'auto',
    style = 'auto',
    density = 1.0,
  } = options;
  const next = mulberry32(seed);
  const rand = (min: number, max: number) => min + next() * (max - min);
  const pickSign = () => (next() < 0.5 ? -1 : 1);

  // Pick style personality
  let activeStyle: Exclude<ScribbleStyle, 'auto'>;
  if (style !== 'auto') {
    activeStyle = style;
  } else {
    const sr = next();
    if (sr < 0.35) activeStyle = 'loose';
    else if (sr < 0.65) activeStyle = 'crisp';
    else if (sr < 0.82) activeStyle = 'whip';
    else activeStyle = 'sharp';
  }
  const cfg = STYLE_CONFIG[activeStyle];

  // Pick macro composition
  let mode: Exclude<ScribbleComposition, 'auto'>;
  if (composition !== 'auto') {
    mode = composition;
  } else {
    const r = next();
    if (r < 0.48) mode = 'central';
    else if (r < 0.78) mode = 'double-knot';
    else mode = 'cascade';
  }

  const spineX = rand(365, 425);
  const effectiveDensity = density * cfg.stepMultiplier;

  const knots: KnotSpec[] = [];
  if (mode === 'central') {
    knots.push({
      cx: spineX + rand(-18, 18),
      cyStart: rand(305, 370),
      cyEnd: rand(775, 850),
      rxScale: rand(0.95, 1.15),
      ryScale: rand(1.0, 1.2) * cfg.verticalStretch,
      steps: Math.round(rand(20, 26) * effectiveDensity),
      tilt: rand(-0.42, 0.42),
    });
  } else if (mode === 'double-knot') {
    const shift = pickSign() * rand(22, 52);
    knots.push({
      cx: spineX + shift,
      cyStart: rand(260, 320),
      cyEnd: rand(445, 505),
      rxScale: rand(0.84, 1.05),
      ryScale: rand(0.78, 0.98) * cfg.verticalStretch,
      steps: Math.round(rand(10, 13) * effectiveDensity),
      tilt: rand(-0.48, 0.48),
    });
    knots.push({
      cx: spineX - shift * 0.75,
      cyStart: rand(650, 720),
      cyEnd: rand(835, 895),
      rxScale: rand(0.9, 1.16),
      ryScale: rand(0.82, 1.06) * cfg.verticalStretch,
      steps: Math.round(rand(10, 14) * effectiveDensity),
      tilt: rand(-0.48, 0.48),
    });
  } else {
    knots.push({
      cx: spineX + rand(-24, 24),
      cyStart: rand(250, 310),
      cyEnd: rand(565, 625),
      rxScale: rand(0.98, 1.18),
      ryScale: rand(0.94, 1.16) * cfg.verticalStretch,
      steps: Math.round(rand(14, 19) * effectiveDensity),
      tilt: rand(-0.38, 0.38),
    });
    knots.push({
      cx: spineX + rand(-28, 28),
      cyStart: rand(715, 775),
      cyEnd: rand(860, 910),
      rxScale: rand(0.74, 0.94),
      ryScale: rand(0.68, 0.88) * cfg.verticalStretch,
      steps: Math.round(rand(6, 8) * effectiveDensity),
      tilt: rand(-0.35, 0.35),
    });
  }

  const points: Waypoint[] = [];
  const sampleSoftness = (override?: number) =>
    override !== undefined
      ? override
      : rand(cfg.baseSoftness[0], cfg.baseSoftness[1]);

  const pushPoint = (
    rawX: number,
    rawY: number,
    minDist = cfg.minDist,
    softnessOverride?: number
  ) => {
    let x = softClamp(rawX, 100, 700, 60);
    let y = softClamp(rawY, 22, 1175, 48);

    const n = points.length;
    if (n >= 1) {
      const prev = points[n - 1];
      let dx = x - prev.x;
      let dy = y - prev.y;
      const dist = Math.hypot(dx, dy);

      if (dist < minDist) {
        const angle = dist > 1 ? Math.atan2(dy, dx) : rand(0, Math.PI * 2);
        x = softClamp(prev.x + Math.cos(angle) * minDist, 100, 700, 60);
        y = softClamp(prev.y + Math.sin(angle) * minDist, 22, 1175, 48);
        dx = x - prev.x;
        dy = y - prev.y;
      }

      if (n >= 2 && cfg.shoulderThreshold !== null) {
        const prev2 = points[n - 2];
        const v1x = prev.x - prev2.x;
        const v1y = prev.y - prev2.y;
        const len1 = Math.hypot(v1x, v1y) || 1;
        const len2 = Math.hypot(dx, dy) || 1;
        const dot = (v1x * dx + v1y * dy) / (len1 * len2);

        if (dot < cfg.shoulderThreshold) {
          const cross = v1x * dy - v1y * dx;
          const perpSign = cross >= 0 ? 1 : -1;
          const px = (-v1y / len1) * perpSign;
          const py = (v1x / len1) * perpSign;
          const shoulder = rand(75, 115);
          const midX = softClamp(
            prev.x + (v1x / len1) * 55 + px * shoulder,
            100,
            700,
            60
          );
          const midY = softClamp(
            prev.y + (v1y / len1) * 55 + py * shoulder,
            125,
            970,
            55
          );
          points.push({ x: midX, y: midY, softness: sampleSoftness() });
        }
      }
    }

    points.push({ x, y, softness: sampleSoftness(softnessOverride) });
  };

  // --- Phase 1: Graceful descending entry (always calm, even on sharper styles) ---
  const entryX = spineX + rand(-38, 32);
  const entryCurve = pickSign() * rand(14, 30);
  const firstKnot = knots[0];
  const entrySoftness = activeStyle === 'sharp' ? 0.55 : 0.95;

  points.push({ x: entryX, y: rand(22, 34), softness: entrySoftness });
  points.push({ x: entryX + entryCurve, y: rand(98, 138), softness: entrySoftness });
  points.push({ x: entryX - entryCurve * 0.45, y: rand(205, 255), softness: entrySoftness });
  const entryFlankX = firstKnot.cx + pickSign() * rand(20, 65);
  const entryFlankY = Math.max(290, firstKnot.cyStart + rand(15, 65));
  points.push({ x: entryFlankX, y: entryFlankY, softness: sampleSoftness() });

  // --- Phase 2: Expressive 2D tangled gesture core ---
  let dir = entryFlankX >= firstKnot.cx ? -1 : 1;
  let theta = Math.atan2(entryFlankY - firstKnot.cyStart, entryFlankX - firstKnot.cx);
  let sameDirCount = 0;
  let rxCur = rand(120, 175);
  let ryCur = rand(120, 180);

  for (let k = 0; k < knots.length; k++) {
    const knot = knots[k];
    const cosTilt = Math.cos(knot.tilt);
    const sinTilt = Math.sin(knot.tilt);

    if (k > 0) {
      const prevPt = points[points.length - 1];
      const midY = (prevPt.y + knot.cyStart) * 0.5 + rand(-15, 25);
      const swingX = knot.cx + (prevPt.x > knot.cx ? -1 : 1) * rand(95, 170);
      pushPoint(swingX, midY, 110, activeStyle === 'sharp' ? 0.25 : 0.9);
      dir = -dir;
      sameDirCount = 0;
      theta = Math.atan2(midY - knot.cyStart, swingX - knot.cx);
    }

    for (let i = 0; i < knot.steps; i++) {
      const u = knot.steps > 1 ? i / (knot.steps - 1) : 0.5;
      const centerY = knot.cyStart + (knot.cyEnd - knot.cyStart) * u;
      const centerX = knot.cx + Math.sin(u * Math.PI * 2 + seed * 0.1) * rand(14, 34);
      const bell = 0.78 + 0.34 * Math.sin(u * Math.PI);

      const roll = next();
      const forceFlip = sameDirCount >= 5;

      // Occasional Get-Your-Wish style rapid vertical/diagonal cross-slash burst
      if (cfg.slashProb > 0 && roll < cfg.slashProb) {
        sameDirCount = 0;
        const slashCount = activeStyle === 'sharp' ? Math.floor(rand(2, 4)) : 2;
        let up = points[points.length - 1].y > centerY;
        const slashSpanX = activeStyle === 'sharp' ? rand(45, 105) : rand(65, 130);
        const slashSpanY = rand(145, 240) * knot.ryScale;

        for (let s = 0; s < slashCount; s++) {
          const sx = centerX + rand(-slashSpanX, slashSpanX);
          const sy = centerY + (up ? -1 : 1) * rand(slashSpanY * 0.65, slashSpanY);
          // Crisp apex at turnaround
          const apexSoftness =
            activeStyle === 'sharp'
              ? rand(0.04, 0.16)
              : activeStyle === 'whip'
                ? rand(0.14, 0.3)
                : rand(0.28, 0.48);
          pushPoint(sx, softClamp(sy, 140, 955, 50), 92, apexSoftness);
          up = !up;
        }
        dir = -dir;
        const last = points[points.length - 1];
        theta = Math.atan2(last.y - centerY, last.x - centerX);
        continue;
      }

      const adjRoll = (roll - cfg.slashProb) / Math.max(0.01, 1 - cfg.slashProb);

      if (forceFlip || adjRoll < 0.18) {
        // S-curve figure-8 chirality flip across the center
        const crossSoftness = activeStyle === 'sharp' ? rand(0.1, 0.25) : rand(0.75, 1.0);
        pushPoint(
          centerX + rand(-42, 42),
          softClamp(centerY + rand(-48, 48), 155, 935, 55),
          98,
          crossSoftness
        );
        dir = -dir;
        sameDirCount = 0;
        theta += Math.PI + dir * rand(0.35, 0.85);
        rxCur = rand(135, 225) * knot.rxScale * bell;
        ryCur = rand(125, 215) * knot.ryScale * bell;
      } else if (adjRoll < 0.18 + cfg.reboundProb) {
        // Dramatic vertical rebound sweep (smooth belly or crisp whip-back apex)
        sameDirCount++;
        const prevY = points[points.length - 1].y;
        const goUp = prevY > centerY ? true : next() < 0.5;
        const targetApex = goUp ? -Math.PI / 2 : Math.PI / 2;
        theta = targetApex + dir * rand(0.15, 0.72);
        rxCur = rand(95, 185) * knot.rxScale;
        ryCur = rand(175, 265) * knot.ryScale;

        const lx = Math.cos(theta) * rxCur;
        const ly = Math.sin(theta) * ryCur;
        const wx = centerX + lx * cosTilt - ly * sinTilt;
        const wy = centerY + lx * sinTilt + ly * cosTilt;
        const apexSoftness =
          activeStyle === 'whip'
            ? rand(0.28, 0.52)
            : activeStyle === 'sharp'
              ? rand(0.05, 0.2)
              : activeStyle === 'crisp'
                ? rand(0.32, 0.58)
                : undefined;
        pushPoint(wx, softClamp(wy, 138, 955, 55), cfg.minDist, apexSoftness);
        continue;
      } else if (adjRoll < 0.62) {
        // Tighter inner swirl
        sameDirCount++;
        theta += dir * rand(cfg.stepAngle[0] * 1.05, cfg.stepAngle[1] * 1.05);
        rxCur = rxCur * 0.3 + rand(75, 138) * knot.rxScale * 0.7;
        ryCur = ryCur * 0.3 + rand(72, 135) * knot.ryScale * 0.7;
      } else {
        // Broad sweeping outer lasso
        sameDirCount++;
        theta += dir * rand(cfg.stepAngle[0], cfg.stepAngle[1]);
        rxCur = rxCur * 0.3 + rand(150, 240) * knot.rxScale * bell * 0.7;
        ryCur = ryCur * 0.3 + rand(130, 215) * knot.ryScale * bell * 0.7;
      }

      const lx = Math.cos(theta) * rxCur;
      const ly = Math.sin(theta) * ryCur;
      const wx = centerX + lx * cosTilt - ly * sinTilt;
      const wy = centerY + lx * sinTilt + ly * cosTilt;

      // On outer sweeps in whip/crisp, keep broad arcs smoother while inner/rebound turns snap crisper
      const sweepSoftness =
        activeStyle === 'whip'
          ? rand(0.68, 0.96)
          : activeStyle === 'sharp'
            ? rand(0.08, 0.28)
            : undefined;
      pushPoint(wx, softClamp(wy, 145, 945, 55), cfg.minDist, sweepSoftness);
    }
  }

  // --- Phase 3: Airy tapering exit tail ---
  const lastCore = points[points.length - 1];
  const exitX = spineX + rand(-35, 35);
  const exitCurve = pickSign() * rand(30, 62);
  const exitSoftness = activeStyle === 'sharp' ? 0.5 : 0.92;

  const y1 = Math.min(Math.max(lastCore.y + 85, 925), 985);
  const y2 = y1 + (1162 - y1) * 0.52;

  pushPoint(lastCore.x * 0.3 + exitX * 0.7 + exitCurve, y1, 82, exitSoftness);
  pushPoint(exitX - exitCurve * 0.55, y2, 75, exitSoftness);
  points.push({
    x: softClamp(exitX + rand(-16, 16), 180, 620, 40),
    y: rand(1150, 1172),
    softness: exitSoftness,
  });

  // --- Convert waypoints to modulated Catmull-Rom Cubic Bezier path ---
  const first = points[0];
  const second = points[1];
  const last = points[points.length - 1];
  const prevLast = points[points.length - 2];

  const pStartVirtual: Waypoint = {
    x: 2 * first.x - second.x,
    y: 2 * first.y - second.y,
    softness: first.softness,
  };
  const pEndVirtual: Waypoint = {
    x: 2 * last.x - prevLast.x,
    y: 2 * last.y - prevLast.y,
    softness: last.softness,
  };

  const padded: Waypoint[] = [pStartVirtual, ...points, pEndVirtual];

  let d = `M${first.x.toFixed(1)},${first.y.toFixed(1)}`;
  for (let i = 1; i < padded.length - 2; i++) {
    const [cp1x, cp1y, cp2x, cp2y] = modulatedCatmullRomToBezier(
      padded[i - 1],
      padded[i],
      padded[i + 1],
      padded[i + 2],
      cfg.alpha
    );
    const end = padded[i + 1];
    d += `C${cp1x.toFixed(1)},${cp1y.toFixed(1)},${cp2x.toFixed(1)},${cp2y.toFixed(1)},${end.x.toFixed(1)},${end.y.toFixed(1)}`;
  }

  return d;
}

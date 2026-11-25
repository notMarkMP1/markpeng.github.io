/**
 * Wide-gamut (Display P3) output for the hero shaders.
 *
 * Every hero colour is authored as display-referred sRGB. On a P3 drawing buffer
 * `outputGamut()` first re-encodes it so it looks exactly as authored (P3_VIVID = 0),
 * then leans it toward reading the same numbers as P3 coordinates (P3_VIVID = 1),
 * which lets the meadow greens and the sky / water blues reach colours an sRGB
 * screen can't show. Without OUTPUT_P3 it compiles away to a no-op.
 */
export const GAMUT_GLSL = /* glsl */ `
  vec3 outputGamut(vec3 c) {
  #ifdef OUTPUT_P3
    vec3 s = clamp(c, 0.0, 1.0);
    vec3 lin = mix(s / 12.92, pow((s + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), s));
    // Linear sRGB -> linear Display P3 (column-major)
    vec3 p3 = mat3(0.8225, 0.0332, 0.0171, 0.1774, 0.9669, 0.0724, 0.0, 0.0, 0.9108) * lin;
    vec3 exact = mix(p3 * 12.92, 1.055 * pow(p3, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), p3));
    return mix(exact, c, P3_VIVID);
  #else
    return c;
  #endif
  }
`;

/** Shader defines for a wide-gamut strength (-1 = plain sRGB output). */
export function gamutDefines(p3Vivid: number): Record<string, string> {
  return p3Vivid >= 0 ? { OUTPUT_P3: '', P3_VIVID: p3Vivid.toFixed(3) } : {};
}

/**
 * Flat theme-coloured first-paint backdrop that the WebGL canvas fades in over.
 * Pure CSS, theme-driven by html[data-theme], so it renders server-side with zero
 * flash of the wrong world. Hidden once the live canvas covers it or if the hero
 * switches to the centered no-WebGL2 fallback layout (html[data-hero-fallback]).
 */
export default function HeroBackdrop() {
  return (
    <>
      <div aria-hidden="true" className="hero-top-tint" />
      <div aria-hidden="true" className="hero-backdrop hero-layer pointer-events-none z-0" />
    </>
  );
}

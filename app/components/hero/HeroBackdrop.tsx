/**
 * Flat theme-coloured backdrop: the instant first paint that the WebGL canvas fades
 * in over, and all that shows where the scene can't run. Pure CSS, theme-driven by
 * html[data-theme], so it renders server-side with zero flash of the wrong world.
 */
export default function HeroBackdrop() {
  return (
    <>
      <div aria-hidden="true" className="hero-top-tint" />
      <div aria-hidden="true" className="hero-backdrop hero-layer pointer-events-none z-0" />
    </>
  );
}

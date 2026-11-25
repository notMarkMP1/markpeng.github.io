/**
 * Tier 3 static backdrop (hero.md §7B.3) — also the instant first paint that the
 * WebGL canvas fades in over. Pure CSS, theme-driven by html[data-theme], so it
 * renders server-side with zero flash of the wrong world.
 */
export default function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="hero-backdrop pointer-events-none fixed inset-0 z-0">
      <div className="hero-backdrop-night absolute inset-0" />
      <div className="hero-backdrop-day absolute inset-0" />
    </div>
  );
}

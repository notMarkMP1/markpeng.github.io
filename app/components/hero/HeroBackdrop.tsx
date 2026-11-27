/**
 * Flat theme-coloured first-paint backdrop that the WebGL canvas fades in over.
 * Pure CSS, theme-driven by html[data-theme], so it renders server-side with zero
 * flash of the wrong world. Hidden once the live canvas covers it, while paused
 * off-home, or if the hero switches to the centered no-WebGL2 fallback layout.
 */
interface HeroBackdropProps {
  active?: boolean;
  paused?: boolean;
}

export default function HeroBackdrop({ active = true, paused = false }: HeroBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={`hero-backdrop hero-layer pointer-events-none z-0${active ? '' : ' hero-layer-inactive'}`}
      style={paused ? { visibility: 'hidden' } : undefined}
    />
  );
}

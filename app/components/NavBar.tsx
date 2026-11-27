'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { hintSafariRouteTint } from './hero/safariChrome';

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/blog', label: 'Blog' },
  { path: '/contact', label: 'Contact' },
] as const;

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// RK4-integrated spring curve matching Framer Motion's bouncy nav pill
const NAV_PILL_SPRING_LINEAR =
  'linear(0, 0.1305, 0.3408, 0.554, 0.7265, 0.8599, 0.948, 0.9994, 1.0243, 1.0322, 1.0307, 1.0249, 1.0178, 1.0114, 1.0064, 1.0029, 1.0007, 0.9995, 1)';
const NAV_PILL_SPRING_FALLBACK = 'cubic-bezier(0.22, 1.12, 0.36, 1)';

function pillEasing() {
  if (typeof CSS !== 'undefined' && CSS.supports?.('animation-timing-function', 'linear(0, 1)')) {
    return { duration: 465, easing: NAV_PILL_SPRING_LINEAR };
  }
  return { duration: 340, easing: NAV_PILL_SPRING_FALLBACK };
}

export default function NavBar() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const activePath =
    NAV_ITEMS.find((item) =>
      item.path === '/'
        ? pathname === '/'
        : pathname === item.path || pathname.startsWith(`${item.path}/`)
    )?.path ?? null;

  const pillRef = useRef<HTMLSpanElement>(null);
  const prevActivePathRef = useRef<string | null>(null);
  const prevRectRef = useRef<{ left: number; width: number } | null>(null);
  const animRef = useRef<Animation | null>(null);

  // FLIP spring slide whenever the active nav tab changes; initial SSR paint is
  // already in place at opacity:1 with zero flash or JS wait.
  useIsomorphicLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill || !activePath) {
      prevActivePathRef.current = activePath;
      prevRectRef.current = null;
      return;
    }

    const nextRect = pill.getBoundingClientRect();
    const prevPath = prevActivePathRef.current;
    const prevRect = prevRectRef.current;

    if (
      prevPath !== null &&
      prevPath !== activePath &&
      prevRect &&
      nextRect.width > 0 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const dx = prevRect.left - nextRect.left;
      const sx = prevRect.width / nextRect.width;
      if (Math.abs(dx) > 0.5 || Math.abs(sx - 1) > 0.01) {
        animRef.current?.cancel();
        pill.style.transformOrigin = 'left center';
        const { duration, easing } = pillEasing();
        animRef.current = pill.animate(
          [
            { transform: `translate3d(${dx}px, 0, 0) scaleX(${sx})` },
            { transform: 'translate3d(0, 0, 0) scaleX(1)' },
          ],
          { duration, easing }
        );
      }
    }

    prevActivePathRef.current = activePath;
    prevRectRef.current = { left: nextRect.left, width: nextRect.width };
  }, [activePath]);

  // Keep cached rect fresh across resizes so browser back/forward FLIP stays exact
  useEffect(() => {
    const syncRect = () => {
      const pill = pillRef.current;
      if (!pill) return;
      const r = pill.getBoundingClientRect();
      prevRectRef.current = { left: r.left, width: r.width };
    };
    window.addEventListener('resize', syncRect, { passive: true });
    return () => window.removeEventListener('resize', syncRect);
  }, []);

  return (
    // `.site-nav` remaps the nav's semantic colour tokens per route/theme, and
    // each child transitions its own `color` / `background-color` directly so
    // route switches and Light <-> Dark toggles glide smoothly without flashing.
    <nav
      className={`site-nav relative z-20 flex justify-center items-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]${isHome ? ' home-nav' : ''}`}
    >
      <div className="flex justify-center items-center space-x-2 sm:space-x-4">
        {NAV_ITEMS.map((item) => {
          const active = item.path === activePath;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (item.path !== pathname) {
                  // Snapshot current visual rect (handles mid-flight rapid clicks cleanly)
                  const pill = pillRef.current;
                  if (pill) {
                    const r = pill.getBoundingClientRect();
                    prevRectRef.current = { left: r.left, width: r.width };
                  }
                  hintSafariRouteTint(item.path);
                }
              }}
              className={`px-3 py-2 text-[15px] font-medium tracking-[0.01em] rounded-xl transition-colors duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none relative font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                active
                  ? 'text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {item.label}
              {active && (
                <span
                  ref={pillRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-lg -z-10 transition-colors duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                  }}
                />
              )}
            </Link>
          );
        })}

        <span
          className="mx-1 h-4 w-px bg-[var(--color-border)] transition-colors duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          aria-hidden="true"
        />
        <ThemeToggle />
      </div>
    </nav>
  );
}

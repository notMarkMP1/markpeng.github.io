'use client';

import React, { useEffect, useRef } from 'react';
import FadeInSection from '@/app/components/FadeInSection';

/*
 * Foreground Liner Notes typography + recruiter quick links (hero.md §3).
 * All theme colours live in CSS custom properties keyed off html[data-theme]
 * (see `.hero-overlay` in globals.css) so they cross-fade on the same 520ms
 * curve as the GPU scene transition, with zero React re-renders.
 */

const RESUME_ICON = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const LINKEDIN_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z" />
  </svg>
);

const GITHUB_ICON = (
  <svg width="15" height="15" viewBox="0 0 98 96" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
    />
  </svg>
);

const LINKS = [
  { href: '/resume.pdf', label: 'Resume', icon: RESUME_ICON },
  { href: 'https://linkedin.com/in/markminpeng', label: 'LinkedIn', icon: LINKEDIN_ICON },
  { href: 'https://github.com/notMarkMP1', label: 'GitHub', icon: GITHUB_ICON },
];

const REST_X = 50;
const REST_Y = 32;

export default function HeroOverlay() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Pointer-reactive sky sheen across the headline — written straight to CSS
  // custom properties on the element, eased in rAF, never through React state.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let targetX = REST_X;
    let targetY = REST_Y;
    let x = REST_X;
    let y = REST_Y;
    let raf = 0;

    const apply = () => {
      el.style.setProperty('--mx', `${x.toFixed(2)}%`);
      el.style.setProperty('--my', `${y.toFixed(2)}%`);
    };
    const tick = () => {
      x += (targetX - x) * 0.2;
      y += (targetY - y) * 0.2;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) < 0.05) {
        x = targetX;
        y = targetY;
        raf = 0;
      } else {
        raf = requestAnimationFrame(tick);
      }
      apply();
    };
    const onMove = (e: PointerEvent) => {
      if (motionQuery.matches || document.documentElement.dataset.heroFallback === 'true') return;
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMotionChange = () => {
      if (!motionQuery.matches) return;
      cancelAnimationFrame(raf);
      raf = 0;
      x = targetX = REST_X;
      y = targetY = REST_Y;
      apply();
    };

    apply();
    window.addEventListener('pointermove', onMove, { passive: true });
    motionQuery.addEventListener('change', onMotionChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, []);

  return (
    <section className="hero-overlay pointer-events-none relative z-10 w-full px-5 sm:px-6">
      {/* Phones: the block sits in the sky band between the nav and the horizon (~59%
          down in portrait framing), splitting the free space 4:3 above:below so the
          headline rests on the scene and its light instead of hanging off the nav. The
          split scales with the room available, so short phones never crowd the
          horizon. Tablets and desktop keep the 10vh rhythm. */}
      <div className="hero-overlay-inner mx-auto flex min-h-[calc(59svh-4.45rem)] w-full max-w-4xl flex-col items-center text-center sm:min-h-0 sm:pt-[10vh]">
        <div aria-hidden="true" className="hero-sky-spacer flex-[4] sm:hidden" />
        <FadeInSection>
          <h1
            ref={titleRef}
            className="hero-title pointer-events-auto -mb-[0.18em] select-none px-1 pb-[0.18em] font-heading text-[clamp(2rem,4.9vw,3.65rem)] font-medium leading-[1.22] tracking-[0.015em] sm:whitespace-nowrap"
          >
            hello, i&apos;m Mark Peng
          </h1>
        </FadeInSection>

        <FadeInSection delay={0.14}>
          <p className="hero-bio pointer-events-auto mx-auto mt-3 max-w-[44ch] select-none font-body text-[15.5px] leading-[1.65] sm:text-[16.5px]">
            A software engineer and undergraduate at the University of Toronto studying computer science.
          </p>
        </FadeInSection>

        <FadeInSection delay={0.26}>
          <div className="pointer-events-auto mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-action group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-body text-[13.5px] font-medium sm:gap-2 sm:px-3.5 sm:text-[14px] backdrop-blur-[4px] transition-[background-color,color,translate,scale] duration-200 ease-out hover:-translate-y-[1px] focus-visible:outline-none active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
              >
                <span className="hero-action-icon inline-flex transition-colors duration-200 ease-out">
                  {link.icon}
                </span>
                <span>{link.label}</span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="hero-action-arrow transition-[color,translate] max-[379px]:hidden duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </a>
            ))}
          </div>
        </FadeInSection>
        <div aria-hidden="true" className="hero-sky-spacer flex-[3] sm:hidden" />
      </div>
    </section>
  );
}

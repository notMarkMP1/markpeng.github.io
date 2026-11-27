'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { hintSafariRouteTint } from './hero/safariChrome';

export default function NavBar() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/blog', label: 'Blog' },
    { path: '/contact', label: 'Contact' },
  ];

  const isActive = (itemPath: string) => {
    if (itemPath === '/') return pathname === '/';
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };

  return (
    // `.site-nav` remaps the nav's semantic colour tokens per route/theme, and
    // each child transitions its own `color` / `background-color` directly so
    // route switches and Light <-> Dark toggles glide smoothly without flashing.
    <nav
      className={`site-nav relative z-20 flex justify-center items-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]${isHome ? ' home-nav' : ''}`}
    >
      <div className="flex justify-center items-center space-x-2 sm:space-x-4">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                if (item.path !== pathname) hintSafariRouteTint(item.path);
              }}
              className={`px-3 py-2 text-[15px] font-medium tracking-[0.01em] rounded-xl transition-colors duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none relative font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                active
                  ? 'text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {item.label}
              {active && (
                <motion.div
                  className="absolute inset-0 rounded-lg -z-10 transition-colors duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                  layoutId="bubble"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', velocity: 2, bounce: 0.2 }}
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

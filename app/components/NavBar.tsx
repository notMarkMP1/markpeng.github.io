'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

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
    // On `/` only, `.home-nav` remaps the semantic tokens to sky-legible ink
    // (theme-keyed in globals.css, cross-fading on the hero's 520ms curve).
    <nav className={`relative z-20 flex justify-center items-center p-4${isHome ? ' home-nav' : ''}`}>
      <div className="flex justify-center items-center space-x-2 sm:space-x-4">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`px-3 py-2 text-[15px] font-medium tracking-[0.01em] rounded-xl transition-colors relative font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                active
                  ? 'text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {item.label}
              {active && (
                <motion.div
                  className="absolute inset-0 rounded-lg -z-10"
                  layoutId="bubble"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    backdropFilter: isHome ? 'blur(6px)' : undefined,
                    WebkitBackdropFilter: isHome ? 'blur(6px)' : undefined,
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
          className="mx-1 h-4 w-px bg-[var(--color-border)]"
          aria-hidden="true"
        />
        <ThemeToggle />
      </div>
    </nav>
  );
}

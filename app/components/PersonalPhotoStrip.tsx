'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useTheme } from '@/app/components/ThemeProvider';

interface PersonalPhoto {
  id: string;
  src: string;
  alt: string;
  objectPosition: string;
  width: number;
  height: number;
}

const DARK_PHOTOS: PersonalPhoto[] = [
  {
    id: 'dark-1',
    src: '/images/personal/dark-01-night-street.jpg',
    alt: 'Rain-slicked New York street reflections at night',
    objectPosition: '50% 56%',
    width: 557,
    height: 991,
  },
  {
    id: 'dark-2',
    src: '/images/personal/dark-02-machi-dog.jpg',
    alt: 'Illuminated dachshund storefront sign at night',
    objectPosition: '50% 48%',
    width: 991,
    height: 991,
  },
  {
    id: 'dark-3',
    src: '/images/personal/dark-03-concert-confetti.jpg',
    alt: 'Confetti falling under blue concert lights at night',
    objectPosition: '50% 56%',
    width: 557,
    height: 991,
  },
];

const LIGHT_PHOTOS: PersonalPhoto[] = [
  {
    id: 'light-1',
    src: '/images/personal/light-01-empire-state.jpg',
    alt: 'Empire State Building rising into bright clouds',
    objectPosition: '50% 42%',
    width: 743,
    height: 991,
  },
  {
    id: 'light-2',
    src: '/images/personal/light-02-sunlit-skyline.jpg',
    alt: 'Sunbeams behind a glass tower framed by balcony greenery',
    objectPosition: '50% 50%',
    width: 1920,
    height: 976,
  },
  {
    id: 'light-3',
    src: '/images/personal/light-03-floating-convenience.jpg',
    alt: 'Floating convenience store on calm sunlit water',
    objectPosition: '50% 56%',
    width: 743,
    height: 991,
  },
];

function PhotoLightbox({
  photo,
  theme,
  onClose,
}: {
  photo: PersonalPhoto | null;
  theme: 'light' | 'dark';
  onClose: () => void;
}) {
  useEffect(() => {
    if (!photo) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [photo, onClose]);

  if (!photo || typeof document === 'undefined') return null;

  const isDark = theme === 'dark';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 sm:p-10 cursor-zoom-out backdrop-blur-[3px]"
      style={{
        backgroundColor: isDark
          ? 'rgba(7, 8, 11, 0.66)'
          : 'rgba(250, 252, 249, 0.56)',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image preview"
        className="fixed top-5 right-5 z-[101] cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--color-surface)]/80 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[88vh] flex items-center justify-center cursor-default"
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          quality={85}
          priority
          sizes="(max-width: 896px) 92vw, 896px"
          className="max-h-[84vh] max-w-full w-auto h-auto object-contain block rounded-[3px]"
          style={{
            boxShadow: isDark
              ? '0 24px 64px -14px rgba(0, 0, 0, 0.85)'
              : '0 20px 56px -14px rgba(22, 27, 23, 0.28)',
          }}
        />
      </div>
    </div>,
    document.body
  );
}

function PhotoGrid({
  photos,
  className,
  onSelect,
}: {
  photos: PersonalPhoto[];
  className: string;
  onSelect: (photo: PersonalPhoto) => void;
}) {
  return (
    <div className={`mt-5 grid-cols-3 gap-2.5 sm:gap-3.5 ${className}`}>
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onSelect(photo)}
          className="group relative block w-full aspect-[4/3] overflow-hidden rounded-[3px] bg-[var(--color-surface)] photo-soft-lift cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 640px) 32vw, 210px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            style={{ objectPosition: photo.objectPosition }}
          />
        </button>
      ))}
    </div>
  );
}

export default function PersonalPhotoStrip() {
  const { theme } = useTheme();
  const [activePhoto, setActivePhoto] = useState<PersonalPhoto | null>(null);

  return (
    <>
      {/* Both theme sets are gated by html[data-theme] CSS (display: none on the
          inactive strip) with default loading="lazy" so browsers only fetch the
          active theme's 3 photos — zero Light-mode double-fetch or Dark->Light flash. */}
      <PhotoGrid photos={LIGHT_PHOTOS} className="photo-strip-light" onSelect={setActivePhoto} />
      <PhotoGrid photos={DARK_PHOTOS} className="photo-strip-dark" onSelect={setActivePhoto} />

      <PhotoLightbox
        photo={activePhoto}
        theme={theme}
        onClose={() => setActivePhoto(null)}
      />
    </>
  );
}

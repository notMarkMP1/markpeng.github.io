'use client';

import Image from 'next/image';

interface ProjectItem {
  title: string;
  description: string;
  technologies: string[];
  link: string;
  imagePath: string;
}

interface ProjectProps {
  items: ProjectItem[];
}

// Gently tapered filled ink-stroke silhouettes (viewBox 0 0 200 10)
// Filled organic ribbons antialias more smoothly than thin 1px stroked curves on 1x displays.
const INK_STROKES = [
  'M1,6.2 Q96,2.1 199,4.9 C199.6,5.1 199.4,6.1 198.8,6.2 Q96,4.5 1.4,7.3 C0.6,7.4 0.4,6.4 1,6.2 Z',
  'M1,4.8 Q102,7.6 199,4.3 C199.6,4.1 199.5,5.2 198.9,5.5 Q102,9.7 1.3,6.0 C0.6,6.1 0.4,5.0 1,4.8 Z',
  'M1,6.4 C58,2.5 138,5.8 199,3.9 C199.6,3.7 199.5,4.9 198.9,5.1 C138,7.9 58,4.7 1.3,7.5 C0.6,7.6 0.4,6.6 1,6.4 Z',
  'M1,4.6 C66,7.1 142,2.4 199,5.4 C199.6,5.7 199.4,6.7 198.7,6.6 C142,4.5 66,9.2 1.3,5.8 C0.6,5.9 0.4,4.8 1,4.6 Z',
  'M1,6.0 Q92,2.3 199,5.2 C199.6,5.4 199.4,6.4 198.8,6.4 Q92,4.6 1.4,7.1 C0.6,7.2 0.4,6.2 1,6.0 Z',
  'M1,5.0 C62,7.4 134,2.6 199,4.8 C199.6,5.0 199.4,6.1 198.8,6.0 C134,4.8 62,9.5 1.3,6.2 C0.6,6.3 0.4,5.2 1,5.0 Z',
];

export default function Projects({ items }: ProjectProps) {
  return (
    <div className="flex flex-col space-y-5">
      {items.map((item, index) => {
        const inkStroke = INK_STROKES[index % INK_STROKES.length];

        return (
          <a
            key={item.title}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col sm:flex-row sm:items-center sm:min-h-[96px] gap-3 sm:gap-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-background)]"
          >
            {item.imagePath && (
              <div className="relative shrink-0 w-full aspect-[16/9] sm:w-[136px] sm:h-[80px] sm:aspect-auto overflow-hidden rounded-[3px] bg-[var(--color-surface)] photo-soft-lift transition-transform duration-200 ease-out group-hover:-translate-y-px motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                <Image
                  src={item.imagePath}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 136px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 max-w-full">
                <h3 className="relative inline-block text-[15.5px] font-semibold font-body leading-snug text-[var(--color-text-primary)]">
                  {item.title}
                  <svg
                    className="project-ink-underline pointer-events-none absolute left-0 -bottom-[4px] w-full h-[7px] overflow-visible block"
                    viewBox="0 0 200 10"
                    preserveAspectRatio="none"
                    shapeRendering="geometricPrecision"
                    aria-hidden="true"
                  >
                    <path d={inkStroke} fill="var(--color-primary)" />
                  </svg>
                </h3>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0 text-[var(--color-text-subtle)] transition-[color,transform] duration-200 ease-out group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:text-[var(--color-primary)] motion-reduce:transition-none motion-reduce:transform-none"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {item.description}
              </p>

              <p className="mt-1.5 font-meta text-[11.75px] text-[var(--color-text-muted)] leading-relaxed">
                {item.technologies.map((tech, techIndex) => (
                  <span key={tech}>
                    {techIndex > 0 && (
                      <span className="mx-1.5 opacity-45" aria-hidden="true">
                        &middot;
                      </span>
                    )}
                    {tech}
                  </span>
                ))}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

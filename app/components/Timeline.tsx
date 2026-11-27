interface TimelineProps {
  items: {
    date: string;
    title: string;
    company: string;
    description: string;
    link: string;
  }[];
}

export default function Timeline({ items }: TimelineProps) {
  return (
    <>
      {items.map((item) => (
        <a
          key={`${item.company}-${item.date}`}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="spring-hover-card block relative mb-4 last:mb-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-background)]"
        >
          <div
            className="absolute left-0 top-0 h-full w-0.5 rounded-full"
            style={{ backgroundImage: 'var(--color-accent-rail)' }}
            aria-hidden="true"
          />
          <div className="ml-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-2">
              <h3 className="text-[15.5px] font-semibold font-body leading-snug text-[var(--color-text-primary)]">
                {item.company}
              </h3>
              <span className="font-meta text-xs text-[var(--color-text-muted)] shrink-0">
                {item.date}
              </span>
            </div>
            <p className="text-[13.5px] text-[var(--color-text-muted)] mt-0.5">{item.title}</p>
            <p className="text-[14.5px] leading-relaxed text-[var(--color-text-secondary)] mt-0.5">
              {item.description}
            </p>
          </div>
        </a>
      ))}
    </>
  );
}

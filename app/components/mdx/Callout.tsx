import type React from 'react';

type CalloutType = 'note' | 'tip' | 'warning';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const CALLOUT_STYLES: Record<
  CalloutType,
  {
    label: string;
    accentColor: string;
    surfaceColor: string;
  }
> = {
  note: {
    label: 'Note',
    accentColor: 'var(--color-accent-sky)',
    surfaceColor: 'var(--color-accent-sky-subtle)',
  },
  tip: {
    label: 'Tip',
    accentColor: 'var(--color-primary)',
    surfaceColor: 'var(--color-primary-subtle)',
  },
  warning: {
    label: 'Caution',
    accentColor: 'var(--color-warning)',
    surfaceColor: 'var(--color-warning-subtle)',
  },
};

export default function Callout({ type = 'note', title, children }: CalloutProps) {
  const style = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.note;

  return (
    <aside
      className="not-prose my-5 rounded-r-lg border border-l-[3px] px-4 py-3.5 text-[0.95rem] leading-relaxed"
      style={{
        backgroundColor: style.surfaceColor,
        borderColor: 'var(--color-border)',
        borderLeftColor: style.accentColor,
        color: 'var(--color-text-secondary)',
      }}
    >
      <div
        className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em]"
        style={{ color: style.accentColor }}
      >
        {title || style.label}
      </div>
      <div className="space-y-2 [&>p]:m-0 [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-[var(--color-text-primary)] [&_code]:rounded-[0.15rem] [&_code]:bg-[var(--color-surface-elevated)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:text-[var(--color-text-primary)]">
        {children}
      </div>
    </aside>
  );
}

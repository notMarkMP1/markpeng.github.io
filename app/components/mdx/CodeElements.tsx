'use client';

import React, { useEffect, useRef, useState } from 'react';

function selectElementContents(el: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function MdxCode({
  onDoubleClick,
  ...rest
}: React.ComponentPropsWithoutRef<'code'>) {
  const handleDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
    onDoubleClick?.(e);
    if (e.currentTarget.closest('pre')) return;
    e.stopPropagation();
    selectElementContents(e.currentTarget);
  };

  return <code {...rest} onDoubleClick={handleDoubleClick} />;
}

export function MdxPre({
  children,
  onDoubleClick,
  ...rest
}: React.ComponentPropsWithoutRef<'pre'>) {
  const preRef = useRef<HTMLPreElement>(null);
  const resetTimerRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const getCodeElement = (): HTMLElement | null =>
    preRef.current?.querySelector('code') ?? preRef.current;

  const handleDoubleClick = (e: React.MouseEvent<HTMLPreElement>) => {
    onDoubleClick?.(e);
    const target = getCodeElement();
    if (!target) return;
    selectElementContents(target);
  };

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const target = getCodeElement();
    const text = target?.textContent ?? '';
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        resetTimerRef.current = null;
      }, 1800);
    } catch {
      if (target) selectElementContents(target);
    }
  };

  return (
    <div className="code-block-wrapper relative group">
      <button
        type="button"
        onClick={handleCopy}
        onDoubleClick={(e) => e.stopPropagation()}
        aria-label={copied ? 'Copied code' : 'Copy code'}
        title={copied ? 'Copied!' : 'Copy code'}
        className={`absolute top-2.5 right-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-surface-code)]/90 text-[var(--color-text-muted)] backdrop-blur-[2px] transition-all duration-150 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] cursor-pointer ${
          copied
            ? 'opacity-100 text-[var(--color-primary)] hover:text-[var(--color-primary)]'
            : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
        }`}
      >
        {copied ? (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>

      <pre ref={preRef} onDoubleClick={handleDoubleClick} {...rest}>
        {children}
      </pre>
    </div>
  );
}

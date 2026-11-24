import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center min-h-[calc(100vh-12rem)] justify-center text-center px-4">
            <h1 className="text-[2.2rem] font-medium tracking-[0.01em] leading-[1.22] font-heading text-[var(--color-text-primary)]">404 - Page Not Found</h1>
            <p className="mt-3 text-[15.5px] text-[var(--color-text-secondary)]">you got me, this page doesn&apos;t exist :P</p>
            <Link
                href="/"
                className="mt-4 text-[var(--color-primary)] hover:text-[var(--color-primary-muted)] underline underline-offset-4 transition-colors duration-200"
            >
                Go back to Home
            </Link>
        </div>
    );
}

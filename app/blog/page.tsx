import path from 'path';
import Link from 'next/link';

import FadeInSection from '@/app/components/FadeInSection';
import { getMDXData } from '@/app/utils/mdxUtils';
import { formatDate, dateCompare } from '@/app/utils/dateUtils';

export const metadata = {
    title: "Blog",
};

export default function BlogHome() {
    const posts = getMDXData(path.join('app', 'blog', 'posts'));
    posts.sort((a, b) => dateCompare(b.metadata.publishedAt, a.metadata.publishedAt));

    return (
        <div className="container max-w-2xl mx-auto px-4 py-4 sm:px-6">
            <FadeInSection>
                <h1 className="text-3xl font-bold mb-1 font-heading text-[var(--color-text-primary)]">Blog</h1>
            </FadeInSection>
            <FadeInSection delay={0.2}>
                <p className="text-lg mb-6 text-[var(--color-text-secondary)]">maybe ill use this more eventually (currently unused)</p>
            </FadeInSection>
            <ul className="space-y-4">
                {posts.map((post, index) => (
                    <FadeInSection delay={0.1 * (index + 1) + 0.2} key={post.metadata.slug}>
                        <li className="border-b border-[var(--color-border)] pb-4 transition-colors duration-200 hover:border-[var(--color-border-muted)]">
                            <Link href={`/blog/${post.metadata.slug}`} className="group block">
                                <h2 className="text-xl font-semibold font-body text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-200">
                                    <span className="text-sm font-normal text-[var(--color-text-muted)] mr-2 font-body">
                                        {formatDate(post.metadata.publishedAt)}
                                    </span>
                                    {post.metadata.title}
                                </h2>
                                {post.metadata.description && (
                                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                                        {post.metadata.description}
                                    </p>
                                )}
                            </Link>
                        </li>
                    </FadeInSection>
                ))}
            </ul>
        </div>
    );
}

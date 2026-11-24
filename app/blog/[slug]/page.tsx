import path from 'path';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';

import { getMDXData } from "@/app/utils/mdxUtils";
import { formatDate, isSameDay } from "@/app/utils/dateUtils";
import { blogComponents } from "@/app/utils/componentLoader";
import ScrollDrawLine from "@/app/components/ScrollDrawLine";

const components = {
    ...blogComponents,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = getMDXData(path.join('app', 'blog', 'posts')).find(p => p.metadata.slug === slug);
    
    if (!post) {
        return {
            title: 'Blog Post Not Found',
            description: 'The requested blog post could not be found.',
        };
    }

    return {
        title: post.metadata.title,
        description: post.metadata.description,
        openGraph: {
            title: post.metadata.title,
            description: post.metadata.description,
            type: 'article',
            publishedTime: post.metadata.publishedAt,
            modifiedTime: post.metadata.lastModifiedAt,
            ...(post.metadata.image && { images: [post.metadata.image] }),
        },
        twitter: {
            card: 'summary_large_image',
            title: post.metadata.title,
            description: post.metadata.description,
            ...(post.metadata.image && { images: [post.metadata.image] }),
        },
    };
}

export async function generateStaticParams() {
    const posts = getMDXData(path.join('app', 'blog', 'posts'));
    return posts.map(post => ({
        slug: post.metadata.slug
    }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getMDXData(path.join('app', 'blog', 'posts')).find(p => p.metadata.slug === slug);
    if (!post) {
        notFound();
    }
    const shouldShowLastModified = !isSameDay(post.metadata.publishedAt, post.metadata.lastModifiedAt);

    return (
        <>
            <ScrollDrawLine />
            <article className="relative z-10 container max-w-2xl mx-auto px-4 py-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 sm:gap-4">
                    <h1 className="text-[1.95rem] font-medium tracking-[0.01em] leading-[1.22] font-heading text-[var(--color-text-primary)]">
                        {post.metadata.title}
                    </h1>
                    <Link 
                        href="/blog" 
                        className="shrink-0 text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors duration-200 flex items-center gap-1"
                    >
                        <span className="underline underline-offset-4">← go back</span>
                    </Link>
                </div>
                {post.metadata.description && (
                    <p className="text-[var(--color-text-secondary)] text-[15.5px] leading-relaxed mt-2 mb-2.5">
                        {post.metadata.description}
                    </p>
                )}
                <div className="font-meta text-xs text-[var(--color-text-muted)] flex flex-wrap justify-between items-center gap-2 mb-3.5">
                    <p>Published on {formatDate(post.metadata.publishedAt)}</p>
                    {shouldShowLastModified && (
                        <p>Last modified on {formatDate(post.metadata.lastModifiedAt)}</p>
                    )}
                </div>
                <hr className="border-[var(--color-border)] mb-6" />
                <div className="prose max-w-none">
                    <MDXRemote 
                        source={post.content}
                        components={components}
                        options={{
                            mdxOptions: {
                                remarkPlugins: [remarkGfm],
                                rehypePlugins: [rehypeHighlight],
                            }
                        }}
                    />
                </div>
            </article>
        </>
    );
}

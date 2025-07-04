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

const components = {
    ...blogComponents,
}

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
    }))
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }){
    const { slug } = await params;
    const post = getMDXData(path.join('app', 'blog', 'posts')).find(p => p.metadata.slug === slug);
    if (!post) {
        notFound();
    }
    const shouldShowLastModified = !isSameDay(post.metadata.publishedAt, post.metadata.lastModifiedAt);
    return (
        <div className="container max-w-2xl mx-auto px-4 py-4 sm:px-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{post.metadata.title}</h1>
                <Link 
                    href="/blog" 
                    className="text-gray-400 hover:text-gray-200 transition-colors duration-200 flex items-center gap-1"
                >
                    <span className="underline">← go back</span>
                </Link>
            </div>
            <p className="text-gray-400 text-md mb-0.5">{post.metadata.description}</p>
            <div className="text-gray-600 flex flex-row row-1 justify-between items-center mb-2">
                <p>
                    Published on {formatDate(post.metadata.publishedAt)}
                </p>
                {shouldShowLastModified && (
                    <p>
                        Last modified on {formatDate(post.metadata.lastModifiedAt)}
                    </p>
                )}
            </div>
            <hr className="border-gray-600 mb-2" />
            <div className="prose prose-lg max-w-none prose-invert">
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
        </div>
    );
}
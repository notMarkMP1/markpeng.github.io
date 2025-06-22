import path from 'path';
import Link from 'next/link';

import FadeInSection from '@/app/components/FadeInSection';
import { getMDXData } from '@/app/utils/mdxUtils';
import { formatDate } from '@/app/utils/dateUtils';

export default function BlogHome(){
    const posts = getMDXData(path.join('app', 'blog', 'posts'));
    
    return (
        <div className="container max-w-2xl mx-auto px-4 py-4 sm:px-6">
            <FadeInSection>
                <h1 className="text-3xl font-bold mb-6">Blog</h1>
            </FadeInSection>
            <ul className="space-y-4">
                {posts.map((post) => (
                    <FadeInSection delay={0.1} key={post.metadata.slug}>
                        <li className="border-b pb-4">
                            <Link href={`/blog/${post.metadata.slug}`}>
                                <h2 className="text-xl font-semibold">
                                    <span className="text-sm text-gray-500 mr-1">{formatDate(post.metadata.publishedAt)}</span> {post.metadata.title}
                                </h2>
                            </Link>
                        </li>
                    </FadeInSection>
                ))}
            </ul>
        </div>
    );
}
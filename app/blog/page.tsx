import path from 'path';
import Link from 'next/link';

import FadeInSection from '@/app/components/FadeInSection';
import { getMDXData } from '@/app/utils/mdxUtils';
import { formatDate, dateCompare } from '@/app/utils/dateUtils';

export const metadata = {
  title: "Blog",
};


export default function BlogHome(){
    const posts = getMDXData(path.join('app', 'blog', 'posts'));
    posts.sort((a, b) => dateCompare(b.metadata.publishedAt, a.metadata.publishedAt));

    return (
        <div className="container max-w-2xl mx-auto px-4 py-4 sm:px-6">
            <FadeInSection>
                <h1 className="text-3xl font-bold mb-1">Blog</h1>
            </FadeInSection>
            <FadeInSection delay={0.2}>
                <p className="text-lg mb-6">i love yapping whether peopole read it or not</p>
            </FadeInSection>
            <ul className="space-y-4">
                {posts.map((post, index) => (
                    <FadeInSection delay={0.1 * (index + 1) + 0.2} key={post.metadata.slug}>
                        <Link href={`/blog/${post.metadata.slug}`}>
                            <li className="border-b-2 pb-4 transition-colors hover:border-zinc-600 duration-200">
                                    <h2 className="text-xl font-semibold hover:text-white transition-colors duration-200">
                                        <span className="text-sm text-zinc-300 mr-1 font-normal">{formatDate(post.metadata.publishedAt)}</span> {post.metadata.title}
                                    </h2>
                            </li>
                        </Link>
                    </FadeInSection>
                ))}
            </ul>
        </div>
    );
}
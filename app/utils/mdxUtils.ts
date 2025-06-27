import fs from 'fs';
import path from 'path';

type Metadata = {
    title: string;
    description: string;
    publishedAt: string;
    lastModifiedAt: string;
    slug: string;
    image?: string;

}

type MDXPost = {
    metadata: Metadata;
    content: string;
}

export function getMDXData(dir: string): MDXPost[] {
    const postDir = path.join(process.cwd(), dir);
    const files = fs.readdirSync(postDir).filter(file => file.endsWith('.mdx'));
    const posts: MDXPost[] = [];
    
    for (const file of files) {
        const filePath = path.join(postDir, file);
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);
        posts.push(parseMDXFile(rawContent, stats.mtime));
    }
    
    return posts;
}

function parseMDXFile(content: string, lastModified: Date): MDXPost {
    // regex for frontmatter: "---\nkey: value\n---"
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        throw new Error('No frontmatter found in MDX file');
    }
    
    const frontmatterContent = match[1];
    const mdxContent = content.replace(frontmatterRegex, '').trim();
    
    // front matter fields
    const titleMatch = frontmatterContent.match(/title:\s*["'](.+?)["']/);
    const descriptionMatch = frontmatterContent.match(/description:\s*["'](.+?)["']/);
    const publishedAtMatch = frontmatterContent.match(/publishedAt:\s*["'](.+?)["']/);
    const slugMatch = frontmatterContent.match(/slug:\s*["'](.+?)["']/);
    const imageMatch = frontmatterContent.match(/image:\s*["'](.+?)["']/);
    
    if (!titleMatch || !publishedAtMatch || !slugMatch) {
        throw new Error('Missing required frontmatter fields (title, publishedAt, slug)');
    }
    
    // handle slug -- ensure it is a valid URL slug
    const slug = slugMatch[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const metadata: Metadata = {
        title: titleMatch[1],
        description: descriptionMatch ? descriptionMatch[1] : '',
        publishedAt: publishedAtMatch[1],
        lastModifiedAt: lastModified.toISOString(),
        slug: slug,
        image: imageMatch ? imageMatch[1] : undefined,
    };
    
    return {
        metadata,
        content: mdxContent,
    };
}

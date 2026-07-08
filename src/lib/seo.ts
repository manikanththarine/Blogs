import { BlogPost, BlogCategory } from '../types';

// TODO: replace with the real production domain before deploying.
export const SITE_URL = 'https://your-domain.com';
export const SITE_NAME = 'M&M Blogs';

export function buildCanonical(pathname: string) {
  return `${SITE_URL}${pathname}`;
}

const CATEGORY_SCHEMA_TYPE: Record<BlogCategory, string> = {
  news: 'NewsArticle',
  tech: 'TechArticle',
  sports: 'SportsArticle',
  lyrics: 'Article',
};

export function buildPostJsonLd(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': CATEGORY_SCHEMA_TYPE[post.category],
    headline: post.title,
    description: post.content.slice(0, 200),
    datePublished: post.createdAt,
    author: {
      '@type': 'Person',
      name: post.author.username,
    },
    keywords: post.tags.join(', '),
    url: buildCanonical(`/post/${post.id}`),
  };
}

export function buildCollectionJsonLd(category: string, posts: BlogPost[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category === 'all' ? `${SITE_NAME} - All Posts` : `${SITE_NAME} - ${category}`,
    url: buildCanonical(category === 'all' ? '/' : `/category/${category}`),
    hasPart: posts.slice(0, 20).map((p) => ({
      '@type': 'Article',
      headline: p.title,
      url: buildCanonical(`/post/${p.id}`),
    })),
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

// Blog content is unsanitized user input; escaping "<" prevents a post whose
// title/content contains a literal "</script>" from breaking out of the tag.
export function toJsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

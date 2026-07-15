/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BlogPost } from '../types';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  type?: 'website' | 'article';
  post?: BlogPost;
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  canonicalUrl = '',
  type = 'website',
  post,
}: SEOHeadProps) {
  useEffect(() => {
    // Dynamic updates to page titles and metas
    document.title = `${title} | Scribe Portal`;
    
    // Attempt to update standard head metas (safe in client context)
    const updateMeta = (name: string, value: string, isProperty = false) => {
      let meta = document.querySelector(isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', value);
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords.join(', '));
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', type, true);
    if (post?.featuredImage) {
      updateMeta('og:image', post.featuredImage, true);
      updateMeta('twitter:image', post.featuredImage);
    }
    updateMeta('twitter:card', post?.seoMetadata?.twitterCard || 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
  }, [title, description, keywords, type, post]);

  // Construct structured data (JSON-LD) for SEO / GEO search engines
  const getStructuredData = () => {
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://scribe-portal.example.com/#organization',
      'name': 'Scribe Blog Portal',
      'url': window.location.origin,
      'logo': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=120&h=120&q=80',
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+1-555-867-5309',
        'contactType': 'customer support',
        'email': 'support@scribe-portal.example.com',
      },
    };

    if (type === 'article' && post) {
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': canonicalUrl || `${window.location.origin}/post/${post.slug}`,
        },
        'headline': post.title,
        'description': post.seoMetadata.metaDescription || description,
        'image': post.featuredImage,
        'datePublished': post.publicationDate || post.lastUpdatedDate,
        'dateModified': post.lastUpdatedDate,
        'author': {
          '@type': 'Person',
          'name': post.authorName,
          'jobTitle': post.authorRole,
          'url': `${window.location.origin}/author/${post.authorId}`,
        },
        'publisher': orgSchema,
        'keywords': post.tags.join(', '),
      };

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': window.location.origin,
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': post.category,
            'item': `${window.location.origin}/?category=${post.category}`,
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': post.title,
            'item': canonicalUrl || `${window.location.origin}/post/${post.slug}`,
          },
        ],
      };

      return [articleSchema, breadcrumbSchema];
    }

    // Default FAQ schema for homepage (great for Generative Engines search optimization)
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What categories of content does Scribe publish?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Scribe focuses on curated high-quality articles spanning Songs, News, Sports, and General Knowledge topics.',
          },
        },
        {
          '@type': 'Question',
          'name': 'How are the articles reviewed and published?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'We implement a strict Role-Based Access Control (RBAC) mechanism. Articles are authored by specialized writers, vetted and published by editors, and managed dynamically by administrators.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Can I subscribe for newsletters?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes, we provide a clean, secure newsletter subscription located in the footer of our portal to receive fresh curated articles.',
          },
        },
      ],
    };

    return [orgSchema, faqSchema];
  };

  const schemas = getStructuredData();

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          id={`json-ld-schema-${type}-${index}`}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

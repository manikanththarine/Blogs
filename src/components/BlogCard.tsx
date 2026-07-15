/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Eye, Heart, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogCardProps {
  post: BlogPost;
  onClick: (slug: string) => void;
}

export default function BlogCard({ post, onClick }: BlogCardProps) {
  // Extract simple plain text snippet from rich text content to show on card
  const getSnippet = (html: string, wordLimit = 22) => {
    const text = html.replace(/<[^>]*>/g, ''); // remove html tags
    const words = text.split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Songs': return 'bg-stone-100 text-stone-800 border-stone-200';
      case 'News': return 'bg-stone-200 text-stone-900 border-stone-300';
      case 'Sports': return 'bg-stone-50 text-stone-700 border-stone-200';
      case 'General Knowledge': return 'bg-stone-900 text-stone-50 border-stone-800';
      default: return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  return (
    <article 
      onClick={() => onClick(post.slug)}
      className="group cursor-pointer bg-white border border-stone-200/80 rounded-md overflow-hidden hover:border-stone-400 transition-all duration-300 flex flex-col h-full"
      id={`blog-card-${post.id}`}
    >
      {/* Featured Image Frame */}
      <div className="relative overflow-hidden aspect-video bg-stone-50">
        <img 
          src={post.featuredImage} 
          alt={post.title} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
          referrerPolicy="no-referrer"
        />
        {/* Hover overlay card */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4">
          <div className="bg-white/95 backdrop-blur-xs p-2 rounded-full text-stone-800 shadow-xs border border-stone-200">
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>

      {/* Card Content body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Taxonomy Row */}
          <div className="flex items-center justify-between">
            <span className={`px-2.5 py-0.5 border text-[9px] font-mono font-bold tracking-widest uppercase ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-stone-400">
              <Clock size={11} />
              {post.readTime} min read
            </span>
          </div>

          {/* Heading */}
          <h3 className="text-lg font-serif font-bold text-stone-950 line-clamp-2 tracking-tight group-hover:text-stone-600 transition leading-snug">
            {post.title}
          </h3>

          {/* Snip summary */}
          <p className="text-xs text-stone-600 leading-relaxed font-light line-clamp-3">
            {getSnippet(post.richTextContent)}
          </p>
        </div>

        {/* Footer info row */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          {/* Author Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold text-stone-700 overflow-hidden">
              {post.authorName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-800 leading-tight">{post.authorName}</p>
              <p className="text-[9px] text-stone-400 font-medium leading-tight">{post.authorRole}</p>
            </div>
          </div>

          {/* Engagement metrics */}
          <div className="flex items-center gap-2.5 text-[10px] font-mono text-stone-400">
            <span className="flex items-center gap-1 hover:text-stone-700 transition">
              <Eye size={11} />
              {post.views}
            </span>
            <span className="flex items-center gap-1 hover:text-rose-600 transition">
              <Heart size={11} className={post.likes.length > 0 ? 'fill-rose-500 text-rose-500 border-none' : ''} />
              {post.likes.length}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

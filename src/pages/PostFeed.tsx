import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, ThumbsUp, AlertCircle, Globe, TrendingUp } from 'lucide-react';
import { BlogPost, BlogCategory } from '../types';
import { LayoutContext } from '../components/Layout';
import GeoBanner from '../components/GeoBanner';
import Footer from '../components/Footer';
import type { RouteData } from '../routeData';
import { buildCanonical, buildCollectionJsonLd, buildWebsiteJsonLd, toJsonLdString, SITE_NAME } from '../lib/seo';

const CATEGORY_LABEL: Record<string, string> = {
  all: 'All Feeds',
  news: 'Daily News',
  lyrics: 'Song Lyrics',
  sports: 'Sports Center',
  tech: 'Technology',
};

type FeedData = Extract<RouteData, { kind: 'feed' }>;

interface PostFeedProps {
  initialData?: FeedData;
}

const FEATURED_FALLBACK: BlogPost = {
  id: "post-featured",
  title: "Revolutionizing SSR Engines: Real-Time Content Discovery & Geolocation Indexes",
  content: "Deploying high-velocity blogs requires clever search optimization strategies. By leveraging server-side rendered Node.js backends matched with regional databases, modern portals achieve high scores on Google's search algorithms. This template is designed around dynamic layouts, high fidelity color gradients, automated Google AdSense units, and SEO analysis dashboards to maximize organic crawler traffic.",
  category: "tech",
  author: { id: "seo-expert", username: "SEO Expert" },
  tags: ["seo", "geolocation", "express", "mongodb"],
  views: 0,
  likes: [],
  createdAt: "2026-01-01T00:00:00.000Z"
};

export default function PostFeed({ initialData }: PostFeedProps) {
  const { category: categoryParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, setIsAuthOpen } = useOutletContext<LayoutContext>();

  const activeCategory = (categoryParam as BlogCategory) || 'all';
  const searchQuery = searchParams.get('q') || '';

  const [posts, setPosts] = useState<BlogPost[]>(initialData?.posts ?? []);
  const [showPremiumAd, setShowPremiumAd] = useState(true);
  const consumedInitialData = useRef(initialData);

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (searchQuery) params.append('q', searchQuery);

      const response = await fetch(`/api/posts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    const initial = consumedInitialData.current;
    if (initial && initial.category === activeCategory && initial.query === searchQuery) {
      consumedInitialData.current = undefined;
      return;
    }
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, searchQuery]);

  const handleLikePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => (p.id === postId ? { ...p, likes: data.likes } : p)));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this article?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleAdClick = () => {
    alert("This is a live Google AdSense placeholder. When live, Google automatically parses your content keyword density (currently focused on your filter settings) to place contextually accurate ads, generating revenue per thousands views.");
  };

  const featuredPost = posts[0] || FEATURED_FALLBACK;

  const categoryLabel = CATEGORY_LABEL[activeCategory] || activeCategory;
  const pagePath = activeCategory === 'all' ? '/' : `/category/${activeCategory}`;
  const pageTitle =
    activeCategory === 'all'
      ? `${SITE_NAME} - Daily News, Lyrics, Sports & Technology`
      : `${categoryLabel} | ${SITE_NAME}`;
  const pageDescription =
    activeCategory === 'all'
      ? `Explore the latest news, lyrics, sports, and tech articles on ${SITE_NAME}.`
      : `Browse the latest ${categoryLabel} articles on ${SITE_NAME}.`;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={buildCanonical(pagePath)} />
        {searchQuery && <meta name="robots" content="noindex,follow" />}
        <script type="application/ld+json">
          {toJsonLdString(activeCategory === 'all' ? buildWebsiteJsonLd() : buildCollectionJsonLd(activeCategory, posts))}
        </script>
      </Helmet>

      {/* Dynamic Location Awareness Banner */}
      <GeoBanner />

      {/* Hero Banner Section */}
      <section className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 flex flex-col justify-center border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                Featured Headline
              </span>
              <span className="text-slate-500 text-xs font-mono">
                {new Date(featuredPost.createdAt).toLocaleDateString('en-US')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight max-w-2xl">
              {featuredPost.title}
            </h1>

            <p className="text-slate-400 text-sm max-w-xl leading-relaxed line-clamp-3">
              {featuredPost.content}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/post/${featuredPost.id}`)}
                className="bg-white hover:bg-slate-100 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-xs transition-transform active:scale-95 cursor-pointer shadow-lg"
              >
                Read Featured Story
              </button>
              {currentUser ? (
                <button
                  onClick={() => navigate('/manage')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl font-semibold text-xs border border-slate-700 transition-colors"
                >
                  Draft Custom Post
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 px-5 py-2.5 rounded-xl font-semibold text-xs border border-blue-500/30 transition-colors"
                >
                  Sign In to Contribute
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Google AdSense Placement Column */}
        {showPremiumAd && (
          <div className="w-full lg:w-72 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col items-center justify-between p-4 border-dashed relative group transition-colors hover:border-slate-700">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Sponsored Ad Placement</span>
              <button
                onClick={() => setShowPremiumAd(false)}
                className="text-slate-600 hover:text-slate-400 text-[10px]"
                title="Dismiss ad placeholder"
              >
                Dismiss [x]
              </button>
            </div>

            <div
              onClick={handleAdClick}
              className="w-full h-full min-h-[140px] bg-slate-950 hover:bg-slate-900/90 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4 border border-slate-850 cursor-pointer transition-all hover:scale-101 shadow-inner"
            >
              <div className="p-2 bg-blue-500/10 rounded-full mb-1">
                <Globe className="w-5 h-5 text-blue-500 animate-pulse-slow" />
              </div>
              <strong className="text-slate-200 block text-xs">Google AdSense</strong>
              <span className="text-[10px] text-slate-500 mt-1 block">Click to view keyword density ad placement statistics.</span>
            </div>

            <div className="mt-2 text-[9px] text-slate-600 text-center leading-normal">
              Ad placement adjusts based on user geolocation region: <strong className="text-slate-500">Global</strong>
            </div>
          </div>
        )}
      </section>

      {/* Dynamic Section Description & Quick Switch Bar */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-white capitalize">
              {activeCategory === 'all' ? 'Universal Feed Showcases' : `${activeCategory} Section`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {posts.length} premium client & dynamic content contributions {searchQuery ? `for "${searchQuery}"` : ''}
            </p>
          </div>

          {/* Quick tag references */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fast Filters:</span>
            {['all', 'news', 'lyrics', 'sports', 'tech'].map((cat) => {
              const isActive = activeCategory === cat;
              const qs = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
              const to = (cat === 'all' ? '/' : `/category/${cat}`) + qs;
              return (
                <button
                  key={cat}
                  onClick={() => navigate(to)}
                  className={`px-3 py-1 rounded-full text-xs capitalize transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Layout for Post Showcases */}
        {posts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/30 rounded-2xl border border-slate-800">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-medium">No posts found matching the current search parameters.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="blog-posts-grid">
            {posts.map((post) => {
              const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;

              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="flex flex-col bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-md group h-full justify-between"
                >
                  <div>
                    {/* Top Meta info */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={`text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-lg border ${
                        post.category === 'news'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : post.category === 'lyrics'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : post.category === 'sports'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {post.category === 'lyrics' ? 'Lyrics Database' : post.category}
                      </span>

                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(post.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </div>

                    {/* Content Title */}
                    <h3 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Custom Category Fields Display inside Card Grid */}
                    <div className="my-2.5 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 space-y-1">
                      {post.category === 'news' && post.newsMetadata && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Press: <strong className="text-slate-300">{post.newsMetadata.source}</strong></span>
                          <span className="capitalize px-1.5 py-0.5 rounded-sm bg-red-500/15 text-red-400 font-semibold text-[9px]">
                            {post.newsMetadata.importance} priority
                          </span>
                        </div>
                      )}
                      {post.category === 'lyrics' && post.lyricsMetadata && (
                        <div className="text-slate-400 flex flex-col">
                          <span className="truncate">Artist: <strong className="text-slate-200">{post.lyricsMetadata.artist}</strong></span>
                          {post.lyricsMetadata.album && <span className="text-[10px] text-slate-500 truncate">Album: {post.lyricsMetadata.album}</span>}
                        </div>
                      )}
                      {post.category === 'sports' && post.sportsMetadata && (
                        <div className="text-slate-400 flex flex-col">
                          <span className="text-orange-400 font-semibold">{post.sportsMetadata.sportType} Duel</span>
                          <span className="truncate text-slate-300">{post.sportsMetadata.teamNames.join(' vs ')}</span>
                          {post.sportsMetadata.score && <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded-sm w-fit mt-0.5">Score: {post.sportsMetadata.score}</span>}
                        </div>
                      )}
                      {post.category === 'tech' && post.techMetadata && (
                        <div className="text-slate-400 space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {post.techMetadata.techStack.map((tech, idx) => (
                              <span key={idx} className="bg-slate-900 px-1.5 py-0.5 rounded-xs text-[9px] font-mono text-emerald-400 border border-slate-800">{tech}</span>
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-500 capitalize">Difficulty: {post.techMetadata.difficulty}</div>
                        </div>
                      )}
                    </div>

                    {/* Snippet body */}
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                      {post.content}
                    </p>
                  </div>

                  {/* Bottom controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{post.views}</span>
                      </span>

                      <button
                        onClick={(e) => handleLikePost(e, post.id)}
                        className={`flex items-center gap-1 transition-colors hover:text-emerald-400 cursor-pointer ${isLiked ? 'text-emerald-400 font-semibold' : ''}`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-emerald-400/20' : ''}`} />
                        <span>{post.likes.length}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentUser && (currentUser.id === post.author.id || currentUser.role === 'admin') && (
                        <button
                          onClick={(e) => handleDeletePost(e, post.id)}
                          className="text-[10px] font-semibold text-red-500 hover:text-red-400 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter group-hover:translate-x-1 transition-transform">
                        Read Full Article →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

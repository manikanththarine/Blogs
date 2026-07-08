import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { User as UserIcon, ThumbsUp, Eye } from 'lucide-react';
import { BlogPost } from '../types';
import { LayoutContext } from '../components/Layout';
import Footer from '../components/Footer';
import type { RouteData } from '../routeData';
import { buildCanonical, buildPostJsonLd, toJsonLdString, SITE_NAME } from '../lib/seo';

type PostRouteData = Extract<RouteData, { kind: 'post' }>;

interface PostDetailProps {
  initialData?: PostRouteData;
}

export default function PostDetail({ initialData }: PostDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useOutletContext<LayoutContext>();

  const [post, setPost] = useState<BlogPost | null>(initialData?.post ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [notFound, setNotFound] = useState(initialData ? initialData.post === null : false);
  const viewCounted = useRef(false);
  const consumedInitialData = useRef(initialData);

  useEffect(() => {
    const initial = consumedInitialData.current;
    if (initial && initial.postId === id) {
      consumedInitialData.current = undefined;
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    viewCounted.current = false;

    (async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setPost(data);
        }
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!post || viewCounted.current) return;
    viewCounted.current = true;
    fetch(`/api/posts/${post.id}/view`, { method: 'POST' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setPost(prev => prev ? { ...prev, views: data.views } : prev);
      })
      .catch(err => console.error("Failed to post view increment:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  const handleLikePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!currentUser || !post) return;

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        const data = await res.json();
        setPost(prev => prev ? { ...prev, likes: data.likes } : prev);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this article?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        navigate('/');
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-slate-500 text-sm">Loading article...</p>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center space-y-3">
        <Helmet>
          <title>{`Article Not Found | ${SITE_NAME}`}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <p className="text-slate-300 text-lg font-bold">Article not found.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          Back to Home
        </button>
      </main>
    );
  }

  const description = post.content.slice(0, 160).replace(/\s+/g, ' ').trim() + '...';
  const canonicalUrl = buildCanonical(`/post/${post.id}`);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Helmet>
        <title>{`${post.title} | ${SITE_NAME}`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content={SITE_NAME} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={description} />

        <script type="application/ld+json">{toJsonLdString(buildPostJsonLd(post))}</script>
      </Helmet>
      <article className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/25 uppercase font-bold tracking-wider">
              {post.category}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Published {new Date(post.createdAt).toLocaleString('en-US')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 py-1 border-y border-slate-800">
            <div className="p-1.5 bg-slate-800 rounded-lg text-blue-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-200">Written by <strong className="text-blue-400">{post.author.username}</strong></p>
              <p className="text-[10px] text-slate-500">ID Reference: {post.author.id}</p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={(e) => handleLikePost(e, post.id)}
                className={`flex items-center gap-1 text-xs py-1 px-2.5 rounded-lg border bg-slate-850 hover:bg-slate-800 transition-colors cursor-pointer ${
                  currentUser && post.likes.includes(currentUser.id)
                    ? 'text-emerald-400 border-emerald-500/30 font-semibold bg-emerald-500/5'
                    : 'text-slate-400 border-slate-800'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{post.likes.length} Likes</span>
              </button>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{post.views} views</span>
              </span>
            </div>
          </div>

          {/* Category Custom fields inside detail render */}
          {(post.newsMetadata || post.lyricsMetadata || post.sportsMetadata || post.techMetadata) && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Metadata Schema Definitions</h4>

              {post.category === 'news' && post.newsMetadata && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">News Source Outlet</span>
                    <span className="font-semibold text-slate-200">{post.newsMetadata.source}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Critical Priority Level</span>
                    <span className="font-semibold text-red-400 capitalize">{post.newsMetadata.importance}</span>
                  </div>
                </div>
              )}

              {post.category === 'lyrics' && post.lyricsMetadata && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Recording Artist</span>
                    <span className="font-semibold text-slate-200">{post.lyricsMetadata.artist}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Song Track Name</span>
                    <span className="font-semibold text-purple-400">{post.lyricsMetadata.songTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Studio Album</span>
                    <span className="font-semibold text-slate-400">{post.lyricsMetadata.album || 'Single track Release'}</span>
                  </div>
                </div>
              )}

              {post.category === 'sports' && post.sportsMetadata && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Sports Discipline</span>
                    <span className="font-semibold text-slate-200">{post.sportsMetadata.sportType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contesting Teams</span>
                    <span className="font-semibold text-orange-400">{post.sportsMetadata.teamNames.join(' vs ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Final Match Score</span>
                    <span className="font-semibold text-emerald-400 font-mono">{post.sportsMetadata.score || 'In Progress'}</span>
                  </div>
                </div>
              )}

              {post.category === 'tech' && post.techMetadata && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Development Stack Technologies</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.techMetadata.techStack.map((tech, idx) => (
                        <span key={idx} className="bg-slate-900 border border-slate-800 text-emerald-400 px-2 py-0.5 rounded-xs font-mono text-[10px]">{tech}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Content Difficulty Tier</span>
                    <span className="font-semibold text-slate-200 capitalize">{post.techMetadata.difficulty}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main article block */}
          <div className="text-slate-350 text-sm leading-relaxed whitespace-pre-wrap py-2 font-sans">
            {post.content}
          </div>

          {/* Tag references */}
          {post.tags.length > 0 && (
            <div className="pt-4 border-t border-slate-850 flex flex-wrap gap-1.5 items-center">
              <span className="text-slate-500 text-[10px] font-bold uppercase mr-1.5">Meta Keywords:</span>
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  onClick={() => navigate(`/?q=${encodeURIComponent(tag)}`)}
                  className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-blue-400 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {currentUser && (currentUser.id === post.author.id || currentUser.role === 'admin') && (
            <div className="pt-4 border-t border-slate-850 flex justify-end">
              <button
                onClick={() => handleDeletePost(post.id)}
                className="text-xs font-semibold text-red-500 hover:text-red-400 px-3 py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
              >
                Delete Article
              </button>
            </div>
          )}
        </div>
      </article>

      <Footer />
    </main>
  );
}

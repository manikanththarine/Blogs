import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Tag, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { User, BlogPost, BlogCategory } from '../types';

interface ManagePostsProps {
  user: User;
  onBack: () => void;
}

const emptyForm = {
  title: '',
  content: '',
  category: 'news' as BlogCategory,
  tagInput: '',
  newsSource: '',
  newsImportance: 'medium' as 'high' | 'medium' | 'low',
  lyricsArtist: '',
  lyricsSongTitle: '',
  lyricsAlbum: '',
  sportsType: '',
  sportsTeams: '',
  sportsScore: '',
  techStackInput: '',
  techDifficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced'
};

export default function ManagePosts({ user, onBack }: ManagePostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = user.role === 'admin';

  const fetchMyPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data: BlogPost[] = await res.json();
        setPosts(isAdmin ? data : data.filter(p => p.author.id === user.id));
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingPostId(null);
    setError('');
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (post: BlogPost) => {
    setEditingPostId(post.id);
    setForm({
      title: post.title,
      content: post.content,
      category: post.category,
      tagInput: post.tags.join(', '),
      newsSource: post.newsMetadata?.source || '',
      newsImportance: post.newsMetadata?.importance || 'medium',
      lyricsArtist: post.lyricsMetadata?.artist || '',
      lyricsSongTitle: post.lyricsMetadata?.songTitle || '',
      lyricsAlbum: post.lyricsMetadata?.album || '',
      sportsType: post.sportsMetadata?.sportType || '',
      sportsTeams: post.sportsMetadata?.teamNames.join(', ') || '',
      sportsScore: post.sportsMetadata?.score || '',
      techStackInput: post.techMetadata?.techStack.join(', ') || '',
      techDifficulty: post.techMetadata?.difficulty || 'intermediate'
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and Content are required fields.');
      return;
    }

    setSaving(true);

    const tags = form.tagInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const body: any = {
      title: form.title,
      content: form.content,
      category: form.category,
      tags: [...new Set([...tags, form.category])]
    };

    if (form.category === 'news') {
      body.newsMetadata = { source: form.newsSource.trim() || 'Global Wire', importance: form.newsImportance };
    } else if (form.category === 'lyrics') {
      body.lyricsMetadata = {
        artist: form.lyricsArtist.trim() || 'Unknown Artist',
        songTitle: form.lyricsSongTitle.trim() || form.title,
        album: form.lyricsAlbum.trim() || undefined
      };
    } else if (form.category === 'sports') {
      body.sportsMetadata = {
        sportType: form.sportsType.trim() || 'Athletics',
        teamNames: form.sportsTeams.split(',').map(t => t.trim()).filter(t => t.length > 0),
        score: form.sportsScore.trim() || undefined
      };
    } else if (form.category === 'tech') {
      body.techMetadata = {
        techStack: form.techStackInput.split(',').map(t => t.trim()).filter(t => t.length > 0),
        difficulty: form.techDifficulty
      };
    }

    try {
      let res: Response;
      if (editingPostId) {
        res = await fetch(`/api/posts/${editingPostId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, userId: user.id })
        });
      } else {
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, authorId: user.id, authorUsername: user.username })
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save post');
      }

      const savedPost = await res.json();
      setPosts(prev => {
        if (editingPostId) {
          return prev.map(p => (p.id === savedPost.id ? savedPost : p));
        }
        return [savedPost, ...prev];
      });

      closeForm();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving your post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white">Manage Posts</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmin ? 'Create, update, and delete any post on the platform.' : 'Create, update, and delete your own posts.'}
            </p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={openCreateForm}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Post</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">{editingPostId ? 'Edit Post' : 'Create New Post'}</h2>
            </div>
            <button onClick={closeForm} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-xs text-red-400 border border-red-500/30 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Post Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter catchy headline..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as BlogCategory })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="news">Daily News</option>
                  <option value="lyrics">Song Lyrics</option>
                  <option value="sports">Sports Center</option>
                  <option value="tech">Technology</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/50 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category Custom Fields</h3>

              {form.category === 'news' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">News Source / Press</label>
                    <input
                      type="text"
                      value={form.newsSource}
                      onChange={(e) => setForm({ ...form, newsSource: e.target.value })}
                      placeholder="e.g. Associated Press"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Importance Level</label>
                    <div className="flex gap-2">
                      {(['high', 'medium', 'low'] as const).map((imp) => (
                        <button
                          type="button"
                          key={imp}
                          onClick={() => setForm({ ...form, newsImportance: imp })}
                          className={`flex-1 py-1.5 rounded-lg border text-xs capitalize font-medium transition-all ${
                            form.newsImportance === imp
                              ? 'bg-red-500/15 text-red-400 border-red-500/30 font-semibold'
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {imp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {form.category === 'lyrics' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Artist / Band Name</label>
                    <input
                      type="text"
                      value={form.lyricsArtist}
                      onChange={(e) => setForm({ ...form, lyricsArtist: e.target.value })}
                      placeholder="e.g. Luna Rayne"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Song Title</label>
                    <input
                      type="text"
                      value={form.lyricsSongTitle}
                      onChange={(e) => setForm({ ...form, lyricsSongTitle: e.target.value })}
                      placeholder="e.g. Starlight Harmony"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Album (Optional)</label>
                    <input
                      type="text"
                      value={form.lyricsAlbum}
                      onChange={(e) => setForm({ ...form, lyricsAlbum: e.target.value })}
                      placeholder="e.g. Cosmic Dream"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {form.category === 'sports' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Sport Discipline</label>
                    <input
                      type="text"
                      value={form.sportsType}
                      onChange={(e) => setForm({ ...form, sportsType: e.target.value })}
                      placeholder="e.g. Football, Tennis"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Competing Teams / Players</label>
                    <input
                      type="text"
                      value={form.sportsTeams}
                      onChange={(e) => setForm({ ...form, sportsTeams: e.target.value })}
                      placeholder="e.g. Arsenal, Chelsea"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Live/Final Score (Optional)</label>
                    <input
                      type="text"
                      value={form.sportsScore}
                      onChange={(e) => setForm({ ...form, sportsScore: e.target.value })}
                      placeholder="e.g. 3 - 1"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {form.category === 'tech' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Tech Stack / Frameworks</label>
                    <input
                      type="text"
                      value={form.techStackInput}
                      onChange={(e) => setForm({ ...form, techStackInput: e.target.value })}
                      placeholder="e.g. React 19, TypeScript, Node.js"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Difficulty Tier</label>
                    <div className="flex gap-2">
                      {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
                        <button
                          type="button"
                          key={diff}
                          onClick={() => setForm({ ...form, techDifficulty: diff })}
                          className={`flex-1 py-1.5 rounded-lg border text-xs capitalize font-medium transition-all ${
                            form.techDifficulty === diff
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {form.category === 'lyrics' ? 'Lyrics Body' : 'Post Content'}
              </label>
              <textarea
                required
                rows={8}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder={form.category === 'lyrics' ? '[Verse 1]\nWrite lyrics here...' : 'Compose your post content...'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Keywords / Search Tags</span>
              </label>
              <input
                type="text"
                value={form.tagInput}
                onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                placeholder="e.g. webdev, nextjs, trend (comma-separated)"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {editingPostId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Saving...' : editingPostId ? 'Save Changes' : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          {isAdmin ? 'All Posts' : 'Your Posts'} ({posts.length})
        </h2>

        {loadingPosts ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No posts yet. Click "New Post" to create your first one.
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      {post.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(post.createdAt).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate">{post.title}</h3>
                  <p className="text-[11px] text-slate-500">By {post.author.username} · {post.views} views · {post.likes.length} likes</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditForm(post)}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                    title="Edit Post"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

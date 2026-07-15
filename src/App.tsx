/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, LogIn, LogOut, User as UserIcon, Layout, FileText, 
  Menu, X, Sparkles, Star, MessageCircle, Info, ChevronRight, HelpCircle, 
  MapPin, Phone, Mail, Link2, Copy, Check, Heart, ThumbsUp, Share2, Clock 
} from 'lucide-react';

import { User, BlogPost, BlogComment, PostStatus } from './types';
import SEOHead from './components/SEOHead';
import BlogCard from './components/BlogCard';
import CommentSection from './components/CommentSection';
import AuthModal from './components/AuthModal';
import DashboardView from './components/DashboardView';
import OpenApiExplorer from './components/OpenApiExplorer';
import { ContactForm, NewsletterBox } from './components/EngagementForms';

type ViewType = 'home' | 'post' | 'dashboard' | 'docs' | 'contact';

export default function App() {
  // Navigation & Routing States
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [activePostSlug, setActivePostSlug] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('scribe_jwt_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Blog Posts & Content Lists States
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Single Active Post States (Reading Room)
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loadingActivePost, setLoadingActivePost] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);

  // UI Toast indicators
  const [toastMessage, setToastMessage] = useState('');

  // Restore User session on load
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Expired Token');
        })
        .then((data) => {
          setCurrentUser(data.user);
        })
        .catch((err) => {
          console.warn('Session expired or invalid, cleaning up:', err);
          handleLogout();
        });
    }
  }, [token]);

  // Fetch posts when category, search, tag, or page changes
  useEffect(() => {
    if (currentView === 'home') {
      setLoadingPosts(true);
      
      let url = `/api/posts?page=${page}&limit=6`;
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (selectedTag) url += `&tag=${encodeURIComponent(selectedTag)}`;
      if (activeSearch) url += `&search=${encodeURIComponent(activeSearch)}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          console.log('Fetched posts data:', data);
          setPosts(data.posts || []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
          }
          setLoadingPosts(false);
        })
        .catch((err) => {
          console.error('Error fetching posts:', err);
          setLoadingPosts(false);
        });
    }
  }, [categoryFilter, selectedTag, activeSearch, page, currentView]);

  // Fetch single active post details when activePostSlug triggers
  useEffect(() => {
    if (currentView === 'post' && activePostSlug) {
      setLoadingActivePost(true);
      fetch(`/api/posts/${activePostSlug}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch post details');
          return res.json();
        })
        .then((data) => {
          setActivePost(data.post);
          setRelatedPosts(data.relatedPosts || []);
          setComments(data.comments || []);
          setLoadingActivePost(false);
          
          // Prepopulate likes state if logged-in user already liked it
          if (currentUser && data.post.likes.includes(currentUser.id)) {
            if (!likedPostIds.includes(data.post.id)) {
              setLikedPostIds([...likedPostIds, data.post.id]);
            }
          }
        })
        .catch((err) => {
          console.error(err);
          setLoadingActivePost(false);
          triggerToast('Blog post could not be retrieved.');
          setCurrentView('home');
        });
    }
  }, [activePostSlug, currentView, currentUser]);

  const handleAuthSuccess = (newToken: string, user: User) => {
    localStorage.setItem('scribe_jwt_token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    triggerToast(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('scribe_jwt_token');
    setToken(null);
    setCurrentUser(null);
    triggerToast('Logged out successfully.');
    setCurrentView('home');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Like Toggle Function
  const handleLikePost = async (postId: string) => {
    if (!currentUser || !token) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (likedPostIds.includes(postId)) {
          setLikedPostIds(likedPostIds.filter((id) => id !== postId));
        } else {
          setLikedPostIds([...likedPostIds, postId]);
        }
        
        // Refresh active post to update likes lists if viewing single post
        if (activePost && activePost.id === postId) {
          setActivePost({
            ...activePost,
            likes: data.likes,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Comment Creation Handler
  const handleAddComment = async (content: string) => {
    if (!activePost || !token) return;
    try {
      const response = await fetch(`/api/posts/${activePost.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (response.ok) {
        setComments([data.comment, ...comments]);
        triggerToast('Comment posted successfully!');
      } else {
        alert(data.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Comment Deletion Handler
  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
        triggerToast('Comment deleted successfully.');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete comment');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSharePost = (slug: string) => {
    const shareUrl = `${window.location.origin}/?slug=${slug}`;
    navigator.clipboard.writeText(shareUrl);
    triggerToast('Post reference URL copied to clipboard!');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setSelectedTag('');
    setPage(1);
  };

  const handleCategorySelect = (cat: string) => {
    setCategoryFilter(cat);
    setSelectedTag('');
    setPage(1);
  };

  const handleClearFilters = () => {
    setCategoryFilter('');
    setSelectedTag('');
    setSearchQuery('');
    setActiveSearch('');
    setPage(1);
  };

  // Quick navigation helpers
  const navigateToHome = () => {
    setCurrentView('home');
    setActivePostSlug(null);
    handleClearFilters();
  };

  const navigateToPost = (slug: string) => {
    setActivePostSlug(slug);
    setCurrentView('post');
  };

  // Find Featured Post (fallback to index 0 if none explicitly selected)
  const featuredPost = posts.find((p) => p.featuredPostOption && p.status === 'Published') || posts[0];

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-stone-900 flex flex-col font-sans" id="scribe-blog-portal-root">
      
      {/* Dynamic SEO Meta Header Injection */}
      {currentView === 'post' && activePost ? (
        <SEOHead
          title={activePost.title}
          description={activePost.seoMetadata.metaDescription}
          keywords={activePost.tags}
          type="article"
          post={activePost}
        />
      ) : (
        <SEOHead
          title={
            currentView === 'dashboard' ? 'CMS Dashboard' : 
            currentView === 'docs' ? 'REST API Playground' : 
            currentView === 'contact' ? 'Support & Inquiry Office' : 'Curated Wisdom Portal'
          }
          description="Scribe Portal is an interactive responsive CMS and publication platform built with JWT verification and Role-Based Permissions."
          keywords={['Songs', 'News', 'Sports', 'General Knowledge', 'CMS', 'React CMS']}
        />
      )}

      {/* Header import has been placed above */}

      {/* --- PUBLIC SITE STICKY NAVBAR --- */}
      <header className="sticky top-0 z-40 bg-[#FDFDFB]/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div 
            onClick={navigateToHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-stone-950 rounded-xs flex items-center justify-center text-white transition group-hover:bg-stone-800">
              <BookOpen size={15} className="fill-white/10" />
            </div>
            <div>
              <h1 className="text-base font-serif font-black text-stone-950 tracking-tight leading-none">
                Scribe <span className="font-sans font-light italic text-stone-500 lowercase tracking-normal">portal</span>
              </h1>
              <span className="text-[8px] font-mono font-semibold text-stone-400 tracking-widest uppercase leading-none mt-1 block">Curated Insights</span>
            </div>
          </div>

          {/* Core Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono uppercase tracking-widest text-stone-500">
            <button 
              type="button" 
              onClick={navigateToHome}
              className={`hover:text-stone-950 transition py-1 ${currentView === 'home' ? 'text-stone-950 font-bold border-b border-stone-950' : ''}`}
            >
              Publications
            </button>
            <button 
              type="button" 
              onClick={() => { setCurrentView('contact'); setActivePostSlug(null); }}
              className={`hover:text-stone-950 transition py-1 ${currentView === 'contact' ? 'text-stone-950 font-bold border-b border-stone-950' : ''}`}
            >
              Contact Us
            </button>
            <button 
              type="button" 
              onClick={() => { setCurrentView('docs'); setActivePostSlug(null); }}
              className={`hover:text-stone-950 transition py-1 ${currentView === 'docs' ? 'text-stone-950 font-bold border-b border-stone-950' : ''}`}
            >
              API Playground
            </button>

            {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Editor' || currentUser.role === 'Author') && (
              <button 
                type="button" 
                onClick={() => { setCurrentView('dashboard'); setActivePostSlug(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest transition border border-stone-200 ${
                  currentView === 'dashboard' ? 'bg-stone-950 border-stone-950 text-white' : ''
                }`}
              >
                <Layout size={11} />
                <span>CMS Console</span>
              </button>
            )}
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-sm">
                <div className="w-6 h-6 rounded-full bg-stone-900 flex items-center justify-center text-[9px] font-mono font-bold text-white">
                  {currentUser.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-stone-800 leading-none">{currentUser.name}</p>
                  <span className="text-[8px] text-stone-400 font-mono tracking-wider leading-none mt-0.5 block">{currentUser.role}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 text-stone-400 hover:text-stone-950 rounded-sm transition hover:bg-stone-100"
                  title="Sign Out Session"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-950 hover:bg-stone-800 text-white font-mono font-medium rounded-sm text-[10px] tracking-widest uppercase transition shadow-xs cursor-pointer"
              >
                <LogIn size={12} />
                <span>Sign In Portal</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Mobile Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white p-4 space-y-4 animate-fadeIn">
            <nav className="flex flex-col gap-3.5 text-xs font-semibold text-slate-700">
              <button 
                type="button" 
                onClick={() => { navigateToHome(); setMobileMenuOpen(false); }}
                className="text-left py-1 hover:text-indigo-600"
              >
                Publications Feed
              </button>
              <button 
                type="button" 
                onClick={() => { setCurrentView('contact'); setActivePostSlug(null); setMobileMenuOpen(false); }}
                className="text-left py-1 hover:text-indigo-600"
              >
                Contact Inquiry Box
              </button>
              <button 
                type="button" 
                onClick={() => { setCurrentView('docs'); setActivePostSlug(null); setMobileMenuOpen(false); }}
                className="text-left py-1 hover:text-indigo-600"
              >
                Interactive REST API Docs
              </button>

              {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Editor' || currentUser.role === 'Author') && (
                <button 
                  type="button" 
                  onClick={() => { setCurrentView('dashboard'); setActivePostSlug(null); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 py-1.5 px-3 bg-slate-100 rounded-lg text-left"
                >
                  <Layout size={13} />
                  <span>CMS Dashboard Console</span>
                </button>
              )}
            </nav>

            {/* Mobile Auth row */}
            <div className="pt-3 border-t border-slate-100">
              {currentUser ? (
                <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                      {currentUser.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{currentUser.name}</p>
                      <span className="text-[9px] text-slate-400 font-mono">{currentUser.role}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition text-xs font-semibold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition"
                >
                  <LogIn size={13} />
                  <span>Sign In Portal</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* --- FLOATING MICRO-TOAST NOTIFICATION TRIGGER --- */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-slate-800 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <Check size={14} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* --- MAIN PAGE LAYOUT BODY --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        
        {/* VIEW 1: BLOG HOME FEED SCREEN */}
        {currentView === 'home' && (
          <div className="space-y-10">
            
            {/* HERO BANNER SECTION (ONLY IF NO FILTERS ACTIVE AND ARTICLES PRESENT) */}
            {!categoryFilter && !activeSearch && !selectedTag && featuredPost && (
              <section 
                onClick={() => navigateToPost(featuredPost.slug)}
                className="group cursor-pointer bg-white border border-stone-200 rounded-md overflow-hidden hover:border-stone-400 transition-all duration-500 grid grid-cols-1 lg:grid-cols-2"
                id="portal-featured-editorial-hero"
              >
                {/* Hero Frame Image */}
                <div className="relative overflow-hidden aspect-video lg:aspect-auto min-h-[250px] lg:h-[400px] bg-stone-50">
                  <img 
                    src={featuredPost.featuredImage} 
                    alt={featuredPost.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-101"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-stone-950 text-white font-mono font-bold text-[9px] tracking-widest uppercase rounded-sm shadow-xs">
                      <Star size={10} className="fill-white" />
                      Featured Article
                    </span>
                  </div>
                </div>

                {/* Hero Frame Text content */}
                <div className="p-6 md:p-10 flex flex-col justify-between space-y-6 bg-white">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 border border-stone-300 bg-stone-100 text-stone-800 text-[9px] font-mono font-bold tracking-widest uppercase rounded-sm">
                        {featuredPost.category}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest">{featuredPost.readTime} minute read</span>
                    </div>

                    <h2 className="text-xl md:text-3xl font-serif font-black italic text-stone-950 tracking-tight leading-tight group-hover:text-stone-700 transition line-clamp-3">
                      {featuredPost.title}
                    </h2>

                    <p className="text-xs text-stone-600 leading-relaxed font-light line-clamp-4">
                      {featuredPost.richTextContent.replace(/<[^>]*>/g, '').slice(0, 240)}...
                    </p>
                  </div>

                  {/* Author profile */}
                  <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-mono font-semibold text-stone-700">
                        {featuredPost.authorName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800 leading-tight">{featuredPost.authorName}</p>
                        <p className="text-[9px] text-stone-400 font-mono uppercase tracking-wider mt-0.5">{featuredPost.authorRole} • {new Date(featuredPost.publicationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-950 group-hover:translate-x-1 uppercase tracking-widest transition-transform flex items-center gap-1">
                      Read Article
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* TAXONOMY FILTER BAR & SEARCH ENGINE */}
            <section className="bg-white border border-stone-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Category selector row */}
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('')}
                  className={`px-3.5 py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wider font-bold border transition ${
                    categoryFilter === '' 
                      ? 'bg-stone-950 border-stone-950 text-white shadow-xs' 
                      : 'border-stone-100 hover:border-stone-300 text-stone-600 bg-stone-50/50'
                  }`}
                >
                  All Categories
                </button>
                {['Songs', 'News', 'Sports', 'General Knowledge'].map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`px-3.5 py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wider font-bold border transition ${
                      categoryFilter === cat 
                        ? 'bg-stone-950 border-stone-950 text-white shadow-xs' 
                        : 'border-stone-100 hover:border-stone-300 text-stone-600 bg-stone-50/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Fuzzy Text Search query Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-80">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search titles, tags, content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 text-stone-800 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-mono font-bold tracking-widest uppercase rounded-sm text-[10px] transition whitespace-nowrap cursor-pointer"
                >
                  Search
                </button>
              </form>
            </section>

            {/* Filter tags header details if active */}
            {(categoryFilter || activeSearch || selectedTag) && (
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2 flex-wrap text-xs text-stone-500">
                  <span className="font-mono text-[10px] uppercase tracking-wider">Filtered feed results:</span>
                  {categoryFilter && (
                    <span className="px-2.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-900 rounded-sm font-mono font-semibold text-[9px] uppercase tracking-wider">
                      Category: {categoryFilter}
                    </span>
                  )}
                  {activeSearch && (
                    <span className="px-2.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-900 rounded-sm font-mono font-semibold text-[9px] uppercase tracking-wider">
                      Keyword: "{activeSearch}"
                    </span>
                  )}
                  {selectedTag && (
                    <span className="px-2.5 py-0.5 bg-stone-900 text-white border border-stone-950 rounded-sm font-mono font-semibold text-[9px] uppercase tracking-wider">
                      Tag: #{selectedTag}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[10px] font-mono font-bold tracking-widest uppercase text-stone-950 border-b border-stone-950 hover:text-stone-600 hover:border-stone-400 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* FEED BODY WORKSPACE (Grid + Sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Primary Feed Column */}
              <div className="lg:col-span-2 space-y-8">
                {loadingPosts ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white border border-stone-200 rounded-md p-5 h-72 animate-pulse space-y-4">
                        <div className="bg-stone-100 h-36 w-full rounded-sm" />
                        <div className="h-4 bg-stone-100 w-3/4 rounded-sm" />
                        <div className="h-3 bg-stone-100 w-1/2 rounded-sm" />
                      </div>
                    ))}
                  </div>
                ) : posts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {posts.map((post) => (
                        <div key={post.id} id={`blog-card-wrapper-${post.id}`}>
                          <BlogCard 
                            post={post} 
                            onClick={navigateToPost} 
                          />
                        </div>
                      ))}
                    </div>

                    {/* Pagination control rails */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 pt-6">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage(page - 1)}
                          className="px-3.5 py-1.5 border border-stone-300 hover:bg-stone-50 disabled:opacity-40 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition text-stone-700"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-stone-500 font-mono font-bold">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => setPage(page + 1)}
                          className="px-3.5 py-1.5 border border-stone-300 hover:bg-stone-50 disabled:opacity-40 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition text-stone-700"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 bg-white border border-stone-200 rounded-md p-6">
                    <p className="text-sm font-serif font-bold text-stone-800 mb-1">No Articles Match Your Criteria</p>
                    <p className="text-xs text-stone-500 mb-4 font-light">Try refining your search keyword or selecting another category.</p>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="px-4 py-2 bg-stone-950 hover:bg-stone-800 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-sm transition"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar Widget rails */}
              <div className="space-y-6">
                
                {/* About Portal Block */}
                <div className="bg-white border border-stone-200 rounded-md p-5 shadow-none space-y-3">
                  <h3 className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Info size={13} className="text-stone-800" />
                    About Scribe CMS Portal
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-light">
                    Welcome to our modern, fully responsive CMS blog space. Scribe Portal features enterprise authentication, role-based workflows (Admin, Editor, Author, Reader), interactive API terminals, and fully compliant JSON-LD search engine markers.
                  </p>
                </div>

                {/* Popular Tags cloud */}
                <div className="bg-white border border-stone-200 rounded-md p-5 shadow-none space-y-3.5">
                  <h3 className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-widest">Popular Subject Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {['Music', 'Streaming', 'Tech', 'Decentralization', 'Sustainability', 'Engineering', 'Science', 'Facts', 'History'].map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => { setSelectedTag(tag); setPage(1); }}
                        className={`px-2.5 py-1 text-[9px] font-mono font-bold border rounded-sm transition ${
                          selectedTag === tag 
                            ? 'bg-stone-950 border-stone-950 text-white' 
                            : 'bg-stone-50/50 border-stone-200 hover:border-stone-400 text-stone-600'
                        }`}
                      >
                        # {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Newsletter Box component */}
                <NewsletterBox />
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: SINGLE BLOG POST READING ROOM */}
        {currentView === 'post' && (
          <div className="space-y-8 animate-fadeIn" id="scribe-reading-room">
            {loadingActivePost || !activePost ? (
              <div className="bg-white border border-stone-200 rounded-md p-10 space-y-6 animate-pulse max-w-4xl mx-auto">
                <div className="bg-stone-100 h-10 w-3/4 rounded-sm" />
                <div className="bg-stone-100 h-5 w-1/3 rounded-sm" />
                <div className="bg-stone-100 h-72 w-full rounded-sm" />
                <div className="space-y-2">
                  <div className="bg-stone-100 h-4 w-full rounded-sm" />
                  <div className="bg-stone-100 h-4 w-full rounded-sm" />
                  <div className="bg-stone-100 h-4 w-5/6 rounded-sm" />
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Back to Home & Breadcrumb rails */}
                <nav className="flex items-center justify-between text-[11px] font-mono text-stone-400 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={navigateToHome}
                    className="font-bold text-stone-950 hover:text-stone-700 transition flex items-center gap-1 border-b border-stone-950 pb-0.5"
                  >
                    ← Back to feed
                  </button>
                  <div className="hidden sm:flex items-center gap-1.5 font-medium">
                    <span className="hover:text-stone-700 cursor-pointer" onClick={navigateToHome}>Home</span>
                    <ChevronRight size={10} />
                    <span className="hover:text-stone-700 cursor-pointer" onClick={() => handleCategorySelect(activePost.category)}>{activePost.category}</span>
                    <ChevronRight size={10} />
                    <span className="text-stone-600 font-bold truncate max-w-xs">{activePost.title}</span>
                  </div>
                </nav>

                {/* Main Article Container */}
                <article className="bg-white border border-stone-200 rounded-md shadow-none overflow-hidden">
                  
                  {/* Article Headline Header */}
                  <div className="p-6 md:p-10 space-y-5 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 border border-stone-300 bg-stone-100 text-stone-800 text-[9px] font-mono font-bold tracking-widest uppercase rounded-sm">
                        {activePost.category}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest flex items-center gap-1">
                        <Clock size={11} />
                        {activePost.readTime} min read
                      </span>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-serif font-black text-stone-950 tracking-tight leading-tight">
                      {activePost.title}
                    </h1>

                    {/* Author card badge */}
                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-mono font-semibold text-xs text-stone-700 overflow-hidden">
                        {activePost.authorName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800 leading-tight">{activePost.authorName}</p>
                        <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider leading-none mt-1.5">
                          Role: {activePost.authorRole} • Published: {new Date(activePost.publicationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Featured Image */}
                  <div className="w-full aspect-video bg-stone-50 max-h-[450px] overflow-hidden">
                    <img 
                      src={activePost.featuredImage} 
                      alt={activePost.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* HTML Rich text block */}
                  <div className="p-6 md:p-10">
                    <div 
                      className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-bold prose-headings:text-stone-950 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-stone-800 prose-p:leading-relaxed prose-p:mb-6 prose-p:font-light prose-blockquote:border-l-2 prose-blockquote:border-stone-950 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-stone-700 prose-blockquote:my-8 prose-blockquote:bg-stone-50/50 prose-blockquote:p-5 prose-blockquote:rounded-none prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-li:mb-2 prose-img:my-10 prose-img:rounded-sm"
                      dangerouslySetInnerHTML={{ __html: activePost.richTextContent }}
                    />

                    {/* Tags block */}
                    <div className="flex flex-wrap gap-2 pt-6 border-t border-stone-100 mt-10">
                      {activePost.tags.map((tag) => (
                        <span 
                          key={tag}
                          onClick={() => { setSelectedTag(tag); setCurrentView('home'); }}
                          className="px-2.5 py-1 bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-600 hover:text-stone-950 rounded-sm font-mono text-[10px] tracking-wider uppercase cursor-pointer transition"
                        >
                          # {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Likes and sharing utility rows */}
                  <div className="bg-stone-50/50 px-6 py-4 border-t border-stone-200 flex items-center justify-between flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-4">
                      {/* Like button */}
                      <button
                        type="button"
                        onClick={() => handleLikePost(activePost.id)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-sm text-xs font-mono font-semibold tracking-wider uppercase transition shadow-2xs ${
                          likedPostIds.includes(activePost.id)
                            ? 'bg-stone-950 border-stone-950 text-white'
                            : 'bg-white border-stone-300 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <Heart size={13} className={likedPostIds.includes(activePost.id) ? 'fill-white text-white' : ''} />
                        <span>{likedPostIds.includes(activePost.id) ? 'Liked Article' : 'Like Publication'} ({activePost.likes.length})</span>
                      </button>

                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={() => handleSharePost(activePost.slug)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-sm text-xs font-mono font-semibold tracking-wider uppercase transition shadow-2xs"
                      >
                        <Share2 size={13} />
                        <span>Copy Share Link</span>
                      </button>
                    </div>

                    <div className="text-[11px] font-mono font-semibold text-stone-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>Article views tracker: <strong>{activePost.views} views</strong></span>
                    </div>
                  </div>

                </article>

                {/* Related Posts drawer */}
                {relatedPosts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-widest">Related Publications</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {relatedPosts.map((p) => (
                        <div 
                          key={p.id}
                          onClick={() => navigateToPost(p.slug)}
                          className="group cursor-pointer bg-white border border-stone-200 rounded-md p-4 hover:border-stone-400 transition flex flex-col gap-3"
                        >
                          <div className="aspect-video w-full rounded-sm bg-stone-50 overflow-hidden shrink-0">
                            <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover transition-transform group-hover:scale-102" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-wider">{p.category}</span>
                            <h4 className="text-xs font-serif font-bold text-stone-800 line-clamp-2 mt-1 leading-snug group-hover:text-stone-600 transition">{p.title}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comment Section Panel */}
                <CommentSection
                  comments={comments}
                  currentUser={currentUser}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onOpenAuth={() => setShowAuthModal(true)}
                  postAuthorId={activePost.authorId}
                />

              </div>
            )}
          </div>
        )}

        {/* VIEW 3: CMS CONSOLE CONTROL DASHBOARD */}
        {currentView === 'dashboard' && currentUser && (
          <div className="space-y-6">
            <DashboardView 
              user={currentUser} 
              token={token || ''} 
            />
          </div>
        )}

        {/* VIEW 4: INTERACTIVE SWAGGER OPENAPI EXPLORER */}
        {currentView === 'docs' && (
          <div className="space-y-6">
            <OpenApiExplorer 
              token={token} 
              onApplyToken={(t) => { setToken(t); localStorage.setItem('scribe_jwt_token', t); }}
            />
          </div>
        )}

        {/* VIEW 5: CONTACT INFORMATION & FREQUENT QUESTIONS */}
        {currentView === 'contact' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Scribe Communications Office</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect with Scribe! Submit editorial questions, apply as an author, or suggest corrections on general knowledge facts.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              
              {/* Form Column */}
              <div className="lg:col-span-3">
                <ContactForm />
              </div>

              {/* Informational sidebar Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Visual Cards Office info */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Office Details</h3>
                  
                  <div className="space-y-3.5 text-xs text-slate-600 font-medium">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                      <span>Scribe Publication HQ, 100 Infinite Loop, Cupertino, CA 95014</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Phone size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                      <span>+1 (555) 867-5309 (Support hours: 9AM - 5PM PST)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Mail size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                      <span>editorial-staff@scribe-portal.example.com</span>
                    </div>
                  </div>
                </div>

                {/* FAQ Block */}
                <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle size={14} className="text-amber-400" />
                    Frequent Questions
                  </h3>

                  <div className="space-y-3 divide-y divide-slate-800">
                    <div className="space-y-1.5 pt-3 first:pt-0">
                      <p className="text-xs font-bold text-slate-200">Can I write articles under a pseudonym?</p>
                      <p className="text-[10px] text-slate-400 leading-normal">Yes, Scribe supports customizable profile aliases inside the database for authors and commentators.</p>
                    </div>
                    <div className="space-y-1.5 pt-3">
                      <p className="text-xs font-bold text-slate-200">How long takes editorial review?</p>
                      <p className="text-[10px] text-slate-400 leading-normal">Our senior editors review article drafts continuously and publish approved publications within 12 hours.</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* --- PUBLIC SITE FOOTER --- */}
      <footer className="border-t border-slate-100 bg-white py-12 px-4 md:px-8 mt-16 shadow-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Brand details */}
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 cursor-pointer" onClick={navigateToHome}>
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                S
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">Scribe Portal</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Curating high-density insights in Music, tech News, sustainable Sports, and General Knowledge anomalies. Driven by role-based access mechanisms.
            </p>
            <p className="text-[10px] text-slate-400 font-mono">© 2026 Scribe Publications. All rights reserved.</p>
          </div>

          {/* Column 2: Quick Taxonomy footer links */}
          <div className="text-center md:text-left space-y-3.5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject Portals</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
              <button type="button" onClick={() => { navigateToHome(); handleCategorySelect('Songs'); }} className="hover:text-indigo-600 text-left">Songs</button>
              <button type="button" onClick={() => { navigateToHome(); handleCategorySelect('News'); }} className="hover:text-indigo-600 text-left">News</button>
              <button type="button" onClick={() => { navigateToHome(); handleCategorySelect('Sports'); }} className="hover:text-indigo-600 text-left">Sports</button>
              <button type="button" onClick={() => { navigateToHome(); handleCategorySelect('General Knowledge'); }} className="hover:text-indigo-600 text-left">General Knowledge</button>
            </div>
          </div>

          {/* Column 3: Quick newsletter widget footer */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center md:text-left">Subscription Desk</h4>
            <NewsletterBox />
          </div>

        </div>
      </footer>

      {/* --- INTEGRATED AUTH MODAL PORTAL --- */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

    </div>
  );
}

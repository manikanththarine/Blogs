/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart2, FileText, Users, Activity, MessageCircle, Mail, Plus, Edit, Trash2, 
  Settings, Lock, Save, Sparkles, Filter, ChevronRight, X, Calendar, Eye, Heart 
} from 'lucide-react';
import { User, UserRole, BlogPost, BlogComment, ActivityLog, ContactMessage, NewsletterSubscriber, PostStatus } from '../types';
import DashboardAnalytics from './DashboardAnalytics';
import RichTextEditor from './RichTextEditor';

interface DashboardViewProps {
  user: User;
  token: string;
}

type TabType = 'analytics' | 'posts' | 'users' | 'logs' | 'contacts' | 'subscribers';

export default function DashboardView({ user, token }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  
  // Loaders
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing / Creation States for Posts
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null); // null means "Create" mode
  const [postTitle, setPostTitle] = useState('');
  const [postSlug, setPostSlug] = useState('');
  const [postCategory, setPostCategory] = useState<'Songs' | 'News' | 'Sports' | 'General Knowledge'>('General Knowledge');
  const [postTags, setPostTags] = useState('');
  const [postFeaturedImage, setPostFeaturedImage] = useState('');
  const [postRichContent, setPostRichContent] = useState('');
  const [postStatus, setPostStatus] = useState<PostStatus>('Draft');
  const [postFeaturedOption, setPostFeaturedOption] = useState(false);
  const [postSubmitLoading, setPostSubmitLoading] = useState(false);

  // Fetch utilities
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! Status: ${res.status}`);
    }
    return data;
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Stats can be fetched by Admin, Editor, Author
      const statsData = await fetchWithAuth('/api/admin/stats');
      setStats(statsData.stats);

      // 2. Posts: Fetch full posts including drafts
      const postsData = await fetchWithAuth('/api/posts?includeDrafts=true');
      setPosts(postsData.posts);

      // 3. Admin-only tabs
      if (user.role === 'Admin') {
        const [usersData, logsData, contactsData, subsData] = await Promise.all([
          fetchWithAuth('/api/admin/users'),
          fetchWithAuth('/api/admin/logs'),
          fetchWithAuth('/api/admin/contacts'),
          fetchWithAuth('/api/admin/subscribers'),
        ]);
        setUsersList(usersData.users);
        setActivityLogs(logsData.logs);
        setContacts(contactsData.contacts);
        setSubscribers(subsData.subscribers);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to populate CMS control panel data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token, activeTab]);

  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setPostTitle('');
    setPostSlug('');
    setPostCategory('General Knowledge');
    setPostTags('');
    setPostFeaturedImage('');
    setPostRichContent('');
    setPostStatus('Draft');
    setPostFeaturedOption(false);
    setShowPostEditor(true);
  };

  const handleOpenEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostSlug(post.slug);
    setPostCategory(post.category);
    setPostTags(post.tags.join(', '));
    setPostFeaturedImage(post.featuredImage);
    setPostRichContent(post.richTextContent);
    setPostStatus(post.status);
    setPostFeaturedOption(post.featuredPostOption);
    setShowPostEditor(true);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postSubmitLoading) return;
    setPostSubmitLoading(true);

    const tagsArr = postTags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    const payload = {
      title: postTitle,
      slug: postSlug,
      category: postCategory,
      tags: tagsArr,
      featuredImage: postFeaturedImage,
      richTextContent: postRichContent,
      status: postStatus,
      featuredPostOption: postFeaturedOption,
    };

    try {
      if (editingPost) {
        await fetchWithAuth(`/api/posts/${editingPost.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth('/api/posts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowPostEditor(false);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit blog post.');
    } finally {
      setPostSubmitLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this blog post?')) return;
    try {
      await fetchWithAuth(`/api/posts/${id}`, { method: 'DELETE' });
      loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user.id) {
      alert('You cannot delete your own administrative session!');
      return;
    }
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetchWithAuth(`/api/admin/users/${id}`, { method: 'DELETE' });
      loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
      case 'Published': return 'bg-stone-100 text-stone-800 border-stone-300';
      case 'Draft': return 'bg-stone-50 text-stone-600 border-stone-200';
      case 'Archived': return 'bg-stone-100 text-stone-500 border-stone-200';
      default: return 'bg-stone-50 text-stone-400 border-stone-200';
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin': return 'bg-stone-900 text-white border-stone-950 font-mono text-[9px] uppercase rounded-sm';
      case 'Editor': return 'bg-stone-100 text-stone-800 border-stone-300 font-mono text-[9px] uppercase rounded-sm';
      case 'Author': return 'bg-stone-50 text-stone-700 border-stone-200 font-mono text-[9px] uppercase rounded-sm';
      case 'Viewer': return 'bg-stone-50 text-stone-500 border-stone-200 font-mono text-[9px] uppercase rounded-sm';
      default: return 'bg-stone-50 text-stone-400 border-stone-200 font-mono text-[9px] uppercase rounded-sm';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-stone-900 bg-stone-100 border border-stone-300';
    if (action.includes('UPDATE')) return 'text-stone-800 bg-stone-50 border border-stone-200';
    if (action.includes('DELETE')) return 'text-stone-950 bg-stone-100 border border-stone-300';
    return 'text-stone-700 bg-stone-100 border border-stone-200';
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border border-stone-200 rounded-sm">
        <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-wider text-stone-500">Loading Scribe CMS dashboard...</p>
      </div>
    );
  }

  const navItems = [
    { id: 'analytics', label: 'Analytics Panel', icon: BarChart2, roles: ['Admin', 'Editor', 'Author'] },
    { id: 'posts', label: 'Manage Posts', icon: FileText, roles: ['Admin', 'Editor', 'Author'] },
    { id: 'users', label: 'Manage Users', icon: Users, roles: ['Admin'] },
    { id: 'logs', label: 'Activity Logs', icon: Activity, roles: ['Admin'] },
    { id: 'contacts', label: 'Feedback Inquiries', icon: MessageCircle, roles: ['Admin'] },
    { id: 'subscribers', label: 'Newsletter Subs', icon: Mail, roles: ['Admin'] },
  ];

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-md overflow-hidden shadow-none flex flex-col lg:flex-row min-h-[650px]" id="dashboard-full-container">
      
      {/* Mobile Sidebar Trigger header */}
      <div className="lg:hidden bg-stone-950 px-5 py-3.5 flex items-center justify-between text-white border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Settings size={15} className="text-stone-300" />
          <span className="text-xs font-bold font-mono tracking-widest uppercase text-white">Scribe CMS Panel</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 text-stone-300 hover:text-white transition cursor-pointer"
          title="Toggle Navigation"
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Sidebar navigation */}
      <aside className={`
        ${sidebarOpen ? 'block' : 'hidden'} lg:block 
        w-full lg:w-64 bg-stone-950 text-stone-200 border-r border-stone-800 p-5 shrink-0 flex flex-col justify-between space-y-6
      `}>
        <div className="space-y-6">
          {/* Brand block on Desktop */}
          <div className="hidden lg:flex items-center gap-2 px-1">
            <Settings size={16} className="text-stone-300 animate-spin-slow" />
            <span className="text-[11px] font-bold font-mono tracking-widest text-white uppercase">Scribe Console</span>
          </div>

          {/* User brief profile */}
          <div className="bg-stone-900 border border-stone-850 rounded-sm p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-stone-100 text-stone-900 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-stone-800">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-stone-400 font-mono flex items-center gap-1.5 leading-none mt-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                {user.role}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems
              .filter((item) => item.roles.includes(user.role))
              .map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                      active 
                        ? 'bg-white text-stone-950' 
                        : 'text-stone-400 hover:bg-stone-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={13} />
                      {item.label}
                    </span>
                    <ChevronRight size={11} className={active ? 'text-stone-950' : 'text-stone-600'} />
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Footer info lock indicator */}
        <div className="bg-stone-900 border border-stone-850/60 p-3 rounded-sm text-[9px] font-mono text-stone-500 uppercase tracking-wider flex items-start gap-1.5 leading-normal">
          <Lock size={12} className="text-stone-400 shrink-0 mt-0.5" />
          <span>Enforces strict roles & audit protocols.</span>
        </div>
      </aside>

      {/* Main CMS canvas workspace */}
      <main className="flex-1 p-6 md:p-8 bg-white overflow-y-auto max-h-[85vh] lg:max-h-none">
        
        {/* Error notice */}
        {error && (
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm text-xs font-mono text-stone-700 font-semibold mb-6">
            Error: {error}
          </div>
        )}

        {/* --- TAB CONTENT AREA --- */}

        {/* 1. Analytics tab */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-serif font-bold text-stone-950">Editorial Statistics & Analytics</h2>
              <p className="text-xs text-stone-500 font-light mt-0.5">Review aggregated views, posts, users, and performance metrics.</p>
            </div>
            <DashboardAnalytics stats={stats} />
          </div>
        )}

        {/* 2. Posts management tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-950">Scribe Publications Manager</h2>
                <p className="text-xs text-stone-500 font-light mt-0.5">Create new publications, edit drafts, and configure SEO layouts.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreatePost}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-950 hover:bg-stone-800 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-sm transition cursor-pointer self-start sm:self-auto"
              >
                <Plus size={13} />
                <span>Create New Post</span>
              </button>
            </div>

            {/* List Table */}
            <div className="border border-stone-200 rounded-sm overflow-hidden bg-white shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider bg-stone-50">
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4 text-center">Stats</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {posts.length > 0 ? (
                      posts.map((post) => {
                        const canModify = user.role === 'Admin' || post.authorId === user.id;
                        return (
                          <tr key={post.id} className="hover:bg-stone-50/50 transition">
                            <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                              <p className="text-xs font-bold text-stone-850 line-clamp-1">{post.title}</p>
                              <p className="text-[10px] font-mono text-stone-400 mt-1.5 flex items-center gap-2">
                                <span className="bg-stone-100 border border-stone-200 px-1 py-0.2 rounded-sm font-semibold text-stone-600">/{post.slug}</span>
                                {post.featuredPostOption && <span className="text-stone-900 font-bold">★ Featured Option</span>}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-stone-600 font-mono uppercase tracking-wider">{post.category}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 border text-[9px] font-mono font-bold rounded-sm uppercase tracking-wider ${getStatusBadge(post.status)}`}>
                                {post.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="text-[10px] font-bold text-stone-850">{post.authorName}</p>
                              <p className="text-[9px] text-stone-400 font-mono uppercase mt-0.5">{post.authorRole}</p>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-2 text-[10px] font-mono text-stone-400">
                                <span className="flex items-center gap-0.5" title="Views">
                                  <Eye size={11} />
                                  {post.views}
                                </span>
                                <span className="flex items-center gap-0.5" title="Likes">
                                  <Heart size={11} className={post.likes.length > 0 ? 'fill-stone-950 text-stone-950' : ''} />
                                  {post.likes.length}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPost(post)}
                                  disabled={!canModify}
                                  className="p-1.5 border border-stone-200 rounded-sm bg-white hover:bg-stone-50 hover:border-stone-400 transition text-stone-600 disabled:opacity-40 cursor-pointer"
                                  title={canModify ? "Edit post" : "Unauthorized to edit other's posts"}
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post.id)}
                                  disabled={user.role !== 'Admin' && (!canModify || user.role === 'Author')}
                                  className="p-1.5 border border-stone-200 rounded-sm bg-stone-100 hover:bg-stone-200 text-stone-800 disabled:opacity-40 transition cursor-pointer"
                                  title="Delete post"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-xs text-stone-400 italic font-light">No publications created yet. Create your first article post above!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. Manage Users tab (Admin Only) */}
        {activeTab === 'users' && user.role === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-serif font-bold text-stone-950">Database User Directories</h2>
              <p className="text-xs text-stone-500 font-light mt-0.5">Reconfigure user roles and manage access controls securely.</p>
            </div>

            <div className="border border-stone-200 rounded-sm overflow-hidden bg-white shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider bg-stone-50">
                      <th className="py-3 px-4">User Info</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role Permission</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/50 transition">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-sm bg-stone-100 border border-stone-200 flex items-center justify-center font-mono font-bold text-xs text-stone-700">
                            {u.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-850">{u.name}</p>
                            <p className="text-[9px] font-mono text-stone-400">{u.id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-stone-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <select
                            disabled={u.id === user.id}
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value as UserRole)}
                            className="text-xs font-mono font-bold px-2.5 py-1 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 text-stone-700 bg-white"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Editor">Editor</option>
                            <option value="Author">Author</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-stone-400">
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user.id}
                            className="p-1.5 border border-stone-200 rounded-sm bg-stone-100 hover:bg-stone-200 text-stone-800 disabled:opacity-30 transition cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. Activity Logs tab (Admin Only) */}
        {activeTab === 'logs' && user.role === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-serif font-bold text-stone-950">System Activity Audits</h2>
              <p className="text-xs text-stone-500 font-light mt-0.5">Inspect automated audit logs tracking system changes and authentication logs.</p>
            </div>

            <div className="border border-stone-200 rounded-sm overflow-hidden bg-white shadow-none max-h-[500px] overflow-y-auto">
              <div className="divide-y divide-stone-100">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-stone-50/50 transition">
                    <div className="flex items-start gap-3">
                      <span className={`px-2.5 py-0.5 text-[9px] font-mono font-bold rounded-sm border uppercase ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <div>
                        <p className="text-stone-700 leading-normal font-light">
                          By <strong className="text-stone-900 font-semibold">{log.userName}</strong> ({log.userRole})
                        </p>
                        {log.targetId && (
                          <p className="text-[10px] text-stone-400 font-mono mt-1">
                            Target Resource: {log.targetType} ({log.targetId})
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 whitespace-nowrap sm:self-center">
                      {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} — {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Feedback Inquiries (Admin Only) */}
        {activeTab === 'contacts' && user.role === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-serif font-bold text-stone-950">Contact & Feedback Inbox</h2>
              <p className="text-xs text-stone-500 font-light mt-0.5">Review public inquiries submitted through the contact forms.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.length > 0 ? (
                contacts.map((c) => (
                  <div key={c.id} className="p-4 border border-stone-200 rounded-sm bg-white space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div>
                        <h4 className="text-xs font-bold text-stone-850">{c.name}</h4>
                        <p className="text-[10px] font-mono text-stone-450">{c.email}</p>
                      </div>
                      <span className="text-[9px] font-mono text-stone-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-stone-800">Sub: {c.subject}</p>
                      <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-2.5 rounded-sm border border-stone-100 font-light italic">
                        "{c.message}"
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 md:col-span-2 text-xs text-stone-400 italic border border-stone-200 rounded-sm font-light bg-stone-50">
                  Inbox empty. No feedback messages submitted yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Newsletter Subscribers (Admin Only) */}
        {activeTab === 'subscribers' && user.role === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-base font-serif font-bold text-stone-950">Newsletter Mailing Records</h2>
              <p className="text-xs text-stone-500 font-light mt-0.5">Database list of subscribed email addresses for campaign targets.</p>
            </div>

            <div className="border border-stone-200 rounded-sm overflow-hidden bg-white shadow-none max-w-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider bg-stone-50">
                      <th className="py-3 px-4">Email Subscriber</th>
                      <th className="py-3 px-4">Subscription Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {subscribers.length > 0 ? (
                      subscribers.map((s) => (
                        <tr key={s.id} className="hover:bg-stone-50/50 transition">
                          <td className="py-3 px-4 text-xs font-semibold font-mono text-stone-700">{s.email}</td>
                          <td className="py-3 px-4 text-xs font-mono text-stone-400">
                            {new Date(s.subscribedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-center py-6 text-xs text-stone-400 italic font-light">No subscribers yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- DYNAMIC POST CREATION/EDITING DRAWER MODAL --- */}
        {showPostEditor && (
          <div className="fixed inset-0 z-50 flex justify-end" id="cms-publication-drawer">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-fadeIn" 
              onClick={() => setShowPostEditor(false)} 
            />

            {/* Panel */}
            <div className="relative bg-white border-l border-stone-200 w-full max-w-3xl h-full shadow-2xl flex flex-col justify-between animate-slideLeft z-10">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif font-black text-stone-950 flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles size={14} className="text-stone-800" />
                    {editingPost ? 'Edit Scribe Publication' : 'Create Scribe Publication'}
                  </h3>
                  <p className="text-[10px] font-mono text-stone-400 mt-0.5">DEFINE METADATA, WRITE TEXT CONTENT, AND PUBLISH DIRECTLY.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPostEditor(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-800 rounded bg-white border border-stone-200 hover:border-stone-400 transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Drawer Body Form container */}
              <form onSubmit={handlePostSubmit} className="flex-1 p-6 overflow-y-auto space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Publication Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10 Tips for Better Web Design..."
                      value={postTitle}
                      onChange={(e) => {
                        setPostTitle(e.target.value);
                        // Auto-slugify on title edit if in creation mode
                        if (!editingPost) {
                          setPostSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                        }
                      }}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 text-stone-900 bg-stone-50/50"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">SEO Friendly URL Slug</label>
                    <input
                      type="text"
                      required
                      placeholder="ten-tips-for-better-web-design"
                      value={postSlug}
                      onChange={(e) => setPostSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 text-stone-900 bg-stone-50/50 font-mono"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Publication Category</label>
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 text-stone-900 bg-white font-mono uppercase font-bold tracking-wider"
                    >
                      <option value="Songs">Songs</option>
                      <option value="News">News</option>
                      <option value="Sports">Sports</option>
                      <option value="General Knowledge">General Knowledge</option>
                    </select>
                  </div>

                  {/* Featured Image URL */}
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Featured Image URL Link</label>
                      <button
                        type="button"
                        onClick={() => {
                          const id = Math.floor(Math.random() * 1000);
                          setPostFeaturedImage(`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`);
                        }}
                        className="text-[9px] font-mono font-bold text-stone-800 hover:text-stone-950 border-b border-stone-950 pb-0.5 cursor-pointer"
                      >
                        Auto-Curate high-res Unsplash photo
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={postFeaturedImage}
                      onChange={(e) => setPostFeaturedImage(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 text-stone-900 bg-stone-50/50"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Tags (separated by commas)</label>
                    <input
                      type="text"
                      placeholder="Music, Acoustics, Trends"
                      value={postTags}
                      onChange={(e) => setPostTags(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 text-stone-900 bg-stone-50/50"
                    />
                  </div>

                  {/* Publication Status & Option */}
                  <div className="space-y-1 flex flex-col justify-end">
                    <div className="flex gap-6 items-center bg-stone-50 border border-stone-200 p-2.5 rounded-sm">
                      {/* Status */}
                      <div className="flex-1 space-y-0.5">
                        <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest block">Status</label>
                        <select
                          value={postStatus}
                          onChange={(e) => setPostStatus(e.target.value as any)}
                          className="text-[10px] font-mono font-bold uppercase tracking-wider border border-stone-200 rounded-sm bg-white text-stone-700 px-1.5 py-0.5"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>

                      {/* Featured toggle */}
                      <label className="flex items-center gap-2 cursor-pointer self-center mt-2 select-none">
                        <input
                          type="checkbox"
                          checked={postFeaturedOption}
                          onChange={(e) => setPostFeaturedOption(e.target.checked)}
                          className="rounded-sm border-stone-300 text-stone-950 focus:ring-stone-950 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[9px] font-mono font-bold text-stone-600 uppercase tracking-widest">Mark Featured</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Rich Content Editor */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Publication Content (Rich Text / HTML Editor)</label>
                  <RichTextEditor
                    value={postRichContent}
                    onChange={setPostRichContent}
                    placeholder="Compose your rich text article contents here. HTML formatting support is completely integrated..."
                    categoryHint={postCategory}
                  />
                </div>
              </form>

              {/* Drawer Footer Actions */}
              <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowPostEditor(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-850 font-mono text-[10px] uppercase border border-stone-200 rounded-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePostSubmit}
                  disabled={postSubmitLoading || !postTitle || !postRichContent}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-stone-950 hover:bg-stone-800 disabled:bg-stone-300 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-sm transition cursor-pointer"
                >
                  {postSubmitLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>Save Publication</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

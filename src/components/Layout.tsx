import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, Plus, LogOut, X } from 'lucide-react';
import { User } from '../types';
import AuthModal from './AuthModal';

export interface LayoutContext {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuthOpen: (open: boolean) => void;
}

const CATEGORY_NAV: { label: string; category: string }[] = [
  { label: 'All feeds', category: 'all' },
  { label: 'Daily News', category: 'news' },
  { label: 'Song Lyrics', category: 'lyrics' },
  { label: 'Sports Center', category: 'sports' },
  { label: 'Technology', category: 'tech' },
];

export default function Layout() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const activeCategory = params.category || 'all';
  const searchQuery = searchParams.get('q') || '';

  const navTo = (category: string) => (category === 'all' ? '/' : `/category/${category}`) + location.search;

  const handleSearchChange = (value: string) => {
    const qs = value ? `?q=${encodeURIComponent(value)}` : '';
    const base = activeCategory === 'all' ? '/' : `/category/${activeCategory}`;
    navigate(`${base}${qs}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-600/30 selection:text-white transition-colors duration-300">
      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shrink-0 shadow-lg transition-all" id="sticky-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo branding */}
            <Link
              to={`/${location.search}`}
              className="text-2xl font-black tracking-tighter text-blue-500 cursor-pointer hover:opacity-90 flex items-center gap-2"
              id="app-branding-logo"
            >
              <span>NEXUS</span>
              <span className="text-slate-100 bg-slate-800 px-2 py-0.5 rounded-lg text-lg border border-slate-700">PORTAL</span>
            </Link>

            {/* Nav category selectors */}
            <nav className="hidden md:flex gap-6 text-xs uppercase tracking-widest font-bold">
              {CATEGORY_NAV.map(({ label, category }) => (
                <NavLink
                  key={category}
                  to={navTo(category)}
                  end={category === 'all'}
                  className={() =>
                    `transition-colors cursor-pointer ${
                      activeCategory === category && location.pathname !== '/manage'
                        ? 'text-blue-500'
                        : 'text-slate-400 hover:text-slate-100'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              {currentUser && (
                <Link
                  to="/manage"
                  className={`transition-colors cursor-pointer ${location.pathname === '/manage' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-100'}`}
                  id="nav-manage-posts"
                >
                  Manage Posts
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search headlines, tags..."
                className="bg-slate-800/80 border border-slate-700/80 rounded-full py-1.5 pl-8 pr-4 text-xs w-36 sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-100 transition-all placeholder:text-slate-500"
                id="header-search-input"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-slate-100"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Authentication Action Trigger */}
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-300">
                  Hi, <strong className="text-emerald-400">{currentUser.username}</strong>
                </span>
                <Link
                  to="/manage"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs p-2 sm:px-4 sm:py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Manage Posts"
                  id="open-create-post-btn"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Write Post</span>
                </Link>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Logout Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-5 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 cursor-pointer"
                id="open-auth-btn"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <Outlet context={{ currentUser, setCurrentUser, setIsAuthOpen } satisfies LayoutContext} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}

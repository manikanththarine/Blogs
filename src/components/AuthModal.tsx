/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Shield, Lock, Mail, User as UserIcon, Sparkles, AlertCircle } from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (token: string, user: User) => void;
}

export default function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify inputs.');
      }

      onAuthSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Login Utility for Reviewers / Admins to test different roles instantly
  const handleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    setError('');

    const credentials: Record<UserRole, { u: string; p: string }> = {
      Admin: { u: 'admin@example.com', p: 'admin123' },
      Editor: { u: 'editor@example.com', p: 'editor123' },
      Author: { u: 'author@example.com', p: 'author123' },
      Viewer: { u: 'viewer@example.com', p: 'viewer123' },
    };

    const cred = credentials[role];

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cred.u, password: cred.p }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      onAuthSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="authentication-portal-modal">
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Main card box container */}
      <div className="relative bg-white border border-stone-200 rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-widest">
            <Lock size={12} className="text-stone-700" />
            <span>Scribe Security Portal</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-800 rounded transition cursor-pointer"
            title="Close panel"
          >
            <X size={15} />
          </button>
        </div>

        {/* Auth Body */}
        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          <div className="text-center space-y-1.5">
            <h3 className="text-lg font-serif font-bold text-stone-950">
              {isLogin ? 'Sign in to Scribe' : 'Create an Account'}
            </h3>
            <p className="text-[11px] text-stone-500 font-light">
              {isLogin ? 'Manage resources and write publications' : 'Become a reader and join our discussion boards'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm text-xs text-stone-700 font-mono flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <UserIcon size={13} className="absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 bg-stone-50/50 text-stone-900 font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 bg-stone-50/50 text-stone-900 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset links are simulated. You can login using our Quick Login buttons below.')}
                    className="text-[9px] font-mono font-bold text-stone-600 hover:text-stone-950 transition uppercase tracking-wider"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={13} className="absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-3 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 bg-stone-50/50 text-stone-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-stone-950 hover:bg-stone-800 disabled:bg-stone-300 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>{isLogin ? 'Sign In' : 'Create Reader Account'}</span>
            </button>
          </form>

          {/* Switch toggle */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[11px] text-stone-500 hover:text-stone-950 font-mono font-semibold uppercase tracking-wider underline underline-offset-4 cursor-pointer"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>

          {/* Quick Login - RBAC Testing Framework */}
          <div className="border-t border-stone-200 pt-5 space-y-3">
            <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">
              <Sparkles size={11} className="text-amber-500 fill-amber-500" />
              <span>Developer Quick-Login</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Admin')}
                className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-sm text-left flex flex-col gap-0.5 transition cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wider">Admin Role</span>
                <span className="text-[8px] text-stone-400 font-mono uppercase">Full access control</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Editor')}
                className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-sm text-left flex flex-col gap-0.5 transition cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wider">Editor Role</span>
                <span className="text-[8px] text-stone-400 font-mono uppercase">Modify & Publish</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Author')}
                className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-sm text-left flex flex-col gap-0.5 transition cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wider">Author Role</span>
                <span className="text-[8px] text-stone-400 font-mono uppercase">Draft own posts</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Viewer')}
                className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-sm text-left flex flex-col gap-0.5 transition cursor-pointer"
              >
                <span className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wider">Viewer Role</span>
                <span className="text-[8px] text-stone-400 font-mono uppercase">Read & Comment</span>
              </button>
            </div>
            <p className="text-[9px] text-stone-400 font-mono uppercase tracking-wide text-center leading-normal">
              Assumption of credential badges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

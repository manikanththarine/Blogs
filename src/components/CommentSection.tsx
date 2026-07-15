/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageSquare, Trash2, Send, Lock } from 'lucide-react';
import { BlogComment, User } from '../types';

interface CommentSectionProps {
  comments: BlogComment[];
  currentUser: User | null;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onOpenAuth: () => void;
  postAuthorId: string;
}

export default function CommentSection({
  comments,
  currentUser,
  onAddComment,
  onDeleteComment,
  onOpenAuth,
  postAuthorId,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await onDeleteComment(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const canDeleteComment = (comment: BlogComment) => {
    if (!currentUser) return false;
    // Authorized to delete if:
    // 1. Current user is Admin
    // 2. Current user wrote the comment
    // 3. Current user wrote the original post
    return (
      currentUser.role === 'Admin' ||
      currentUser.id === comment.userId ||
      currentUser.id === postAuthorId
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6" id="post-comments-container">
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <MessageSquare size={14} className="text-stone-700" />
        <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-widest">Discussion Forum</h3>
        <span className="px-2.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-700 rounded-sm text-[10px] font-mono font-bold">
          {comments.length}
        </span>
      </div>

      {/* Write Comment Box */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-mono font-bold text-stone-700">
              {currentUser.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="flex-1">
              <textarea
                rows={3}
                required
                placeholder="Share your perspective and add to the article discussion..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full text-stone-900 text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 placeholder:text-stone-400 bg-white leading-relaxed resize-none font-light"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-950 hover:bg-stone-800 disabled:bg-stone-200 text-white font-mono font-bold uppercase tracking-wider text-[10px] rounded-sm transition cursor-pointer"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={11} />
              )}
              <span>Post Comment</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-stone-50 border border-stone-200 rounded-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs font-mono font-bold text-stone-800 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1.5">
              <Lock size={12} className="text-stone-500" />
              Join the Conversation
            </p>
            <p className="text-[11px] text-stone-500 font-light">Log in or create an account to share your constructive replies on this publication.</p>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-4 py-2 bg-stone-950 hover:bg-stone-800 text-white font-mono font-bold uppercase tracking-wider text-[10px] rounded-sm transition whitespace-nowrap cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className="p-4 border border-stone-200 rounded-sm bg-white flex gap-3 group/comment transition hover:border-stone-400"
            >
              {/* User Avatar Initials */}
              <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-xs font-mono font-semibold text-stone-600 self-start">
                {comment.userName.split(' ').map((n) => n[0]).join('')}
              </div>

              {/* Comment Content block */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-stone-850">{comment.userName}</span>
                    <span className="px-1.5 py-0.2 bg-stone-100 text-stone-600 border border-stone-200 rounded-sm text-[8px] font-mono tracking-wider uppercase font-semibold">
                      {comment.userRole}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-stone-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                
                <p className="text-xs text-stone-700 leading-relaxed font-light whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* Actions row */}
                {canDeleteComment(comment) && (
                  <div className="flex justify-end opacity-0 group-hover/comment:opacity-100 transition-opacity pt-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-700 hover:text-stone-950 transition flex items-center gap-1 py-1 px-1.5 bg-stone-100 border border-stone-200 rounded-sm hover:bg-stone-200"
                    >
                      {deletingId === comment.id ? (
                        <div className="w-3 h-3 border border-stone-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={10} />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-xs text-stone-400 italic font-light">
            No contributions made yet. Be the first to start the conversation!
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Send, CheckCircle, Mail, Sparkles, MessageCircle, Info } from 'lucide-react';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit contact request');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-md p-6 md:p-8 max-w-xl mx-auto" id="contact-form-widget">
      {success ? (
        <div className="text-center py-10 space-y-4 animate-fadeIn">
          <div className="w-12 h-12 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center mx-auto border border-stone-200">
            <CheckCircle size={20} />
          </div>
          <h3 className="text-base font-serif font-bold text-stone-950">Inquiry Sent Successfully</h3>
          <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed font-light">
            Thank you for reaching out to Scribe Portal! Our editorial and support staff has received your message and will respond via email within 24 hours.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-850 font-mono text-[10px] uppercase tracking-wider border border-stone-200 rounded-sm transition mt-2 cursor-pointer"
          >
            Send Another Inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-center md:text-left mb-6">
            <h3 className="text-sm font-mono font-bold text-stone-900 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5">
              <MessageCircle size={14} className="text-stone-800" />
              Get In Touch With Us
            </h3>
            <p className="text-[11px] text-stone-500 font-light">Have an inquiry, feedback, or guest application proposal? Fill out the form below.</p>
          </div>

          {error && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm flex items-center gap-2 text-xs text-stone-700 font-mono font-medium">
              <Info size={13} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 bg-stone-50/50 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                required
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 bg-stone-50/50 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Inquiry Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Editorial application or advertisement options..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 bg-stone-50/50 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-widest">Detailed Message</label>
            <textarea
              required
              rows={4}
              placeholder="Please provide explicit details regarding your inquiry..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-stone-950 bg-stone-50/50 leading-relaxed font-light resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-950 hover:bg-stone-800 disabled:bg-stone-300 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-sm transition mt-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={11} />
            )}
            <span>Send Message Inquiry</span>
          </button>
        </form>
      )}
    </div>
  );
}

export function NewsletterBox() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-950 border border-stone-800 rounded-md p-6 text-stone-200 space-y-4" id="newsletter-form-box">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-white/10 rounded-sm text-stone-100 border border-white/5">
          <Mail size={14} />
        </div>
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
            Scribe digests
            <Sparkles size={10} className="text-amber-400" />
          </h4>
          <p className="text-[10px] text-stone-400 leading-normal font-light mt-1">Weekly summaries of top news, songs, general knowledge, and sports insights straight to your inbox.</p>
        </div>
      </div>

      {subscribed ? (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={12} />
          <span>Wonderful! You are subscribed.</span>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="your email address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-stone-900 border border-stone-800 rounded-sm px-3 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-stone-500 font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 disabled:bg-stone-800 text-stone-950 font-mono font-bold uppercase tracking-widest text-[10px] rounded-sm transition whitespace-nowrap cursor-pointer"
          >
            {loading ? 'Subbing...' : 'Join'}
          </button>
        </form>
      )}
    </div>
  );
}

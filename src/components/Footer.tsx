import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function Footer() {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactSuccess(null);
    setContactError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage
        })
      });

      const data = await res.json();
      if (res.ok) {
        setContactSuccess(data.message);
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      } else {
        setContactError(data.error || 'Failed to submit form.');
      }
    } catch (err) {
      setContactError('A network error occurred. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <>
      {/* Footer Contact & Platform Details Grid */}
      <footer className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-800" id="platform-footer">

        {/* Contact form - satisfies request */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 flex flex-col justify-center">
          <h4 className="text-sm font-extrabold text-white mb-2 tracking-tight uppercase">Get in Touch with our Editorial Staff</h4>
          <p className="text-xs text-slate-400 mb-4 leading-normal">Submit story suggestions, news press packages, lyric updates, or technology feedback.</p>

          {contactSuccess && (
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-semibold mb-3 border border-emerald-500/30 animate-pulse-slow">
              {contactSuccess}
            </div>
          )}

          {contactError && (
            <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold mb-3 border border-red-500/30">
              {contactError}
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full Name"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
              />
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Your Email"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
              />
              <input
                type="text"
                required
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="Topic / Subject"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 animate-pulse-slow"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="How can we improve your dynamic search experience today? Write your message..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={contactLoading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 hover:scale-102 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{contactLoading ? 'Sending...' : 'Submit'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Backend Status indicator */}
        {/* <div className="bg-blue-600/10 rounded-2xl border border-blue-500/20 p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Active Server Metrics</p>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                <span className="text-sm text-slate-100 font-mono font-bold">MongoDB Database Connected</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Dynamic client-author mapping active</p>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-500/10 text-[10px] text-slate-500 flex items-center justify-between font-mono">
            <span>Node.js v20.5 • SSR Active</span>
            <span className="text-blue-400/80">Google AdSense Enabled</span>
          </div>
        </div> */}
      </footer>

      {/* Global Copyright disclaimer */}
      <div className="text-center text-xs text-slate-600 font-mono pt-4 pb-2 border-t border-slate-900/40">
        © {new Date().getFullYear()} NexusBlog Portal Inc. Autogenerated dynamically under Professional Polish theme guidelines. All Rights Reserved.
      </div>
    </>
  );
}

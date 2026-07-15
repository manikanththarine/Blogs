/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Bold, Italic, Heading2, Heading3, Quote, List, Image as ImageIcon, Sparkles, Eye, Code } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  categoryHint?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing your masterpieces here...',
  categoryHint = 'General Knowledge',
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [showImageHelper, setShowImageHelper] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Formatting helper that inserts HTML tags around selected text
  const insertHTMLTag = (tag: string, closingTag = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    if (tag === 'ul') {
      replacement = `<ul>\n  <li>${selected || 'List item'}</li>\n</ul>`;
    } else if (tag === 'img') {
      replacement = `<img src="${closingTag}" alt="Curated blog image" class="rounded-sm border border-stone-200 my-6 w-full" />`;
    } else {
      replacement = `<${tag}>${selected || 'text'}</${closingTag || tag}>`;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + (selected || 'text').length);
    }, 50);
  };

  // Simulated drag-and-drop or select file file uploader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Post to mock/simulated server static path
      fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, category: categoryHint })
      })
        .then((res) => res.json())
        .then((data) => {
          insertHTMLTag('img', data.url);
          setShowImageHelper(false);
          setUploadProgress(false);
        })
        .catch((err) => {
          console.error(err);
          // Fallback
          insertHTMLTag('img', base64);
          setShowImageHelper(false);
          setUploadProgress(false);
        });
    };
    reader.readAsDataURL(file);
  };

  const handleCuratedImageSelect = (themeKeyword: string) => {
    setUploadProgress(true);
    fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: themeKeyword })
    })
      .then((res) => res.json())
      .then((data) => {
        insertHTMLTag('img', data.url);
        setShowImageHelper(false);
        setUploadProgress(false);
      })
      .catch((err) => {
        console.error(err);
        setUploadProgress(false);
      });
  };

  const handleCustomImageUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customImageUrl) return;
    insertHTMLTag('img', customImageUrl);
    setCustomImageUrl('');
    setShowImageHelper(false);
  };

  return (
    <div className="border border-stone-200 rounded-sm overflow-hidden bg-white shadow-none focus-within:ring-1 focus-within:ring-stone-950 transition-all">
      {/* Tab Navigation & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 bg-stone-50 p-2 gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => insertHTMLTag('strong')}
            title="Bold"
            className="p-1.5 hover:bg-white hover:border hover:border-stone-200 rounded-sm text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertHTMLTag('em')}
            title="Italic"
            className="p-1.5 hover:bg-white hover:border hover:border-stone-200 rounded-sm text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            <Italic size={14} />
          </button>
          <div className="w-px h-4 bg-stone-200 mx-1" />
          <button
            type="button"
            onClick={() => insertHTMLTag('h2')}
            title="Heading 2"
            className="p-1.5 hover:bg-white hover:border hover:border-stone-200 rounded-sm text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertHTMLTag('h3')}
            title="Heading 3"
            className="p-1.5 hover:bg-white hover:border hover:border-stone-200 rounded-sm text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            <Heading3 size={14} />
          </button>
          <div className="w-px h-4 bg-stone-200 mx-1" />
          <button
            type="button"
            onClick={() => insertHTMLTag('blockquote')}
            title="Blockquote"
            className="p-1.5 hover:bg-white hover:border hover:border-stone-200 rounded-sm text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            <Quote size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertHTMLTag('ul')}
            title="Bullet List"
            className="p-1.5 hover:bg-white hover:border hover:border-stone-200 rounded-sm text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            <List size={14} />
          </button>
          <div className="w-px h-4 bg-stone-200 mx-1" />
          <button
            type="button"
            onClick={() => setShowImageHelper(!showImageHelper)}
            title="Add Image"
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-white hover:border hover:border-stone-200 rounded-sm text-stone-600 hover:text-stone-900 transition text-[9px] font-mono font-bold uppercase tracking-widest cursor-pointer"
          >
            <ImageIcon size={13} />
            <span>Add Media</span>
          </button>
        </div>

        {/* View Toggles */}
        <div className="flex bg-stone-100 p-0.5 rounded-sm self-end sm:self-auto border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-[9px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'write' ? 'bg-white text-stone-950 shadow-none border border-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Code size={11} />
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-[9px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'preview' ? 'bg-white text-stone-950 shadow-none border border-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Eye size={11} />
            Preview
          </button>
        </div>
      </div>

      {/* Interactive Image Helper Modal/Drawer */}
      {showImageHelper && (
        <div className="p-4 bg-stone-50 border-b border-stone-200 animate-fadeIn">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-stone-700" />
                Add Image / Media File
              </h4>
              <button
                type="button"
                onClick={() => setShowImageHelper(false)}
                className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>

            {uploadProgress ? (
              <div className="flex flex-col items-center justify-center p-6 bg-white border border-dashed border-stone-200 rounded-sm">
                <div className="w-6 h-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-[9px] font-mono uppercase tracking-wider text-stone-500">Processing media file...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drag / Upload Section */}
                <div className="bg-white p-3 border border-stone-200 rounded-sm flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-bold text-stone-800 mb-1 font-mono uppercase tracking-wide">Select Local Image</p>
                  <p className="text-[9px] text-stone-400 mb-2 font-mono uppercase">JPG, PNG or SVG. Max 5MB</p>
                  <label className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-850 font-mono font-bold text-[9px] uppercase tracking-wider border border-stone-200 rounded-sm cursor-pointer transition">
                    Browse File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Instant Curated Search Tag */}
                <div className="bg-white p-3 border border-stone-200 rounded-sm flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-855 mb-1 font-mono uppercase tracking-wide">Unsplash Curation</p>
                    <p className="text-[9px] text-stone-400 mb-2.5 font-mono uppercase">Auto-curate stunning themed photos.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Acoustic Music', 'Cyberpunk Tech', 'Modern Stadium', 'Solar System', 'Workspace', 'Retro Camera'].map((term) => (
                      <button
                        type="button"
                        key={term}
                        onClick={() => handleCuratedImageSelect(term)}
                        className="p-1 border border-stone-150 hover:border-stone-400 hover:bg-stone-50 text-left rounded-sm text-[9px] font-mono font-bold text-stone-600 transition truncate cursor-pointer"
                      >
                        # {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom URL Option */}
            <form onSubmit={handleCustomImageUrlSubmit} className="flex gap-2 bg-white p-1.5 border border-stone-200 rounded-sm">
              <input
                type="url"
                required
                placeholder="Or paste custom image URL (e.g. https://images.unsplash.com/...)"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-stone-200 rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-stone-950 bg-stone-50/50 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-stone-950 hover:bg-stone-800 text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm cursor-pointer transition"
              >
                Insert Link
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Editor Main Canvas */}
      {activeTab === 'write' ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[300px] p-4 text-stone-900 text-sm font-mono focus:outline-none leading-relaxed resize-y bg-stone-50/10 placeholder:text-stone-400"
            id="rich-text-editor-textarea"
          />
          <div className="absolute bottom-2 right-3 text-[9px] font-mono uppercase tracking-wider text-stone-400 bg-white/80 px-1.5 py-0.5 border border-stone-200 rounded-sm pointer-events-none">
            HTML Editor Mode
          </div>
        </div>
      ) : (
        <div className="p-6 min-h-[300px] bg-white overflow-y-auto max-h-[500px]">
          {value ? (
            <div 
              className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2 prose-p:text-stone-700 prose-p:leading-relaxed prose-p:mb-4 prose-blockquote:border-l-2 prose-blockquote:border-stone-950 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-stone-600 prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-li:mb-1 prose-img:my-6 prose-img:rounded-sm"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          ) : (
            <p className="text-stone-400 text-[10px] font-mono uppercase tracking-wider text-center py-12 font-light">Nothing to preview yet. Start composing in the "Write" tab!</p>
          )}
        </div>
      )}
    </div>
  );
}

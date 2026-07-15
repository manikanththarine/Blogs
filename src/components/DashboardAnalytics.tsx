/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart, TrendingUp, Users, FileText, Heart, Activity, Star } from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardAnalyticsProps {
  stats: DashboardStats;
}

export default function DashboardAnalytics({ stats }: DashboardAnalyticsProps) {
  // SVG drawing dimensions for views traffic trend line chart
  const padding = 40;
  const chartWidth = 500;
  const chartHeight = 200;

  const viewsData = stats.viewsHistory || [];
  const maxViews = Math.max(...viewsData.map((d) => d.views), 10);

  // Generate SVG coordinate paths for line chart
  const points = viewsData.map((d, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (viewsData.length - 1);
    const y = chartHeight - padding - (d.views * (chartHeight - padding * 2)) / maxViews;
    return { x, y, label: d.date, value: d.views };
  });

  const linePath = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  // Ring distribution calculation
  const totalPosts = stats.totalPosts || 1;
  const categories = Object.entries(stats.categoryBreakdown || {});
  const colors = {
    'Songs': 'bg-stone-900 border-stone-950',
    'News': 'bg-stone-700 border-stone-800',
    'Sports': 'bg-stone-500 border-stone-600',
    'General Knowledge': 'bg-stone-300 border-stone-400',
  };

  return (
    <div className="space-y-6">
      {/* KPI Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 border border-stone-200 rounded-sm flex items-center justify-between transition-all hover:bg-stone-50">
          <div className="space-y-1.5">
            <p className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">Total Views</p>
            <h4 className="text-2xl font-serif font-black text-stone-900 tracking-tight">{stats.totalViews.toLocaleString()}</h4>
            <span className="text-[9px] text-stone-500 font-mono uppercase tracking-wider flex items-center gap-0.5">
              <TrendingUp size={10} />
              +14.2% yesterday
            </span>
          </div>
          <div className="p-3 bg-stone-100 border border-stone-200 rounded-sm text-stone-800">
            <Activity size={18} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 border border-stone-200 rounded-sm flex items-center justify-between transition-all hover:bg-stone-50">
          <div className="space-y-1.5">
            <p className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">Total Posts</p>
            <h4 className="text-2xl font-serif font-black text-stone-900 tracking-tight">{stats.totalPosts}</h4>
            <span className="text-[9px] text-stone-400 font-mono uppercase tracking-wider">Combines published & drafts</span>
          </div>
          <div className="p-3 bg-stone-100 border border-stone-200 rounded-sm text-stone-800">
            <FileText size={18} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 border border-stone-200 rounded-sm flex items-center justify-between transition-all hover:bg-stone-50">
          <div className="space-y-1.5">
            <p className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">Active Users</p>
            <h4 className="text-2xl font-serif font-black text-stone-900 tracking-tight">{stats.totalUsers}</h4>
            <span className="text-[9px] text-stone-450 font-mono uppercase tracking-wider">4 permission roles</span>
          </div>
          <div className="p-3 bg-stone-100 border border-stone-200 rounded-sm text-stone-800">
            <Users size={18} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 border border-stone-200 rounded-sm flex items-center justify-between transition-all hover:bg-stone-50">
          <div className="space-y-1.5">
            <p className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">Engagement</p>
            <h4 className="text-2xl font-serif font-black text-stone-900 tracking-tight">{stats.totalLikes}</h4>
            <span className="text-[9px] text-stone-500 font-mono uppercase tracking-wider flex items-center gap-0.5">
              <Heart size={10} className="fill-stone-900 text-stone-900" />
              Readers active likes
            </span>
          </div>
          <div className="p-3 bg-stone-100 border border-stone-200 rounded-sm text-stone-800">
            <Heart size={18} />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: SVG Traffic Trends */}
        <div className="bg-white p-5 border border-stone-200 rounded-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900">Traffic Trend Metrics</h3>
              <p className="text-[10px] font-mono text-stone-400 uppercase mt-0.5">Total views over the past 7 days</p>
            </div>
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-sm px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500">
              <TrendingUp size={12} className="text-stone-800" />
              <span>Real-time Tracker</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-auto min-w-[400px] select-none font-mono"
            >
              {/* Grids */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f5f5f4" strokeWidth={1} />
              <line x1={padding} y1={(chartHeight) / 2} x2={chartWidth - padding} y2={(chartHeight) / 2} stroke="#f5f5f4" strokeWidth={1} />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e7e5e4" strokeWidth={1.5} />

              {/* Shaded Area */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#stoneGrad)"
                  className="transition-all duration-500"
                />
              )}

              {/* Trend line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#1c1917"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                />
              )}

              {/* Nodes and Labels */}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  {/* Grid tick line */}
                  <line x1={p.x} y1={chartHeight - padding} x2={p.x} y2={p.y} stroke="#f5f5f4" strokeDasharray="2 2" />
                  
                  {/* Hover visual aura */}
                  <circle cx={p.x} cy={p.y} r={7} className="fill-stone-900/10 opacity-0 group-hover:opacity-100 transition" />
                  {/* Point node */}
                  <circle cx={p.x} cy={p.y} r={4} className="fill-white stroke-stone-900 stroke-2" />
                  
                  {/* Numeric View count values above */}
                  <text 
                    x={p.x} 
                    y={p.y - 10} 
                    textAnchor="middle" 
                    className="text-[9px] font-mono font-bold fill-stone-900 opacity-70 group-hover:opacity-100 transition"
                  >
                    {p.value}
                  </text>
                  
                  {/* X axis labels (Dates) */}
                  <text 
                    x={p.x} 
                    y={chartHeight - 12} 
                    textAnchor="middle" 
                    className="text-[9px] font-mono fill-stone-400"
                  >
                    {p.label}
                  </text>
                </g>
              ))}

              {/* Gradients */}
              <defs>
                <linearGradient id="stoneGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#292524" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#292524" stopOpacity="0.00" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Chart 2: Category Distribution Ring */}
        <div className="bg-white p-5 border border-stone-200 rounded-sm">
          <div className="mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900">Category Share</h3>
            <p className="text-[10px] font-mono text-stone-400 uppercase mt-0.5">Distribution of content types</p>
          </div>

          <div className="flex flex-col items-center justify-center p-1 space-y-4">
            {/* Minimalist Grid Distribution list */}
            <div className="w-full space-y-4">
              {categories.map(([cat, count]) => {
                const percentage = Math.round((count / totalPosts) * 100);
                const colorClass = (colors as any)[cat] || 'bg-stone-400';
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-serif font-black text-stone-850 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-none border border-stone-400 ${colorClass.split(' ')[0]}`} />
                        {cat}
                      </span>
                      <span className="text-stone-500 font-mono text-[10px]">
                        {count} {count === 1 ? 'post' : 'posts'} ({percentage}%)
                      </span>
                    </div>
                    {/* Visual Progress scale */}
                    <div className="w-full h-1 bg-stone-100 border border-stone-200 rounded-none overflow-hidden">
                      <div 
                        className={`h-full ${colorClass.split(' ')[0]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Popular Posts & Trends */}
      <div className="bg-white border border-stone-200 rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900 flex items-center gap-1.5">
              <Star size={13} className="text-stone-800" />
              Highest Performing Publications
            </h3>
            <p className="text-[10px] font-mono text-stone-400 uppercase mt-0.5">Articles with the highest view density and reach</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2.5">Article Title</th>
                <th className="py-2.5 text-right">Views</th>
                <th className="py-2.5 text-right">Likes</th>
                <th className="py-2.5 text-right">Popularity Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {stats.popularPosts && stats.popularPosts.length > 0 ? (
                stats.popularPosts.map((post) => {
                  const popularityScore = post.views + post.likesCount * 10;
                  const scorePercentage = Math.min(100, Math.round((popularityScore / (maxViews * 1.5)) * 100));
                  return (
                    <tr key={post.id} className="hover:bg-stone-50/50 transition">
                      <td className="py-3 text-xs font-serif font-bold text-stone-850 max-w-xs md:max-w-md truncate">
                        {post.title}
                      </td>
                      <td className="py-3 text-xs font-mono text-right text-stone-600">
                        {post.views.toLocaleString()}
                      </td>
                      <td className="py-3 text-xs font-mono text-right text-stone-600">
                        {post.likesCount}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center justify-end w-28 gap-2">
                          <span className="text-[9px] font-mono font-bold text-stone-500">{scorePercentage}%</span>
                          <div className="w-16 h-1 bg-stone-100 border border-stone-200 rounded-none overflow-hidden">
                            <div 
                              className="h-full bg-stone-950" 
                              style={{ width: `${scorePercentage}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-xs text-stone-400 italic font-light">No publications logged traffic history yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

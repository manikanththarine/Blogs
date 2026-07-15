/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Editor' | 'Author' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export type PostStatus = 'Draft' | 'Published' | 'Archived';

export interface SEOMetadata {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: 'summary' | 'summary_large_image';
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  featuredImage: string;
  category: 'Songs' | 'News' | 'Sports' | 'General Knowledge';
  tags: string[];
  richTextContent: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  publicationDate: string;
  lastUpdatedDate: string;
  readTime: number; // in minutes
  seoMetadata: SEOMetadata;
  status: PostStatus;
  featuredPostOption: boolean;
  relatedPosts: string[]; // array of blog post IDs
  likes: string[]; // array of user IDs
  views: number;
}

export interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // 'CREATE_POST', 'UPDATE_POST', 'DELETE_POST', 'REGISTER_USER', 'ROLE_CHANGE', etc.
  targetId?: string;
  targetType?: string; // 'POST', 'USER', 'COMMENT'
  timestamp: string;
}

export interface DashboardStats {
  totalViews: number;
  totalPosts: number;
  totalUsers: number;
  totalLikes: number;
  categoryBreakdown: Record<string, number>;
  viewsHistory: { date: string; views: number }[];
  popularPosts: { id: string; title: string; views: number; likesCount: number }[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

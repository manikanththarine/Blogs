/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, BlogPost, BlogComment, ActivityLog, UserRole, DashboardStats, ContactMessage, NewsletterSubscriber } from '../types';
import {
  UserModel,
  BlogPostModel,
  BlogCommentModel,
  ActivityLogModel,
  ContactMessageModel,
  NewsletterSubscriberModel,
} from './models';

const MONGODB_URI = "mongodb://Vercel-Admin-Blogspost:cEQizeVXVA8DG2rs@ac-toridw7-shard-00-00.msdramu.mongodb.net:27017,ac-toridw7-shard-00-01.msdramu.mongodb.net:27017,ac-toridw7-shard-00-02.msdramu.mongodb.net:27017/blogcms?ssl=true&replicaSet=atlas-huwl8v-shard-0&authSource=admin&appName=Blogspost";

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set. Copy .env.example to .env and fill in your MongoDB connection string.');
}

// Cache the connection across invocations so serverless platforms (Vercel)
// reuse it between function calls instead of opening a new one each time.
declare global {
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

function getConnection(): Promise<typeof mongoose> {
  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(MONGODB_URI as string)
      .then((m) => {
        console.log('Connected to MongoDB');
        return m;
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        global._mongooseConn = undefined;
        throw err;
      });
  }
  return global._mongooseConn;
}

getConnection();

function genId(prefix: string): string {
  return `${prefix}_` + Math.random().toString(36).substr(2, 9);
}

const AVATAR_CHOICES = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=120&h=120&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
];


class MongoDatabase {
 
  // --- USERS API ---
  async getUsers(): Promise<User[]> {
    const docs = await UserModel.find();
    return docs.map((d) => d.toJSON() as unknown as User);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const doc = await UserModel.findById(id);
    return doc ? (doc.toJSON() as unknown as User) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    return doc ? (doc.toJSON() as unknown as User) : undefined;
  }

  async verifyPassword(userId: string, passwordPlain: string): Promise<boolean> {
    const doc = await UserModel.findById(userId).select('+passwordHash');
    if (!doc) return false;
    return bcrypt.compareSync(passwordPlain, doc.passwordHash);
  }

  async createUser(name: string, email: string, passwordPlain: string, role: UserRole = 'Viewer'): Promise<User> {
    const existing = await this.getUserByEmail(email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const id = genId('usr');
    const salt = bcrypt.genSaltSync(10);
    const doc = await UserModel.create({
      _id: id,
      name,
      email: email.toLowerCase(),
      role,
      avatar: AVATAR_CHOICES[Math.floor(Math.random() * AVATAR_CHOICES.length)],
      passwordHash: bcrypt.hashSync(passwordPlain, salt),
      createdAt: new Date().toISOString(),
    });

    await this.addLog(id, name, role, 'REGISTER_USER', id, 'USER');
    return doc.toJSON() as unknown as User;
  }

  async updateUser(id: string, updates: Partial<User>, currentOperatorId: string): Promise<User> {
    const doc = await UserModel.findById(id);
    if (!doc) {
      throw new Error('User not found');
    }

    const operator = await this.getUserById(currentOperatorId);
    if (!operator) {
      throw new Error('Unauthorized');
    }

    // Role-based authorization for editing user roles
    if (updates.role && updates.role !== doc.role && operator.role !== 'Admin') {
      throw new Error('Only Admins can modify roles');
    }

    if (updates.name !== undefined) doc.name = updates.name;
    if (updates.avatar !== undefined) doc.avatar = updates.avatar;
    if (updates.role !== undefined) doc.role = updates.role;
    await doc.save();

    await this.addLog(
      currentOperatorId,
      operator.name,
      operator.role,
      updates.role ? 'UPDATE_USER_ROLE' : 'UPDATE_USER_PROFILE',
      id,
      'USER'
    );

    return doc.toJSON() as unknown as User;
  }

  async updateUserPassword(id: string, passwordPlain: string): Promise<void> {
    const salt = bcrypt.genSaltSync(10);
    await UserModel.updateOne({ _id: id }, { passwordHash: bcrypt.hashSync(passwordPlain, salt) });
  }

  async deleteUser(id: string, currentOperatorId: string): Promise<void> {
    const operator = await this.getUserById(currentOperatorId);
    if (!operator || operator.role !== 'Admin') {
      throw new Error('Only Admins can delete users');
    }

    await UserModel.deleteOne({ _id: id });
    await this.addLog(currentOperatorId, operator.name, operator.role, 'DELETE_USER', id, 'USER');
  }

  // --- BLOG POSTS API ---
  async getPosts(includeUnpublished = false, authorId?: string, role?: UserRole): Promise<BlogPost[]> {
    let filter: Record<string, unknown> = { status: 'Published' };

    if (includeUnpublished) {
      if (role === 'Admin' || role === 'Editor') {
        filter = {};
      } else if (role === 'Author') {
        filter = { $or: [{ status: 'Published' }, { authorId }] };
      }
    }

    const docs = await BlogPostModel.find(filter);
    const posts = docs.map((d) => d.toJSON() as unknown as BlogPost);
    return posts.sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());
  }

  async getPostById(id: string): Promise<BlogPost | undefined> {
    const doc = await BlogPostModel.findById(id);
    return doc ? (doc.toJSON() as unknown as BlogPost) : undefined;
  }

  async getPostBySlug(slug: string): Promise<BlogPost | undefined> {
 const doc = await BlogPostModel.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true });
    return doc ? (doc.toJSON() as unknown as BlogPost) : undefined;
  }

  async createPost(postData: Omit<BlogPost, 'id' | 'authorId' | 'authorName' | 'authorRole' | 'publicationDate' | 'lastUpdatedDate' | 'likes' | 'views' | 'readTime'>, author: User): Promise<BlogPost> {

    if (author.role === 'Viewer') {
      throw new Error('Viewers are not authorized to write blog posts');
    }

    const id = genId('post');

    let baseSlug = postData.slug || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let index = 1;
    while (await BlogPostModel.exists({ slug })) {
      slug = `${baseSlug}-${index}`;
      index++;
    }

    const wordCount = postData.richTextContent.split(/\s+/).length;
    const readTime = Math.max(1, Math.round(wordCount / 200));

    const doc = await BlogPostModel.create({
      ...postData,
      _id: id,
      slug,
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role,
      publicationDate: postData.status === 'Published' ? new Date().toISOString() : '',
      lastUpdatedDate: new Date().toISOString(),
      readTime,
      likes: [],
      views: 0,
    });

    await this.addLog(author.id, author.name, author.role, 'CREATE_POST', id, 'POST');
    return doc.toJSON() as unknown as BlogPost;
  }

  async updatePost(id: string, updates: Partial<BlogPost>, operator: User): Promise<BlogPost> {
    const doc = await BlogPostModel.findById(id);
    if (!doc) {
      throw new Error('Post not found');
    }

    // Check permissions
    if (operator.role === 'Viewer') {
      throw new Error('Viewers cannot update posts');
    }
    if (operator.role === 'Author' && doc.authorId !== operator.id) {
      throw new Error('Authors can only edit their own posts');
    }
    if (operator.role === 'Editor' && doc.authorId !== operator.id) {
      throw new Error('Editors can only edit their own posts');
    }

    const titleChanged = !!updates.title && updates.title !== doc.title;
    const willPublish = updates.status === 'Published' && doc.status !== 'Published';

    // Apply updatable fields, excluding ones we compute/guard separately below
    // so a client-supplied id/slug/publicationDate/readTime can't clobber them.
    const { id: _id, slug: _slug, publicationDate: _pubDate, lastUpdatedDate: _lastUpdated, readTime: _readTime, ...safeUpdates } = updates;
    Object.assign(doc, safeUpdates);

    // Slug calculation if title changed
    if (titleChanged) {
      let baseSlug = updates.slug || updates.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let slug = baseSlug;
      let index = 1;
      while (await BlogPostModel.exists({ slug, _id: { $ne: id } })) {
        slug = `${baseSlug}-${index}`;
        index++;
      }
      doc.slug = slug;
    }

    if (willPublish) {
      doc.publicationDate = new Date().toISOString();
    }

    if (updates.richTextContent) {
      const wordCount = updates.richTextContent.split(/\s+/).length;
      doc.readTime = Math.max(1, Math.round(wordCount / 200));
    }

    doc.lastUpdatedDate = new Date().toISOString();

    await doc.save();
    await this.addLog(operator.id, operator.name, operator.role, 'UPDATE_POST', id, 'POST');
    return doc.toJSON() as unknown as BlogPost;
  }

  async deletePost(id: string, operator: User): Promise<void> {
    const post = await this.getPostById(id);
    if (!post) {
      throw new Error('Post not found');
    }

    // Check permissions
    if (operator.role === 'Admin') {
      // full access
    } else if (operator.role === 'Editor' && post.authorId === operator.id) {
      // Editor can delete own posts
    } else {
      throw new Error('You do not have permission to delete this post');
    }

    await BlogPostModel.deleteOne({ _id: id });
    await BlogCommentModel.deleteMany({ postId: id });

    await this.addLog(operator.id, operator.name, operator.role, 'DELETE_POST', id, 'POST');
  }

  async toggleLike(postId: string, userId: string): Promise<string[]> {
    const doc = await BlogPostModel.findById(postId);
    if (!doc) {
      throw new Error('Post not found');
    }

    const likesSet = new Set(doc.likes);
    if (likesSet.has(userId)) {
      likesSet.delete(userId);
    } else {
      likesSet.add(userId);
    }

    doc.likes = Array.from(likesSet);
    await doc.save();
    return doc.likes;
  }

  // --- COMMENTS API ---
  async getComments(postId: string): Promise<BlogComment[]> {
    const docs = await BlogCommentModel.find({ postId });
    const comments = docs.map((d) => d.toJSON() as unknown as BlogComment);
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addComment(postId: string, content: string, user: User): Promise<BlogComment> {
    const post = await this.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const commentId = genId('comm');
    const doc = await BlogCommentModel.create({
      _id: commentId,
      postId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      content,
      createdAt: new Date().toISOString(),
    });

    await this.addLog(user.id, user.name, user.role, 'ADD_COMMENT', commentId, 'COMMENT');
    return doc.toJSON() as unknown as BlogComment;
  }

  async deleteComment(commentId: string, operator: User): Promise<void> {
    const doc:any = await BlogCommentModel.findById(commentId);
    if (!doc) {
      throw new Error('Comment not found');
    }

    const post = await this.getPostById(doc.postId);

    const isCommentAuthor = doc.userId === operator.id;
    const isPostAuthor = post && post.authorId === operator.id;
    const isAdmin = operator.role === 'Admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw new Error('Unauthorized to delete this comment');
    }

    await BlogCommentModel.deleteOne({ _id: commentId });
    await this.addLog(operator.id, operator.name, operator.role, 'DELETE_COMMENT', commentId, 'COMMENT');
  }

  // --- LOGS ---
  async getLogs(operatorRole: UserRole): Promise<ActivityLog[]> {
    if (operatorRole !== 'Admin') {
      throw new Error('Only Admins can view activity logs');
    }
    const docs = await ActivityLogModel.find();
    const logs = docs.map((d) => d.toJSON() as unknown as ActivityLog);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private async addLog(userId: string, userName: string, userRole: UserRole, action: string, targetId?: string, targetType?: string) {
    await ActivityLogModel.create({
      _id: genId('log'),
      userId,
      userName,
      userRole,
      action,
      targetId,
      targetType,
      timestamp: new Date().toISOString(),
    });
  }

  // --- CONTACT & NEWSLETTER ---
  async getContactMessages(operatorRole: UserRole): Promise<ContactMessage[]> {
    if (operatorRole !== 'Admin') {
      throw new Error('Only Admins can view contact messages');
    }
    const docs = await ContactMessageModel.find();
    const messages = docs.map((d) => d.toJSON() as unknown as ContactMessage);
    return messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addContactMessage(name: string, email: string, subject: string, message: string): Promise<ContactMessage> {
    const doc = await ContactMessageModel.create({
      _id: genId('msg'),
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
    });
    return doc.toJSON() as unknown as ContactMessage;
  }

  async getSubscribers(operatorRole: UserRole): Promise<NewsletterSubscriber[]> {
    if (operatorRole !== 'Admin') {
      throw new Error('Only Admins can view subscribers');
    }
    const docs = await NewsletterSubscriberModel.find();
    const subscribers = docs.map((d) => d.toJSON() as unknown as NewsletterSubscriber);
    return subscribers.sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime());
  }

  async addSubscriber(email: string): Promise<NewsletterSubscriber> {
    const lowerEmail = email.toLowerCase();
    const existing = await NewsletterSubscriberModel.findOne({ email: lowerEmail });
    if (existing) {
      return existing.toJSON() as unknown as NewsletterSubscriber;
    }

    const doc = await NewsletterSubscriberModel.create({
      _id: genId('sub'),
      email: lowerEmail,
      subscribedAt: new Date().toISOString(),
    });
    return doc.toJSON() as unknown as NewsletterSubscriber;
  }

  // --- STATISTICS FOR DASHBOARD ---
  async getStats(operatorRole: UserRole): Promise<DashboardStats> {
    if (operatorRole !== 'Admin' && operatorRole !== 'Editor' && operatorRole !== 'Author') {
      throw new Error('Unauthorized to view dashboard statistics');
    }

    const posts = await BlogPostModel.find();
    const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
    const totalPosts = posts.length;
    const totalUsers = await UserModel.countDocuments();
    const totalLikes = posts.reduce((sum, p) => sum + p.likes.length, 0);

    const categoryBreakdown: Record<string, number> = {
      'Songs': 0,
      'News': 0,
      'Sports': 0,
      'General Knowledge': 0,
    };
    posts.forEach((p:any) => {
      if (p.category in categoryBreakdown) {
        categoryBreakdown[p.category]++;
      }
    });

    // Mock elegant views history (past 7 days including today)
    const viewsHistory = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Add a realistic-looking trend
      const randomSeed = 50 + Math.floor(Math.sin(i * 1.5) * 30) + Math.floor(Math.random() * 20);
      return {
        date: dateStr,
        views: totalViews ? Math.round((totalViews / 45) * randomSeed) : 0,
      };
    });

    const popularPosts = [...posts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        views: p.views,
        likesCount: p.likes.length,
      }));

    return {
      totalViews,
      totalPosts,
      totalUsers,
      totalLikes,
      categoryBreakdown,
      viewsHistory,
      popularPosts,
    };
  }
}

export const db = new MongoDatabase();

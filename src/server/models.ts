/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema } from 'mongoose';

function withIdTransform(schema: Schema) {
  schema.set('toJSON', {
    transform: (_doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.passwordHash;
      return ret;
    },
  });
}

const userSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  role: { type: String, required: true },
  avatar: { type: String },
  passwordHash: { type: String, required: true, select: false },
  createdAt: { type: String, required: true },
}, { versionKey: false });
withIdTransform(userSchema);

const seoMetadataSchema = new Schema({
  metaTitle: String,
  metaDescription: String,
  keywords: [String],
  ogTitle: String,
  ogDescription: String,
  ogImage: String,
  twitterCard: String,
}, { _id: false });

const blogPostSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  featuredImage: String,
  category: String,
  tags: [String],
  richTextContent: String,
  authorId: String,
  authorName: String,
  authorRole: String,
  publicationDate: String,
  lastUpdatedDate: String,
  readTime: Number,
  seoMetadata: seoMetadataSchema,
  status: String,
  featuredPostOption: Boolean,
  relatedPosts: [String],
  likes: [String],
  views: { type: Number, default: 0 },
}, { versionKey: false });
withIdTransform(blogPostSchema);

const blogCommentSchema = new Schema({
  _id: { type: String, required: true },
  postId: String,
  userId: String,
  userName: String,
  userRole: String,
  content: String,
  createdAt: String,
}, { versionKey: false });
withIdTransform(blogCommentSchema);

const activityLogSchema = new Schema({
  _id: { type: String, required: true },
  userId: String,
  userName: String,
  userRole: String,
  action: String,
  targetId: String,
  targetType: String,
  timestamp: String,
}, { versionKey: false });
withIdTransform(activityLogSchema);

const contactMessageSchema = new Schema({
  _id: { type: String, required: true },
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: String,
}, { versionKey: false });
withIdTransform(contactMessageSchema);

const newsletterSubscriberSchema = new Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  subscribedAt: String,
}, { versionKey: false });
withIdTransform(newsletterSubscriberSchema);

export const UserModel = mongoose.model('User', userSchema);
export const BlogPostModel = mongoose.model('BlogPost', blogPostSchema);
export const BlogCommentModel = mongoose.model('BlogComment', blogCommentSchema);
export const ActivityLogModel = mongoose.model('ActivityLog', activityLogSchema);
export const ContactMessageModel = mongoose.model('ContactMessage', contactMessageSchema);
export const NewsletterSubscriberModel = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);

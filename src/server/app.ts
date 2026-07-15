/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { User, UserRole, BlogPost, PostStatus } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Copy .env.example to .env and fill in a strong random secret.');
}

export const app = express();

// Middleware for parsing JSON with generous limits for rich content/base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Custom Security Headers (mimicking Helmet and XSS policies)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Authentication helper middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please authenticate.' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    }
    const user = await db.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }
    req.user = user;
    next();
  });
}

// Optional Auth (doesn't fail if no token, just populates req.user if present)
function optionalAuthenticate(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (!err) {
      const user = await db.getUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    next();
  });
}

// Role authorization builder
function authorizeRoles(...roles: UserRole[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Unauthorized. Required roles: ${roles.join(' or ')}. Your role: ${req.user.role}` });
    }
    next();
  };
}

// --- AUTHENTICATION API ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const newUser = await db.createUser(name, email, password, 'Viewer');
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: newUser,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.getUserByEmail(email);
    if (!user || !(await db.verifyPassword(user.id, password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Current User Details
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

// --- BLOG POSTS API ---

// Get all posts (with search, category, tags, and role filtering)
app.get('/api/posts', optionalAuthenticate, async (req: any, res) => {
  try {
    const { category, tag, search, includeDrafts, page = '1', limit = '10' } = req.query;

    const userRole = req.user?.role;
    const userId = req.user?.id;

    // Determine whether to show unpublished posts based on query and auth role
    const showDrafts = includeDrafts === 'true' && (userRole === 'Admin' || userRole === 'Editor' || userRole === 'Author');

    let posts = await db.getPosts(showDrafts, userId, userRole);
    // Apply category filter
    if (category) {
      posts = posts.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
    }

    // Apply tag filter
    if (tag) {
      posts = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === (tag as string).toLowerCase()));
    }

    // Apply text search
    if (search) {
      const q = (search as string).toLowerCase();
      posts = posts.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.richTextContent.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Pagination
    const pNum = parseInt(page as string, 10) || 1;
    const lNum = parseInt(limit as string, 10) || 10;
    const total = posts.length;
    const totalPages = Math.ceil(total / lNum);
    const paginatedPosts = posts.slice((pNum - 1) * lNum, pNum * lNum);

    res.json({
      posts: paginatedPosts,
      pagination: {
        page: pNum,
        limit: lNum,
        total,
        totalPages,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get post by slug
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await db.getPostBySlug(slug);

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Related posts (same category or overlapping tags, excluding current post)
    const allPosts = await db.getPosts(false);
    const related = allPosts
      .filter((p) => p.id !== post.id && (p.category === post.category || p.tags.some((t) => post.tags.includes(t))))
      .slice(0, 3);

    // Get post comments
    const comments = await db.getComments(post.id);

    res.json({
      post,
      relatedPosts: related,
      comments,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
app.post('/api/posts', authenticateToken, authorizeRoles('Admin', 'Editor', 'Author'), async (req: any, res) => {
  try {
    const { title, slug, featuredImage, category, tags, richTextContent, status, featuredPostOption, seoMetadata } = req.body;

    if (!title || !category || !richTextContent) {
      return res.status(400).json({ error: 'Title, category, and richTextContent are required fields' });
    }

    const defaultSeo = {
      metaTitle: title,
      metaDescription: richTextContent.replace(/<[^>]*>/g, '').slice(0, 150) + '...',
      keywords: tags || [],
      ogTitle: title,
      ogDescription: richTextContent.replace(/<[^>]*>/g, '').slice(0, 150) + '...',
      ogImage: featuredImage || 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
      twitterCard: 'summary_large_image' as const,
    };

    const newPost = await db.createPost({
      title,
      slug: slug || '',
      featuredImage: featuredImage || 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
      category,
      tags: tags || [],
      richTextContent,
      status: status || 'Draft',
      featuredPostOption: !!featuredPostOption,
      seoMetadata: {
        ...defaultSeo,
        ...seoMetadata,
      },
      relatedPosts: [],
    }, req.user);

    res.status(201).json({
      message: 'Blog post created successfully',
      post: newPost,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update post
app.put('/api/posts/:id', authenticateToken, authorizeRoles('Admin', 'Editor', 'Author'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const post = await db.getPostById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updatedPost = await db.updatePost(id, req.body, req.user);
    res.json({
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete post
app.delete('/api/posts/:id', authenticateToken, authorizeRoles('Admin', 'Editor'), async (req: any, res) => {
  try {
    const { id } = req.params;
    await db.deletePost(id, req.user);
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Like/Unlike post
app.post('/api/posts/:id/like', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const likes = await db.toggleLike(id, req.user.id);
    res.json({ likes, likesCount: likes.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- COMMENTS API ---

// Add Comment
app.post('/api/posts/:postId/comments', authenticateToken, async (req: any, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await db.addComment(postId, content, req.user);
    res.status(201).json({
      message: 'Comment added successfully',
      comment,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Comment
app.delete('/api/comments/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    await db.deleteComment(id, req.user);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// --- ADMIN / DASHBOARD APIs ---

// Stats (Admin, Editor, Author)
app.get('/api/admin/stats', authenticateToken, authorizeRoles('Admin', 'Editor', 'Author'), async (req: any, res) => {
  try {
    const stats = await db.getStats(req.user.role);
    res.json({ stats });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Users List (Admin Only)
app.get('/api/admin/users', authenticateToken, authorizeRoles('Admin'), async (req: any, res) => {
  try {
    const users = await db.getUsers();
    res.json({ users });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Update User Role/Profile (Admin Only)
app.put('/api/admin/users/:id', authenticateToken, authorizeRoles('Admin'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateUser(id, req.body, req.user.id);
    res.json({ message: 'User updated successfully', user: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete User (Admin Only)
app.delete('/api/admin/users/:id', authenticateToken, authorizeRoles('Admin'), async (req: any, res) => {
  try {
    const { id } = req.params;
    await db.deleteUser(id, req.user.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Activity Logs (Admin Only)
app.get('/api/admin/logs', authenticateToken, authorizeRoles('Admin'), async (req: any, res) => {
  try {
    const logs = await db.getLogs(req.user.role);
    res.json({ logs });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// --- PUBLIC ENGAGEMENT APIs ---

// Contact Form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields (name, email, subject, message) are required' });
    }
    const newMessage = await db.addContactMessage(name, email, subject, message);
    res.status(201).json({
      message: 'Message received! We will get back to you shortly.',
      contactMessage: newMessage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Newsletter Subscription
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    const subscriber = await db.addSubscriber(email);
    res.status(201).json({
      message: 'Successfully subscribed to the newsletter!',
      subscriber,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// View Contact Messages (Admin Only)
app.get('/api/admin/contacts', authenticateToken, authorizeRoles('Admin'), async (req: any, res) => {
  try {
    const contacts = await db.getContactMessages(req.user.role);
    res.json({ contacts });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// View Newsletter Subscribers (Admin Only)
app.get('/api/admin/subscribers', authenticateToken, authorizeRoles('Admin'), async (req: any, res) => {
  try {
    const subscribers = await db.getSubscribers(req.user.role);
    res.json({ subscribers });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Simulated File Upload endpoint (converts base64 to server static paths or accepts category hints and returns gorgeous unsplash links)
app.post('/api/upload', (req, res) => {
  try {
    const { image, category } = req.body;

    // If a base64 was sent, we can return it as-is or mock a saved path
    if (image && image.startsWith('data:image')) {
      return res.json({
        url: image, // Returning the base64 itself works perfectly in the browser and requires no disk space issues!
        message: 'Image uploaded successfully'
      });
    }

    // Otherwise, return a high-quality stock photo based on category
    const query = category || 'writing';
    const randomId = Math.floor(Math.random() * 1000);
    const url = `https://images.unsplash.com/photo-${randomId}?auto=format&fit=crop&w=800&q=80`;

    res.json({
      url,
      message: 'Image simulated and curated successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- OPENAPI SWAGGER SPECIFICATION JSON ENDPOINT ---
app.get('/api/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Blog Portal and CMS REST API',
      description: 'Enterprise-grade fully documented REST API supporting JWT authentication, Role-Based Access Control, Blog CRUD, Commenting, public forms, and analytics.',
      version: '1.0.0',
    },
    servers: [
      {
        url: '/api',
        description: 'Local development / Production self proxy server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token to authorize requests.',
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          summary: 'User Registration',
          description: 'Register a new user account with role Viewer by default.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Alex Mercer' },
                    email: { type: 'string', format: 'email', example: 'alex@example.com' },
                    password: { type: 'string', minLength: 6, example: 'secret123' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Created successfully',
              content: {
                'application/json': {
                  example: {
                    message: 'Registration successful',
                    token: 'eyJhbGciOiJIUzI1Ni...',
                    user: { id: 'usr_abc123', name: 'Alex Mercer', email: 'alex@example.com', role: 'Viewer', createdAt: '2026-07-14T23:00:00Z' },
                  },
                },
              },
            },
            400: { description: 'Validation error or email already exists' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'User Login',
          description: 'Authenticate email and password to receive a JWT session token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'admin@example.com' },
                    password: { type: 'string', example: 'admin123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  example: {
                    message: 'Login successful',
                    token: 'eyJhbGciOiJIUzI1Ni...',
                    user: { id: 'usr_admin', name: 'System Admin', email: 'admin@example.com', role: 'Admin', createdAt: '2026-01-01T00:00:00Z' },
                  },
                },
              },
            },
            401: { description: 'Invalid email or password' },
          },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Get Current Session User',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Authenticated user object',
              content: {
                'application/json': {
                  example: {
                    user: { id: 'usr_admin', name: 'System Admin', email: 'admin@example.com', role: 'Admin', createdAt: '2026-01-01T00:00:00Z' },
                  },
                },
              },
            },
            401: { description: 'Missing or expired token' },
          },
        },
      },
      '/posts': {
        get: {
          summary: 'List Blog Posts',
          description: 'Query published posts with optional search, categories, tags, and pagination.',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Songs, News, Sports, or General Knowledge', example: 'Songs' },
            { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'Specific tag matching' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Fuzzy search keyword' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: {
              description: 'Successful fetch',
              content: {
                'application/json': {
                  example: {
                    posts: [{ id: 'post_1', title: 'The Evolution of Music', slug: 'evolution-of-music-streaming-songwriting', category: 'Songs', tags: ['Music'], views: 342, likes: [] }],
                    pagination: { page: 1, limit: 10, total: 5, totalPages: 1 },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create Blog Post',
          security: [{ BearerAuth: [] }],
          description: 'Authorized roles: Admin, Editor, Author.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'category', 'richTextContent'],
                  properties: {
                    title: { type: 'string', example: 'New Discoveries in Physics' },
                    category: { type: 'string', example: 'General Knowledge' },
                    richTextContent: { type: 'string', example: '<p>A deep explore of dark energy...</p>' },
                    status: { type: 'string', enum: ['Draft', 'Published', 'Archived'], default: 'Draft' },
                    tags: { type: 'array', items: { type: 'string' }, example: ['Physics', 'Space'] },
                    featuredImage: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Created successfully' },
            400: { description: 'Validation error' },
            403: { description: 'Unauthorized role' },
          },
        },
      },
      '/posts/{slug}': {
        get: {
          summary: 'Get Blog Post by Slug',
          description: 'Fetch detailed single post, related posts, and active comments. Increments views.',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'evolution-of-music-streaming-songwriting' },
          ],
          responses: {
            200: { description: 'Post found successfully' },
            404: { description: 'Post not found' },
          },
        },
      },
      '/posts/{id}/like': {
        post: {
          summary: 'Toggle Like on Post',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'post_1' },
          ],
          responses: {
            200: { description: 'Liked/Unliked successfully' },
          },
        },
      },
      '/posts/{postId}/comments': {
        post: {
          summary: 'Add Comment to Post',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'postId', in: 'path', required: true, schema: { type: 'string' }, example: 'post_1' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: { type: 'string', example: 'Wow, fantastic article!' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Comment created' },
          },
        },
      },
      '/admin/stats': {
        get: {
          summary: 'Dashboard Aggregated Analytics',
          security: [{ BearerAuth: [] }],
          description: 'Provides view counts, like statistics, user distributions, and weekly charts.',
          responses: {
            200: { description: 'Statistics payload' },
            403: { description: 'Unauthorized role' },
          },
        },
      },
    },
  });
});

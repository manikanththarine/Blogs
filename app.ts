import express from "express";
import path from "path";
import fs from "fs/promises";
import { pathToFileURL } from "url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { createServer as createViteServer } from "vite";
import User from "./models/User";
import BlogPost from "./models/BlogPost";
import { buildPostFilter, getPostById } from "./lib/postQueries";
import { serializeDoc } from "./lib/serialize";
import { SITE_URL } from "./src/lib/seo";

type RenderFn = (url: string) => Promise<{
  html: string;
  initialData: unknown;
  status: number;
}>;

// react-helmet-async on React 19 renders <title>/<meta>/<link>/<script> as plain JSX
// exactly where <Helmet> sits in the tree (see src/entry-server.tsx for why) — pull
// those tags out of the rendered string and place them in the template's real <head>.
const HEAD_TAG_RE =
  /<title>[\s\S]*?<\/title>|<meta\b[^>]*\/>|<link\b[^>]*\/>|<script type="application\/ld\+json">[\s\S]*?<\/script>/g;

function extractHeadTags(html: string): { headTags: string; bodyHtml: string } {
  const matches = html.match(HEAD_TAG_RE) || [];
  const bodyHtml = html.replace(HEAD_TAG_RE, "");
  return { headTags: matches.join("\n"), bodyHtml };
}

function injectHtml(template: string, rendered: Awaited<ReturnType<RenderFn>>) {
  const { html, initialData } = rendered;
  const { headTags, bodyHtml } = extractHeadTags(html);
  const dataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")};</script>`;

  return template
    .replace("<!--app-head-->", headTags)
    .replace("<!--app-html-->", bodyHtml)
    .replace("<!--app-data-->", dataScript);
}

async function canModifyPost(userId: string, post: any): Promise<boolean> {
  if (post.author.id === userId) return true;
  if (!mongoose.isValidObjectId(userId)) return false;
  const requestingUser = await User.findById(userId).lean();
  return !!requestingUser && requestingUser.role === "admin";
}

export async function createApp() {
  const app = express();

  app.use(express.json());

  // In-memory store for contact form submissions (not part of the CRUD scope)
  let contacts: any[] = [];

  // API: Blog posts fetching with full search and filtering capabilities
  app.get("/api/posts", async (req, res) => {
    try {
      const { q, category, tag } = req.query;
      const filter = buildPostFilter({ category, tag, q });

      const posts = await BlogPost.find(filter).sort({ createdAt: -1 }).lean();
      res.json(posts.map(serializeDoc));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // API: Fetch a single blog post by id
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await getPostById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(serializeDoc(post));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // API: Individual blog post views increment
  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      const post = await BlogPost.findByIdAndUpdate(
        req.params.id,
        { $inc: { views: 1 } },
        { new: true }
      );
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json({ success: true, views: post.views });
    } catch (err: any) {
      res.status(404).json({ error: "Post not found" });
    }
  });

  // API: Like / Unlike a post
  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "UserId is required to like posts" });
      }

      const post = await BlogPost.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const index = post.likes.indexOf(userId);
      if (index > -1) {
        post.likes.splice(index, 1);
      } else {
        post.likes.push(userId);
      }
      await post.save();

      res.json({ liked: index === -1, likesCount: post.likes.length, likes: post.likes });
    } catch (err: any) {
      res.status(404).json({ error: "Post not found" });
    }
  });

  // API: Create new blog post
  app.post("/api/posts", async (req, res) => {
    try {
      const { title, content, category, authorId, authorUsername, tags, newsMetadata, lyricsMetadata, sportsMetadata, techMetadata } = req.body;

      if (!title || !content || !category || !authorId || !authorUsername) {
        return res.status(400).json({ error: "Missing required fields for blog post" });
      }

      const newPost = await BlogPost.create({
        title,
        content,
        category,
        author: { id: authorId, username: authorUsername },
        tags: tags || [],
        newsMetadata,
        lyricsMetadata,
        sportsMetadata,
        techMetadata
      });

      res.status(201).json(serializeDoc(newPost));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // API: Update an existing blog post
  app.put("/api/posts/:id", async (req, res) => {
    try {
      const { userId, title, content, category, tags, newsMetadata, lyricsMetadata, sportsMetadata, techMetadata } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "UserId is required to update a post" });
      }

      const post = await BlogPost.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (!(await canModifyPost(userId, post))) {
        return res.status(403).json({ error: "Unauthorized to update this post" });
      }

      if (title !== undefined) post.title = title;
      if (content !== undefined) post.content = content;
      if (category !== undefined) post.category = category;
      if (tags !== undefined) post.tags = tags;
      post.newsMetadata = newsMetadata;
      post.lyricsMetadata = lyricsMetadata;
      post.sportsMetadata = sportsMetadata;
      post.techMetadata = techMetadata;

      await post.save();
      res.json(serializeDoc(post));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // API: Delete a blog post
  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { userId } = req.body;
      const post = await BlogPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (!(await canModifyPost(userId, post))) {
        return res.status(403).json({ error: "Unauthorized to delete this post" });
      }

      await post.deleteOne();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // API: Register User
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, preferences } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing username, email or password" });
      }

      const existing = await User.findOne({ $or: [{ username }, { email }] });
      if (existing) {
        return res.status(409).json({ error: "Username or email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        preferences: preferences || {
          categories: ["news", "lyrics", "sports", "tech"],
          theme: "dark",
          region: "Global"
        }
      });

      res.status(201).json(serializeDoc(newUser));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // API: Login User
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      res.json(serializeDoc(user));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  // API: Update User Preferences
  app.put("/api/auth/preferences", async (req, res) => {
    try {
      const { userId, preferences } = req.body;

      if (!userId || !preferences) {
        return res.status(400).json({ error: "Missing userId or preferences" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.preferences = { ...user.preferences, ...preferences };
      await user.save();
      res.json(serializeDoc(user));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // API: Geolocation lookup strategy
  app.post("/api/geolocation", (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.json({
        location: "Global Grid",
        weather: "Sunny • 74°F",
        localTrending: "Tech Innovation Summit",
        region: "Global"
      });
    }

    // Map latitude/longitude ranges to major regions
    let location = "Global Grid";
    let weather = "Mild • 68°F";
    let localTrending = "#SustainableFuture";
    let region = "Global";

    if (latitude > 25 && latitude < 49 && longitude > -125 && longitude < -69) {
      location = "North American Region";
      weather = "Sunny • 78°F";
      localTrending = "Silicon Valley Tech Wave & Local Sports Finals";
      region = "North America";
    } else if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 40) {
      location = "European Region";
      weather = "Chilly • 54°F";
      localTrending = "Euro Cup Highlights & European Tech Regulation";
      region = "Europe";
    } else if (latitude > 5 && latitude < 35 && longitude > 68 && longitude < 97) {
      location = "Indian Subcontinent";
      weather = "Warm • 88°F";
      localTrending = "Cricket League Finals & Emerging Cloud Technologies";
      region = "Asia";
    } else if (latitude > -45 && latitude < -10 && longitude > 112 && longitude < 154) {
      location = "Australian Grid";
      weather = "Breezy • 62°F";
      localTrending = "Melbourne Music Scene & Down-Under Rugby Cup";
      region = "Australia";
    } else {
      location = "Equatorial Hub";
      weather = "Tropical Rain • 82°F";
      localTrending = "Global Climate Solutions Summit";
      region = "Global";
    }

    res.json({
      location,
      weather,
      localTrending,
      region
    });
  });

  // API: Contact Submission Form Handler
  app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Please fill in all contact form fields" });
    }

    const newSubmission = {
      id: `contact-${Date.now()}`,
      name,
      email,
      subject,
      message,
      submittedAt: new Date().toISOString()
    };

    contacts.push(newSubmission);
    console.log("Contact form submitted:", newSubmission);
    res.json({ success: true, message: "Thank you for reaching out! We will contact you soon." });
  });

  // SEO: robots.txt — explicitly allows AI answer-engine crawlers alongside standard
  // search bots, since GEO (being cited by AI answers) is a goal alongside classic SEO.
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /manage",
        "Disallow: /api/",
        "",
        "User-agent: GPTBot",
        "Allow: /",
        "",
        "User-agent: ClaudeBot",
        "Allow: /",
        "",
        "User-agent: anthropic-ai",
        "Allow: /",
        "",
        "User-agent: Google-Extended",
        "Allow: /",
        "",
        "User-agent: PerplexityBot",
        "Allow: /",
        "",
        "User-agent: CCBot",
        "Allow: /",
        "",
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        ""
      ].join("\n")
    );
  });

  // SEO: dynamic sitemap covering the home feed, each category, and every post
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const posts = await BlogPost.find().select("_id createdAt").sort({ createdAt: -1 }).lean();

      const staticEntries = ["", "/category/news", "/category/lyrics", "/category/sports", "/category/tech"].map(
        (urlPath) => `  <url><loc>${SITE_URL}${urlPath}</loc></url>`
      );

      const postEntries = posts.map((post: any) => {
        const lastmod = new Date(post.createdAt).toISOString();
        return `  <url><loc>${SITE_URL}/post/${post._id.toString()}</loc><lastmod>${lastmod}</lastmod></url>`;
      });

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...staticEntries,
        ...postEntries,
        "</urlset>"
      ].join("\n");

      res.type("application/xml").send(xml);
    } catch (err) {
      res.status(500).send("Failed to generate sitemap");
    }
  });

  // Vite middleware (dev) / SSR rendering (dev + prod) setup.
  // Vercel doesn't reliably set NODE_ENV for custom Node functions, but it always
  // sets VERCEL=1, so treat that as production too (the dev branch below reads
  // source files that are never bundled into the deployed function).
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await fs.readFile(path.join(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        const { render } = (await vite.ssrLoadModule("/src/entry-server.tsx")) as { render: RenderFn };
        const rendered = await render(url);
        res.status(rendered.status).set({ "Content-Type": "text/html" }).end(injectHtml(template, rendered));
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const clientDistPath = path.join(process.cwd(), "dist", "client");
    const template = await fs.readFile(path.join(clientDistPath, "index.html"), "utf-8");
    const serverEntryPath = path.join(process.cwd(), "dist", "server", "entry-server.js");
    const { render } = (await import(pathToFileURL(serverEntryPath).href)) as { render: RenderFn };

    app.use(express.static(clientDistPath, { index: false }));

    app.use(async (req, res, next) => {
      try {
        const rendered = await render(req.originalUrl);
        res.status(rendered.status).set({ "Content-Type": "text/html" }).end(injectHtml(template, rendered));
      } catch (e) {
        next(e);
      }
    });
  }

  return app;
}

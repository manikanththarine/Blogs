import mongoose from "mongoose";
import BlogPost from "../models/BlogPost";
import { serializeDoc } from "./serialize";
import type { RouteData } from "../src/routeData";

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildPostFilter({ category, tag, q }: { category?: unknown; tag?: unknown; q?: unknown }) {
  const filter: any = {};

  if (category && category !== "all") {
    filter.category = category;
  }

  if (tag) {
    filter.tags = tag;
  }

  if (q) {
    const regex = new RegExp(escapeRegex(q as string), "i");
    filter.$or = [
      { title: regex },
      { content: regex },
      { tags: regex },
      { "author.username": regex },
      { "newsMetadata.source": regex },
      { "lyricsMetadata.artist": regex },
      { "lyricsMetadata.songTitle": regex },
      { "sportsMetadata.sportType": regex },
      { "sportsMetadata.teamNames": regex }
    ];
  }

  return filter;
}

export async function getPostById(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  return BlogPost.findById(id).lean();
}

// Mirrors the client-side routes declared in src/App.tsx — used to prefetch
// data for SSR before the React tree renders, since there are no route loaders.
export async function loadRouteData(url: string): Promise<RouteData> {
  const parsed = new URL(url, "http://internal");
  const pathname = parsed.pathname;
  const query = parsed.searchParams.get("q") || "";

  const categoryMatch = pathname.match(/^\/category\/([^/]+)\/?$/);
  if (pathname === "/" || categoryMatch) {
    const category = categoryMatch ? categoryMatch[1] : "all";
    const posts = await BlogPost.find(buildPostFilter({ category, q: query }))
      .sort({ createdAt: -1 })
      .lean();
    return { kind: "feed", category, query, posts: posts.map(serializeDoc) };
  }

  const postMatch = pathname.match(/^\/post\/([^/]+)\/?$/);
  if (postMatch) {
    const post = await getPostById(postMatch[1]);
    return { kind: "post", postId: postMatch[1], post: post ? serializeDoc(post) : null };
  }

  if (pathname === "/manage" || pathname === "/manage/") {
    return { kind: "manage" };
  }

  return { kind: "none" };
}

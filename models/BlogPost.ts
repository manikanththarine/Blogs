import mongoose, { Schema, Document } from "mongoose";
import { BlogCategory } from "../src/types";

export interface IBlogPost extends Document {
  title: string;
  content: string;
  category: BlogCategory;
  author: {
    id: string;
    username: string;
  };
  tags: string[];
  views: number;
  likes: string[];
  createdAt: Date;
  newsMetadata?: { source: string; importance: "high" | "medium" | "low" };
  lyricsMetadata?: { artist: string; songTitle: string; album?: string };
  sportsMetadata?: { sportType: string; teamNames: string[]; score?: string };
  techMetadata?: { techStack: string[]; difficulty: "beginner" | "intermediate" | "advanced" };
}

const BlogPostSchema = new Schema<IBlogPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ["news", "lyrics", "sports", "tech"], required: true },
  author: {
    id: { type: String, required: true },
    username: { type: String, required: true }
  },
  tags: [String],
  views: { type: Number, default: 0 },
  likes: [{ type: String }],
  newsMetadata: {
    source: String,
    importance: { type: String, enum: ["high", "medium", "low"] }
  },
  lyricsMetadata: {
    artist: String,
    songTitle: String,
    album: String
  },
  sportsMetadata: {
    sportType: String,
    teamNames: [String],
    score: String
  },
  techMetadata: {
    techStack: [String],
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"] }
  },
  createdAt: { type: Date, default: Date.now }
});

export default (mongoose.models.BlogPost as mongoose.Model<IBlogPost>) || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

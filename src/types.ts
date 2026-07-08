export type BlogCategory = 'news' | 'lyrics' | 'sports' | 'tech';

export interface UserPreferences {
  categories: BlogCategory[];
  theme: 'light' | 'dark';
  region: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role?: 'user' | 'admin';
  preferences: UserPreferences;
  createdAt: string;
}

export interface NewsMetadata {
  source: string;
  importance: 'high' | 'medium' | 'low';
}

export interface LyricsMetadata {
  artist: string;
  songTitle: string;
  album?: string;
}

export interface SportsMetadata {
  sportType: string;
  teamNames: string[];
  score?: string;
}

export interface TechMetadata {
  techStack: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: BlogCategory;
  author: {
    id: string;
    username: string;
  };
  tags: string[];
  views: number;
  likes: string[]; // List of user IDs who liked it
  createdAt: string;
  newsMetadata?: NewsMetadata;
  lyricsMetadata?: LyricsMetadata;
  sportsMetadata?: SportsMetadata;
  techMetadata?: TechMetadata;
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface SearchFilter {
  query: string;
  category: BlogCategory | 'all';
  tag?: string;
}

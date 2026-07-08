import { BlogPost } from './types';

export type RouteData =
  | { kind: 'feed'; category: string; query: string; posts: BlogPost[] }
  | { kind: 'post'; postId: string; post: BlogPost | null }
  | { kind: 'manage' }
  | { kind: 'none' };

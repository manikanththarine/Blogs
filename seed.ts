import bcrypt from "bcryptjs";
import User from "./models/User";
import BlogPost from "./models/BlogPost";

export async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  const hashedPassword = await bcrypt.hash("Admin@12345", 10);
  const admin = await User.create({
    username: "editor_alpha",
    email: "alpha@blogportal.com",
    password: hashedPassword,
    role: "admin",
    preferences: {
      categories: ["news", "lyrics", "sports", "tech"],
      theme: "dark",
      region: "Global"
    }
  });

  console.log("Seeded default admin user -> email: alpha@blogportal.com | password: Admin@12345");

  const author = { id: admin.id, username: admin.username };

  await BlogPost.insertMany([
    {
      title: "Global Renewable Power Capacity Surges by 50% in Record Year",
      content: "The world added 50% more renewable capacity in 2025 than in 2024, representing the fastest growth in the past two decades. According to the latest global energy outlook report, solar PV accounted for three-quarters of the additions worldwide.",
      category: "news",
      author,
      tags: ["energy", "climate", "news", "sustainability"],
      views: 1420,
      likes: [],
      newsMetadata: { source: "Global Energy Alliance", importance: "high" }
    },
    {
      title: "Lyrics: Neon Shadows (A Synthwave Ballad)",
      content: "[Verse 1]\nChrome lights flickering under the rain\nWe run the digital wire to block out the pain\n\n[Chorus]\nOh, neon shadows on the concrete wall\nIn the cyber heartbeat, we hear the siren call",
      category: "lyrics",
      author,
      tags: ["lyrics", "synthwave", "cyberpunk", "music"],
      views: 890,
      likes: [],
      lyricsMetadata: { artist: "Code Breaker feat. Echo", songTitle: "Neon Shadows", album: "Analog Heartbeats" }
    },
    {
      title: "Epic Five-Set Comeback Seals Historic Championship Title",
      content: "In what sports analysts are calling the match of the century, the underdog fought back from two sets down to clinch their first Grand Slam championship.",
      category: "sports",
      author,
      tags: ["tennis", "grandslam", "comeback", "sports"],
      views: 2450,
      likes: [],
      sportsMetadata: { sportType: "Tennis", teamNames: ["Leo Sterling", "Marcus Thorne"], score: "4-6, 3-6, 7-5, 6-4, 8-6" }
    },
    {
      title: "Understanding React 19 Server Components: A Comprehensive Guide",
      content: "React 19 brings stable Server Components to the wider ecosystem, fundamentally changing how we architect modern web applications.",
      category: "tech",
      author,
      tags: ["react", "webdev", "javascript", "tech"],
      views: 3100,
      likes: [],
      techMetadata: { techStack: ["React 19", "Vite", "Server Actions"], difficulty: "advanced" }
    }
  ]);

  console.log("Seeded sample blog posts.");
}

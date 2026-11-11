// Shared constants for YOU

export const INTEREST_SUGGESTIONS = [
  "Technology",
  "Coding",
  "Gaming",
  "Business",
  "Creativity",
  "Music",
  "Movies",
  "Sports",
  "Reading",
  "Fitness",
  "Travel",
  "Education",
  "Photography",
  "Cooking",
  "Science",
  "Art",
  "Nature",
  "Design",
  "Writing",
  "Languages",
] as const;

export const AGE_RANGES = [
  "Under 18",
  "18–24",
  "25–34",
  "35–44",
  "45–54",
  "55–64",
  "65+",
  "Prefer not to say",
] as const;

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Hindi",
  "Urdu",
  "Arabic",
  "Chinese",
  "Japanese",
  "Korean",
  "Italian",
  "Dutch",
  "Turkish",
  "Indonesian",
  "Bengali",
] as const;

export const COMMUNICATION_STYLES = [
  "Warm & encouraging",
  "Direct & concise",
  "Playful & witty",
  "Formal & professional",
  "Curious & exploratory",
  "Calm & reflective",
] as const;

export const RESPONSE_LENGTHS = [
  "Brief",
  "Balanced",
  "Detailed",
  "Exhaustive",
] as const;

export const WORLD_ICONS = [
  "Sparkles",
  "Code2",
  "Gamepad2",
  "Music",
  "Palette",
  "GraduationCap",
  "Plane",
  "BookOpen",
  "Dumbbell",
  "Camera",
  "Leaf",
  "Rocket",
  "FlaskConical",
  "Heart",
  "Globe",
  "Star",
  "Headphones",
  "Film",
  "Coffee",
  "Mountain",
  "Anchor",
  "Compass",
  "Zap",
  "Lightbulb",
] as const;

export const WORLD_COVERS = [
  { id: "aurora", label: "Aurora", css: "linear-gradient(135deg,#312e81 0%,#6366f1 45%,#22d3ee 100%)" },
  { id: "ember", label: "Ember", css: "linear-gradient(135deg,#7c2d12 0%,#ea580c 50%,#fbbf24 100%)" },
  { id: "forest", label: "Forest", css: "linear-gradient(135deg,#052e16 0%,#166534 55%,#4ade80 100%)" },
  { id: "ocean", label: "Ocean", css: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 50%,#38bdf8 100%)" },
  { id: "rose", label: "Rosé", css: "linear-gradient(135deg,#500724 0%,#be185d 55%,#fb7185 100%)" },
  { id: "violet", label: "Violet", css: "linear-gradient(135deg,#2e1065 0%,#7c3aed 55%,#c084fc 100%)" },
  { id: "slate", label: "Slate", css: "linear-gradient(135deg,#0f172a 0%,#334155 60%,#94a3b8 100%)" },
  { id: "gold", label: "Gold", css: "linear-gradient(135deg,#422006 0%,#a16207 55%,#fde047 100%)" },
  { id: "mono", label: "Noir", css: "linear-gradient(135deg,#09090b 0%,#27272a 60%,#71717a 100%)" },
  { id: "cosmic", label: "Cosmic", css: "radial-gradient(1200px 500px at 20% -10%,#6366f1 0%,transparent 55%),radial-gradient(900px 500px at 85% 0%,#ec4899 0%,transparent 55%),#0a0a12" },
] as const;

export const WORLD_BACKGROUNDS = [
  { id: "void", label: "Void", css: "transparent" },
  { id: "nebula", label: "Nebula", css: "radial-gradient(1000px 600px at 15% -10%, rgba(99,102,241,.22), transparent 60%), radial-gradient(800px 500px at 90% 0%, rgba(236,72,153,.14), transparent 55%)" },
  { id: "ember", label: "Ember Glow", css: "radial-gradient(1000px 600px at 85% -10%, rgba(234,88,12,.18), transparent 60%), radial-gradient(800px 500px at 10% 100%, rgba(251,191,36,.08), transparent 55%)" },
  { id: "tide", label: "Tide", css: "radial-gradient(1000px 600px at 10% -10%, rgba(56,189,248,.16), transparent 60%), radial-gradient(800px 500px at 95% 110%, rgba(16,185,129,.12), transparent 55%)" },
  { id: "garden", label: "Garden", css: "radial-gradient(1000px 600px at 50% -20%, rgba(74,222,128,.14), transparent 60%)" },
  { id: "grid", label: "Blueprint", css: "linear-gradient(rgba(99,102,241,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.05) 1px, transparent 1px)" },
] as const;

export const ACCENT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#e879f9",
  "#a3e635",
] as const;

// Kept for reference — media now lives in Firestore (free tier) with a 700 KB cap.
export const FIRESTORE_MEDIA_LIMIT_BYTES = 700 * 1024;

export const ACCEPT_BY_KIND: Record<string, string> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  pdf: "application/pdf",
  document:
    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.rtf,.odt,.ods,.odp",
};

export const QUOTES = [
  { text: "You are not building a streak for an algorithm. You are building trust with your future self.", author: "YOU" },
  { text: "The internet is about everyone. YOU is about you.", author: "YOU" },
  { text: "Your world. Your space. Your journey.", author: "YOU" },
  { text: "We cannot solve our problems with the same thinking we used when we created them.", author: "Albert Einstein" },
  { text: "What gets measured gets managed — but what gets loved gets maintained.", author: "Peter Drucker" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
  { text: "First, have a definite, clear practical ideal; a goal, an objective.", author: "Aristotle" },
  { text: "Begin — the rest is labor, but only this word can begin it.", author: "Goethe" },
] as const;

export const MOODS = [
  { id: "radiant", label: "Radiant", emoji: "🌞" },
  { id: "calm", label: "Calm", emoji: "🌿" },
  { id: "focused", label: "Focused", emoji: "🎯" },
  { id: "grateful", label: "Grateful", emoji: "🙏" },
  { id: "restless", label: "Restless", emoji: "🌀" },
  { id: "heavy", label: "Heavy", emoji: "🌧️" },
  { id: "inspired", label: "Inspired", emoji: "✨" },
] as const;

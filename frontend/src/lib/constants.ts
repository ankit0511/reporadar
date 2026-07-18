export const LANGUAGE_OPTIONS = [
  "JavaScript", "TypeScript", "Python", "Java", "Go", "Rust",
  "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin",
];

export const TOPIC_OPTIONS = [
  "web", "api", "cli", "machine-learning", "data-science", "game-dev",
  "mobile", "devops", "security", "blockchain", "automation", "design",
];

export const EXPERIENCE_LEVELS: { value: "beginner" | "intermediate" | "expert"; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
];

export function describeSearch(search: { q: string; language: string; topic: string; experience: string }): string {
  if (search.q) return `"${search.q}"`;
  const parts = [search.language, search.topic, search.experience].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "All repositories";
}

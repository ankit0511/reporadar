// User types
export interface User {
  _id: string;
  githubId: string;
  userName: string;
  email: string | null;
  avatar: string | null;
  githubToken: string;
  onboardingCompleted: boolean;
  preference: UserPreference;
  createdAt: string;
  updatedAt: string;
}

// User preferences
export interface UserPreference {
  language: string[];
  topic: string[];
  experience: "beginner" | "intermediate" | "expert" | "";
  hasContributed: boolean;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
}

// Preference context type
export interface PreferenceContextType {
  preferences: UserPreference;
  updatePreferences: (prefs: Partial<UserPreference>) => void;
  savePreferences: () => Promise<void>;
  loading: boolean;
}

// Repository, as returned by GET /api/repos/search
export interface Repo {
  id: number;
  name: string;
  owner: string;
  avatarUrl: string | null;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  license: string | null;
  topics: string[];
  updated_at: string;
  created_at: string;
}

export type VisitStatus = "visited" | "starred" | "contributed" | "not_interested";

// A repo the user has clicked through to on GitHub, as returned by
// GET/POST /api/activity/visit*
export interface Visit {
  _id: string;
  repoId: number;
  name: string;
  owner: string;
  url: string;
  language: string;
  stars: number;
  status: VisitStatus;
  visitCount: number;
  firstVisitedAt: string;
  lastVisitedAt: string;
}

// A past search, as returned by GET /api/activity/recent-searches
export interface RecentSearch {
  q: string;
  language: string;
  topic: string;
  experience: string;
  searchedAt: string;
}

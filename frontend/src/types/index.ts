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
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  updated_at: string;
  created_at: string;
}

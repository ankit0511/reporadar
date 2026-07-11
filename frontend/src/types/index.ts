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

// Theme type
export type Theme = "light" | "dark" | "system";

// Auth context type
export interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
}

// Theme context type
export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Preference context type
export interface PreferenceContextType {
  preferences: UserPreference;
  updatePreferences: (prefs: Partial<UserPreference>) => void;
  savePreferences: () => Promise<void>;
  loading: boolean;
}

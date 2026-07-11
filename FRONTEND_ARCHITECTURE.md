# Frontend Architecture Overview

## 🎯 What We Just Built

### Context Files (State Management)

#### 1. **ThemeContext.tsx** ✅
- Manages light/dark theme switching
- Persists theme choice to localStorage
- Detects system theme preference
- Hook: `useTheme()` returns `{ theme, resolvedTheme, setTheme, toggleTheme }`

#### 2. **AuthContext.tsx** ✅
- Manages user authentication state
- Fetches current user on app load via `/api/auth/me`
- Handles logout
- Hook: `useAuth()` returns `{ user, isLoggedIn, loading, logout, setUser }`

#### 3. **PreferenceContext.tsx** ✅
- Manages user preferences (languages, topics, experience, contribution history)
- Saves preferences to backend
- Hook: `usePreference()` returns `{ preferences, updatePreferences, savePreferences, loading }`

### Theme System ✅

**CSS Variables Applied to Document Root:**

```css
Light Theme (default):
  --background: white
  --foreground: black
  --primary: red (#0066ff)
  --border: light-gray
  --card: white

Dark Theme:
  --background: black (#0a0a0a)
  --foreground: white
  --primary: light-red
  --border: dark-gray
  --card: dark (#0a0a0a)
```

**Toggle Method:**
```tsx
const { toggleTheme } = useTheme();

// In HTML: <html data-theme="light"> or <html data-theme="dark">
// Also applies: <html class="dark"> for Tailwind dark mode
```

### API Utilities ✅

**File:** `frontend/src/lib/api.ts`

```tsx
// Simple usage:
import { api } from "@/lib/api";

// GET request
const repos = await api.get("/api/repos/search", { language: "python" });

// POST request
await api.post("/api/preference/123", { language: ["python"] });

// All requests include credentials for auth
```

### TypeScript Types ✅

**File:** `frontend/src/types/index.ts`

Defines:
- `User` interface (from backend)
- `UserPreference` interface
- `Theme` type ("light" | "dark" | "system")
- Context type definitions

---

## 📁 Current Project Structure

```
frontend/src/
├── context/
│   ├── ThemeContext.tsx        ✅ Light/Dark mode
│   ├── AuthContext.tsx         ✅ User auth
│   └── PreferenceContext.tsx   ✅ Preferences
├── lib/
│   └── api.ts                  ✅ API utilities
├── types/
│   └── index.ts                ✅ TypeScript types
├── App.tsx                     ✅ Router + Providers
├── main.tsx                    ✅ Entry point
└── index.css                   ✅ Theme variables + global styles
```

---

## 🔧 How Context Works Together

```
App.tsx
  ↓
ThemeProvider (wraps entire app)
  └─ AuthProvider (fetches user on load)
      └─ PreferenceProvider (loads user prefs)
          └─ Router (page routing)
              └─ All pages/components have access to:
                 • useTheme()
                 • useAuth()
                 • usePreference()
```

---

## 🚀 Next Steps (In Order)

### 1. Install Dependencies (NEXT)
```bash
cd frontend
npm install react-router-dom axios @radix-ui/react-dialog @radix-ui/react-select class-variance-authority clsx tailwind-merge lucide-react
```

### 2. Create `.env.local`
```env
VITE_API_BASE=http://localhost:5000
```

### 3. Create Pages

**Landing.tsx** - Homepage
```tsx
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";

export default function Landing() {
  return (
    <div>
      <Header />
      <Hero />
      <StatsBar />
    </div>
  );
}
```

**Preferences.tsx** - Multi-step form after login
```tsx
// Multi-step form for selecting:
// 1. Languages (checkbox list)
// 2. Topics (checkbox list)
// 3. Experience (radio)
// 4. Contributed before? (radio)
```

**Dashboard.tsx** - After preferences
```tsx
// User profile + search interface
```

### 4. Create Components

**Header.tsx**
```tsx
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Header() {
  const { isLoggedIn, logout } = useAuth();
  const { toggleTheme, resolvedTheme } = useTheme();

  return (
    <header className="flex justify-between items-center p-4">
      <h1>RepoRadar</h1>
      <div>
        <button onClick={toggleTheme}>
          {resolvedTheme === "dark" ? "☀️" : "🌙"}
        </button>
        {isLoggedIn ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <a href="http://localhost:5000/api/auth/github">
            Login with GitHub
          </a>
        )}
      </div>
    </header>
  );
}
```

**Hero.tsx**
```tsx
export function Hero() {
  return (
    <section className="text-center py-20">
      <h1 className="text-5xl font-bold mb-4">
        Find Your Next Open Source Adventure
      </h1>
      <p className="text-xl mb-8">
        Discover repositories that match your skills
      </p>
      <a
        href="http://localhost:5000/api/auth/github"
        className="bg-primary text-white px-6 py-3 rounded"
      >
        Get Started with GitHub
      </a>
    </section>
  );
}
```

**StatsBar.tsx**
```tsx
export function StatsBar() {
  return (
    <section className="grid grid-cols-3 gap-4 p-8">
      <div>330M+ Repos Indexed</div>
      <div>AI-Powered Search</div>
      <div>Beginner Friendly</div>
    </section>
  );
}
```

---

## 💡 Using Contexts in Components

### Using Theme
```tsx
import { useTheme } from "@/context/ThemeContext";

export function MyComponent() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current: {resolvedTheme} (Stored: {theme})
    </button>
  );
}
```

### Using Auth
```tsx
import { useAuth } from "@/context/AuthContext";

export function MyComponent() {
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isLoggedIn ? (
        <p>Welcome, {user?.userName}!</p>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
}
```

### Using Preferences
```tsx
import { usePreference } from "@/context/PreferenceContext";

export function MyComponent() {
  const { preferences, updatePreferences, savePreferences } = usePreference();

  return (
    <div>
      <select
        value={preferences.experience}
        onChange={(e) =>
          updatePreferences({ experience: e.target.value as any })
        }
      >
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="expert">Expert</option>
      </select>
      <button onClick={savePreferences}>Save</button>
    </div>
  );
}
```

---

## 🎨 Theme Usage in Tailwind

```tsx
// Automatic dark mode support:
<div className="bg-background text-foreground">
  <div className="border border-border">
    <button className="bg-primary text-primary-foreground">
      Click me
    </button>
  </div>
</div>

// Theme switches automatically when:
// 1. User clicks theme toggle button
// 2. System theme preference changes
// 3. User refreshes page (remembers choice from localStorage)
```

---

## ✅ Architecture Checklist

- [x] Context files created (Theme, Auth, Preference)
- [x] TypeScript types defined
- [x] Theme system with CSS variables
- [x] API utilities for backend calls
- [x] App.tsx with all providers
- [ ] Dependencies installed
- [ ] Pages created (Landing, Preferences, Dashboard)
- [ ] Components created (Header, Hero, StatsBar, PreferenceForm)
- [ ] Routes setup
- [ ] Test theme switching
- [ ] Test auth flow
- [ ] Test preferences form

---

## 🔗 Integration Points

**AuthContext → Backend:**
- Fetches: `GET /api/auth/me`
- Logout: `POST /api/auth/logout`

**PreferenceContext → Backend:**
- Save: `POST /api/preference/:githubId`

**App Flow:**
1. User visits `/` (Landing)
2. Clicks "Login with GitHub"
3. Redirected to `http://localhost:5000/api/auth/github`
4. After OAuth → Redirected to `/preferences`
5. User fills multi-step form
6. Saved to backend
7. Redirected to `/dashboard`

---

## Ready to Continue?

Run: `npm install` (in frontend folder) with the commands from FRONTEND_SETUP.md

Then we'll create the pages and components! 🚀

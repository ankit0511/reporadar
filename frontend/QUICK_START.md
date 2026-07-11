# Frontend Quick Start Guide

## 📋 Prerequisites

- Node.js v18+ installed
- Backend running on `http://localhost:5000`

---

## 🚀 Step-by-Step Setup

### 1. Install Dependencies

```bash
cd frontend

# Install React Router and other essentials
npm install react-router-dom axios

# Install Radix UI components (for advanced components)
npm install @radix-ui/react-dialog @radix-ui/react-select class-variance-authority clsx tailwind-merge

# Install Icons
npm install lucide-react

# Install Aceternity UI (for Globe and other animations)
npm install aceternity-ui

# Install Framer Motion (required by Aceternity)
npm install framer-motion
```

### 2. Create Environment File

Create `frontend/.env.local`:

```env
VITE_API_BASE=http://localhost:5000
```

### 3. Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:5173**

---

## ✅ What You Should See

1. **Header** at the top with:
   - RepoRadar logo
   - Theme toggle (sun/moon icon)
   - Login with GitHub button

2. **Hero Section** with:
   - Main headline: "Find Your Next Open Source Adventure"
   - Subheading and description
   - "Get Started Free" button
   - Stats row (330M+ Repos, 1000+ Languages, AI Powered)
   - *Right side: Placeholder for Globe (coming next)*

3. **Stats Bar** showing:
   - 330M+ Repositories
   - AI-Powered Search
   - Beginner Friendly

4. **Footer** with:
   - Links and social media
   - Copyright info

---

## 🎨 Files Created

```
frontend/src/
├── components/
│   ├── Header.tsx         ✅ Top navigation with login & theme toggle
│   ├── Hero.tsx           ✅ Hero section with main CTA
│   ├── StatsBar.tsx       ✅ Stats display
│   └── Footer.tsx         ✅ Footer with links
├── pages/
│   ├── Landing.tsx        ✅ Combines all components
│   └── NotFound.tsx       ✅ 404 page
├── context/
│   ├── ThemeContext.tsx   ✅ Theme management
│   ├── AuthContext.tsx    ✅ User auth state
│   └── PreferenceContext.tsx ✅ User preferences
├── lib/
│   └── api.ts             ✅ API utilities
├── types/
│   └── index.ts           ✅ TypeScript types
├── App.tsx                ✅ Routes + Providers
├── main.tsx               ✅ Entry point
└── index.css              ✅ Theme CSS variables
```

---

## 🔧 Features Implemented

✅ **Header Component:**
- Logo with icon
- Theme toggle (Light/Dark/System)
- Login with GitHub button
- User profile display (when logged in)
- Logout button

✅ **Hero Section:**
- Responsive grid layout (1 col mobile, 2 col desktop)
- AI badge
- Main headline + subheading
- CTA buttons (Login or Dashboard link)
- Stats row with numbers

✅ **Stats Bar:**
- 3 columns of stats
- Icons from lucide-react
- Responsive grid

✅ **Footer:**
- Multi-column layout
- Quick links
- Social media buttons
- Copyright

✅ **Theme System:**
- Light/Dark mode toggle
- System preference detection
- localStorage persistence
- Smooth transitions

✅ **Auth Integration:**
- Login with GitHub button links to backend OAuth
- Auto-fetches user on app load
- Shows user avatar when logged in
- Logout functionality

---

## 🎨 Theming

The app automatically switches between light and dark themes:

**Light Theme:**
- White background
- Black text
- Light borders
- Subtle shadows

**Dark Theme:**
- Dark background (#0a0a0a)
- White text
- Dark borders
- Subtle shadows

Toggle with the sun/moon button in the header!

---

## 🚦 Testing the Login Flow

1. Click "Login with GitHub" button
2. You'll be redirected to GitHub for authentication
3. After approving, you'll be redirected back to the app
4. Header should now show your GitHub profile picture
5. Button changes to "Go to Dashboard"

---

## 🌍 Next: Adding Aceternity Globe

The Hero component has a placeholder for the globe on the right side.

To integrate Aceternity Globe:

```tsx
// In Hero.tsx, replace the placeholder div with:
import { Globe } from "@/components/aceternity/globe";

<Globe
  // Globe animation will appear here
/>
```

---

## 🐛 Troubleshooting

### "Cannot find module 'react-router-dom'"
→ Run `npm install react-router-dom`

### Page shows "Coming Soon" instead of Landing
→ Make sure routes are set up in App.tsx

### Theme not switching
→ Check browser localStorage for "theme" key

### Login button doesn't work
→ Make sure backend is running on port 5000

---

## 📱 Responsive Design

- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)

---

## ✨ What's Next

1. Add Aceternity Globe animation to Hero
2. Create Preferences multi-step form (Day 5)
3. Create Dashboard page (Day 5)
4. Add AI recommendations (Day 6)

---

Ready to go? Run:

```bash
npm install && npm run dev
```

You should see the landing page on **http://localhost:5173** 🚀

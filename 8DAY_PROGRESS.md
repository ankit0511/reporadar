# 8-Day Development Sprint Progress

## Timeline Overview

```
Day 1-2: Backend Foundation + Auth
Day 3: GitHub Search + Repos API
Day 4: Frontend Setup + Landing Page
Day 5: Frontend Onboarding + Dashboard
Day 6: AI Recommendations + Integration
Day 7: Testing + Bug Fixes
Day 8: Deployment (Azure) + DevOps
```

---

## Day 1-2: Backend Foundation + Auth ✅ DONE

### Completed:
- ✅ Cleanup: Removed dead code (`routes/user.js`, `modles/` folder)
- ✅ Fixed typos: `preferance.js` → `preference.js`
- ✅ Installed packages: `passport`, `passport-github2`, `express-session`, `cors`
- ✅ Built `config/passport.js` — GitHub OAuth strategy
- ✅ Built `routes/auth.js` — Auth endpoints (login, callback, logout, me)
- ✅ Updated `index.js` — Session + CORS middleware
- ✅ Documentation: `GITHUB_OAUTH_FLOW.md` + `SETUP_GITHUB_AUTH.md`

### Current Status:
Backend auth is **production-ready**. All endpoints are:
- `GET /api/auth/github` — Initiate OAuth
- `GET /api/auth/github/callback` — OAuth callback
- `GET /api/auth/me` — Get current user
- `POST /api/auth/logout` — Logout

Session + database integration working. Ready to test with frontend.

---

## Day 3: GitHub Search + Repos API

### What You'll Build:
- `routes/repos.js` — GitHub API search endpoint
- Endpoint: `GET /api/repos/search?language=python&topic=ml&stars=500`
- Install: `axios` (for GitHub API calls)

### Expected Outcome:
```
Frontend → Backend → GitHub API → Repos with metadata (stars, desc, link, etc.)
```

### Code to Write:
1. Parse query params: `language`, `topic`, `stars`, `limit`, `page`
2. Use user's `githubToken` from `req.user` to make GitHub API calls
3. Return paginated results with repo metadata

---

## Day 4: Frontend Setup + Landing Page

### What You'll Build:
- React project with Vite (already scaffolded)
- Landing page with:
  - Black background + dotted world map (from design)
  - "Login with GitHub" button
  - Hero text + CTAs
  - Stats bar (330M repos, AI-powered, etc.)

### Structure:
```
frontend/src/
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   └── StatsBar.tsx
├── pages/
│   ├── Landing.tsx
│   ├── Dashboard.tsx
│   └── NotFound.tsx
├── App.tsx
└── main.tsx
```

### Dependencies:
- `react-router-dom` (for routing)
- `axios` or `fetch` (for API calls)
- Already has: Tailwind CSS, React

---

## Day 5: Frontend Onboarding + Dashboard

### What You'll Build:
- Onboarding flow (3-4 questions)
  - Languages (multi-select)
  - Topics (multi-select)
  - Experience level (beginner/intermediate/expert)
  - Have you contributed before? (yes/no)
- POST to `/api/preference/:githubId`
- Dashboard page showing logged-in user + personalized feed

### Pages:
- `Onboarding.tsx` — Multi-step form
- `Dashboard.tsx` — Show user + saved preferences + repo feed

---

## Day 6: AI Recommendations + Integration

### What You'll Build:
- `routes/ai.js` — Claude API integration
- Endpoint: `POST /api/ai/query`
- Input: user's natural language query + their preferences
- Output: repo recommendations from Claude or GitHub search

### Backend Logic:
1. User types: "I want to contribute to a beginner-friendly web project"
2. Claude analyzes: language pref, experience level, topics
3. Claude decides: call GitHub API or answer from knowledge
4. Return repos + explanations

### Dependencies:
- `@anthropic-ai/sdk` (Claude API)

---

## Day 7: Testing + Bug Fixes

### Focus:
- Test all endpoints (auth, search, preferences, AI)
- Test full OAuth flow locally
- Frontend ↔ Backend integration
- Handle edge cases (logout, session expiry, rate limits)
- Fix any bugs found

### Testing Checklist:
- [ ] Login with GitHub works
- [ ] Onboarding saves preferences
- [ ] Search returns repos
- [ ] AI query returns recommendations
- [ ] Logout clears session
- [ ] Frontend redirects work
- [ ] CORS works (no cross-origin errors)

---

## Day 8: Deployment (Azure) + DevOps

### What You'll Do:
- Deploy backend to Azure App Service
- Deploy frontend to Azure Static Web Apps (or Vercel)
- Set up environment variables on Azure
- Configure MongoDB connection string (production)
- Update GitHub OAuth callback URL to production domain
- Test entire flow end-to-end on production

### Steps:
1. Create Azure account / resource group
2. Deploy backend (Node.js)
3. Deploy frontend (React build)
4. Connect production database
5. Update env vars
6. Test from production URL

---

## What Comes After Day 8 (If Time Allows)

- Saved repos feature (`models/SavedRepo.js` + endpoints)
- User profile customization
- Search filters UI
- Real testimonials carousel
- Analytics/logging
- Rate limit handling
- Caching strategy

---

## Current Architecture

```
┌─────────────────────┐
│   React Frontend    │
│  (localhost:5173)   │
└──────────┬──────────┘
           │ HTTP + CORS
           ↓
┌─────────────────────────────────────────┐
│      Express Backend                    │
│      (localhost:5000)                   │
├─────────────────────────────────────────┤
│ ✅ Auth Routes (Passport + GitHub OAuth)│
│ ⏳ Repos Routes (GitHub API search)      │
│ ⏳ AI Routes (Claude API)                │
│ ✅ Preference Routes (User prefs)        │
└──────────┬──────────────┬───────────────┘
           │              │
           ↓              ↓
    ┌─────────────┐  ┌──────────────┐
    │  MongoDB    │  │ GitHub API   │
    │             │  │ + Claude API │
    └─────────────┘  └──────────────┘
```

---

## Key Files to Know

**Backend:**
- `src/index.js` — Entry point, middleware setup
- `src/config/db.js` — MongoDB connection
- `src/config/passport.js` — GitHub OAuth config
- `src/models/User.js` — User schema
- `src/routes/auth.js` — Auth endpoints
- `src/routes/preference.js` — User preferences
- `src/routes/repos.js` — GitHub search (TODO)

**Frontend:**
- `src/App.tsx` — Router setup
- `src/pages/Landing.tsx` — Home page
- `src/pages/Dashboard.tsx` — Main app
- `src/pages/Onboarding.tsx` — Setup flow

**Documentation:**
- `GITHUB_OAUTH_FLOW.md` — Auth flow explained
- `SETUP_GITHUB_AUTH.md` — How to test locally
- `8DAY_PROGRESS.md` — This file (timeline)

---

## Milestones

- **End of Day 2:** Backend auth working ✅
- **End of Day 3:** Can search GitHub repos
- **End of Day 5:** Full frontend flow (login → onboard → search)
- **End of Day 7:** All features bug-free
- **End of Day 8:** Live on production

---

## Tips for Staying on Track

1. **Commit often** — Small commits per feature
2. **Test as you go** — Don't save testing for Day 7
3. **Documentation** — Every new file gets a comment explaining its purpose
4. **No over-engineering** — Build what's in scope, save features for v2
5. **Parallel work** — While waiting for backend tests, work on frontend mockups

---

## Questions? Check These Files

1. OAuth flow not clear? → `GITHUB_OAUTH_FLOW.md`
2. How to test auth? → `SETUP_GITHUB_AUTH.md`
3. What's next? → This file (`8DAY_PROGRESS.md`)
4. How should I code it? → Inline comments in the files

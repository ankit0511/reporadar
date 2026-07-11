# GitHub OAuth Implementation Guide

## Overview

This document explains how GitHub OAuth is implemented in RepoRadar, what files were created, and how the authentication flow works.

## Files Created/Modified

### New Files:
- `src/config/passport.js` — Passport strategy configuration
- `src/routes/auth.js` — OAuth endpoints (login, callback, logout, me)
- `.env.example` — Environment variables template

### Modified Files:
- `src/index.js` — Added session and passport middleware
- `src/models/User.js` — Now stores `githubToken` for API calls

---

## GitHub OAuth Flow (Step-by-Step)

```
User Browser                          RepoRadar Backend                    GitHub
     |                                      |                                |
     |------ Click "Login with GitHub" ---->|                                |
     |                                      |                                |
     |                                      |-- passport.authenticate() ---->| Redirect to authorize
     |<-- Redirect to github.com/login ------|                                |
     |                                      |                                |
     |                             [User logs in & approves]                |
     |                                      |                                |
     |<-- Redirect with ?code parameter ----|-- POST code+secret for token --|
     |                                      |<-- accessToken back -----------|
     |                                      |                                |
     |                                      |-- Save user to MongoDB -----|
     |                                      |   with accessToken         |
     |                                      |                            |
     |                                      |-- Create session (req.user)|
     |                                      |                            |
     |<-- Redirect to /dashboard -----------|                            |
     |                                      |                            |
     |-- Load dashboard ------------------>|                            |
     |    (Browser sends session cookie)   |                            |
     |                                      |                            |
     |<-- Dashboard data (req.user populated by session) --|               |
```

---

## Detailed Explanation of Each File

### 1. `src/config/passport.js`

**Purpose:** Configures Passport with GitHub as the OAuth provider.

**Key Parts:**

#### a) GitHub Strategy Setup
```javascript
new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/api/auth/github/callback"
})
```
- `clientID` & `clientSecret`: Credentials from GitHub OAuth app (you registered these)
- `callbackURL`: Where GitHub redirects after user approves

#### b) Verify Callback
```javascript
async (accessToken, refreshToken, profile, done) => {
  const user = await User.findOneAndUpdate(
    { githubId: profile.id },
    { $set: { githubToken: accessToken, ... } },
    { upsert: true }
  );
  return done(null, user);
}
```
- Runs AFTER GitHub returns the user's profile
- `accessToken`: The token we'll use to call GitHub API on behalf of this user
- Finds or creates the user in MongoDB with their GitHub token stored
- `done(null, user)`: Tells Passport "authentication successful"

#### c) Serialize & Deserialize
```javascript
passport.serializeUser((user, done) => {
  done(null, user._id); // Store only the _id in session
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id); // Load full user from _id
  done(null, user);
});
```
- **Serialize**: What gets stored in the session cookie (just the MongoDB `_id`)
- **Deserialize**: How to load the full user from that `_id` on each request
- This way, `req.user` is populated on every request after login

---

### 2. `src/routes/auth.js`

**Purpose:** Exposes the OAuth endpoints and session management.

**Endpoints:**

#### a) `GET /api/auth/github`
```
User clicks "Login with GitHub" button → browser navigates to this endpoint
→ Passport redirects to GitHub's authorize URL
```

#### b) `GET /api/auth/github/callback`
```
GitHub redirects here with ?code parameter
→ Passport exchanges code for accessToken (server-to-server)
→ verify() callback saves the user to MongoDB
→ Session is created (req.user is set)
→ Redirect to frontend dashboard
```

#### c) `GET /api/auth/me`
```
Frontend calls this to get the current logged-in user
Returns: { user: { id, githubId, userName, email, avatar, onboardingCompleted } }
If not logged in: { user: null }
```

#### d) `POST /api/auth/logout`
```
Frontend calls this to log out
Destroys the session and clears the cookie
```

---

### 3. `src/index.js` (Modified)

**What was added:**

#### a) Import session and passport
```javascript
import session from "express-session";
import passport from "./config/passport.js";
```

#### b) CORS Middleware
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true // Allow cookies with requests
}));
```
- Allows frontend (localhost:5173) to make requests to backend (localhost:5000)
- `credentials: true`: Cookies/session sent with requests (essential for auth)

#### c) Session Middleware
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
```
- Creates `req.session` object
- Session data stored on server, session ID sent as cookie to browser
- `httpOnly: true`: Cookie can't be accessed by JavaScript (prevents XSS token theft)
- `maxAge`: Session expires after 7 days

#### d) Passport Middleware
```javascript
app.use(passport.initialize());
app.use(passport.session());
```
- `passport.initialize()`: Initializes Passport
- `passport.session()`: Tells Passport to use sessions (calls deserializeUser on each request)

**Middleware Order Matters:**
1. JSON parsing
2. CORS
3. Session
4. Passport
5. Routes

---

### 4. `.env.example` (Updated)

Lists all required environment variables:

- `GITHUB_CLIENT_ID` — From GitHub OAuth app
- `GITHUB_CLIENT_SECRET` — From GitHub OAuth app (keep secret!)
- `GITHUB_CALLBACK_URL` — Callback URL you entered in GitHub OAuth app
- `SESSION_SECRET` — Random string for signing session cookies
- `MONGO_CONNECTION_STRING` — MongoDB connection
- `CLIENT_URL` — Frontend URL (for CORS and redirects)

---

## How to Test Locally

### 1. Set up environment variables

Copy your credentials into `.env`:
```
GITHUB_CLIENT_ID=<your_client_id>
GITHUB_CLIENT_SECRET=<your_client_secret>
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
SESSION_SECRET=any-random-string-for-testing
MONGO_CONNECTION_STRING=<your_mongo_url>
CLIENT_URL=http://localhost:5173
PORT=5000
```

### 2. Start the backend

```bash
npm run start
# Server runs on http://localhost:5000
```

### 3. Create a test button in frontend

Once frontend is set up, a button that links to `/api/auth/github`:
```html
<a href="http://localhost:5000/api/auth/github">Login with GitHub</a>
```

### 4. After user approves

Backend redirects to `http://localhost:5173/dashboard` with session active.

### 5. Test `/api/auth/me`

Frontend calls `GET /api/auth/me` with credentials:
```javascript
fetch('http://localhost:5000/api/auth/me', { 
  credentials: 'include' // Send the session cookie
})
.then(r => r.json())
.then(data => console.log(data.user)) // Should see the logged-in user
```

---

## Security Considerations

### What's Protected:
- ✅ GitHub secret never sent to browser (stays on server)
- ✅ Session cookie is `httpOnly` (JS can't steal it)
- ✅ Session cookie is signed (can't be tampered with)
- ✅ OAuth state parameter validated by Passport (prevents CSRF attacks)

### What You Need to Do:
- 🔒 Change `SESSION_SECRET` in production (use a random 32+ char string)
- 🔒 Set `GITHUB_CALLBACK_URL` to your actual production domain
- 🔒 Set `secure: true` in session cookie when deployed (HTTPS only)
- 🔒 Never commit `.env` (only `.env.example`)

---

## Common Questions

### Q: Why do we store the GitHub token?
A: So we can call the GitHub API on behalf of the user later (searching repos, getting user's public profile, etc.). Each user's token gives us their own 5,000 req/hour rate limit, not a shared global limit.

### Q: What happens if the user's GitHub token expires?
A: GitHub tokens don't expire unless the user revokes them or you explicitly request a refresh token. We're using the default OAuth flow, which gives us a permanent token.

### Q: How does the frontend know if someone is logged in?
A: Frontend calls `GET /api/auth/me`. If `user` is not null, they're logged in.

### Q: Can I see the session data in the browser?
A: No, sessions are stored server-side. The browser only gets a signed session ID in a cookie. The actual user data is only accessible via `req.user` in your Express routes.

---

## Next Steps

1. Update the User model to accept the `githubToken` field (already done ✓)
2. Build the repos search endpoint (`/api/repos/search`) using GitHub API
3. Build the AI recommendations endpoint using Claude API
4. Build the frontend with React + React Router

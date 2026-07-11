# GitHub OAuth Setup Instructions

## What Was Built

✅ **Passport GitHub OAuth configuration** — `backend/src/config/passport.js`
✅ **Auth routes** (login, callback, logout, me) — `backend/src/routes/auth.js`
✅ **Session + CORS middleware** — `backend/src/index.js` (updated)
✅ **Comprehensive documentation** — `backend/GITHUB_OAUTH_FLOW.md`

**Files created/modified today:**
- `backend/src/config/passport.js` (new)
- `backend/src/routes/auth.js` (new)
- `backend/src/index.js` (updated with session, CORS, passport middleware)
- `backend/.env.example` (updated with all required vars)
- `backend/GITHUB_OAUTH_FLOW.md` (documentation)

---

## Setup Steps

### Step 1: Add credentials to `.env`

You have GitHub OAuth credentials. Update `backend/.env`:

```
NODE_ENV=development
PORT=5000
MONGO_CONNECTION_STRING=<your_mongo_uri>
GITHUB_CLIENT_ID=<paste_here>
GITHUB_CLIENT_SECRET=<paste_here>
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
SESSION_SECRET=dev-secret-key-for-testing
CLIENT_URL=http://localhost:5173
```

### Step 2: Verify packages are installed

```bash
cd backend
npm list passport passport-github2 express-session cors
```

Should see all 4 packages listed. If any are missing:
```bash
npm install passport passport-github2 express-session cors
```

### Step 3: Start the backend

```bash
npm run start
# Should see:
# Mongoose Connected Successfully
# App is running on port 5000
```

---

## How to Test (Before Frontend)

### Test 1: Health check (no login needed)
```bash
curl http://localhost:5000/api/health
# Response: { "status": "ok", "message": "Backend is running fine" }
```

### Test 2: Check if logged in (should return null user)
```bash
curl http://localhost:5000/api/auth/me
# Response: { "user": null }
```

### Test 3: Full OAuth flow (requires browser)

1. Open: `http://localhost:5000/api/auth/github`
2. Redirects to GitHub's authorize page
3. Click "Authorize <your_app_name>"
4. GitHub redirects back to `http://localhost:5173/dashboard` (frontend route, doesn't exist yet, so 404 is expected)
5. Backend session is created ✓

### Test 4: Verify session persists
After step 3, open browser DevTools → Application → Cookies.
You should see a cookie named `connect.sid` (the session ID).

### Test 5: Check logged-in user (with session cookie)
```bash
# In browser console, after logging in:
fetch('http://localhost:5000/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log(d.user))
# Should see: { id: "...", githubId: "...", userName: "...", ... }
```

---

## Common Issues

### Issue: "GITHUB_CLIENT_ID is undefined"
**Fix:** Make sure `.env` file exists and has the variable. Node doesn't auto-load from `.env.example`, only `.env`.

### Issue: "Cannot find module 'passport'"
**Fix:** Run `npm install` in the backend directory.

### Issue: "ECONNREFUSED" when starting server
**Fix:** MongoDB isn't running or connection string is wrong. Check `MONGO_CONNECTION_STRING` in `.env`.

### Issue: Redirect goes to 404 after GitHub approves
**This is expected!** The frontend dashboard route doesn't exist yet. You'll see that 404 because React hasn't been built. The important thing is that the session is created (check DevTools cookies).

---

## What's Next

1. **Frontend setup** — React + React Router with pages for:
   - Landing page (login button)
   - Dashboard (show logged-in user)
   - Onboarding (the 3-4 preference questions)
   - Search page

2. **Repos search endpoint** — `backend/src/routes/repos.js`
   - Use GitHub API to search repos
   - Filter by language, stars, topics
   - Return paginated results

3. **AI recommendations** — `backend/src/routes/ai.js`
   - Accept user query + preferences
   - Call Claude API
   - Return recommendations

---

## Architecture Diagram (Auth Flow)

```
Frontend                    Backend                      GitHub
  |                           |                            |
  |-- Click "Login" --------->|                            |
  |                           |------ /authorize --------->|
  |<-- Redirect to GitHub ----|                            |
  |                           |                            |
  [User approves on GitHub]   |                            |
  |                           |                            |
  |<-- Redirect with code ----|<-- code returned ---------|
  |                           |                            |
  |                           |-- Exchange code for token->|
  |                           |<-- accessToken -----------|
  |                           |                            |
  |                           |-- Save to MongoDB + session---|
  |                           |                            |
  |<-- Redirect /dashboard ---|                            |
  |                           |                            |
```

---

## Files to Review

1. **Read first:** `backend/GITHUB_OAUTH_FLOW.md` (explains the entire flow)
2. **Code:** `backend/src/config/passport.js` (how Passport is configured)
3. **Code:** `backend/src/routes/auth.js` (the endpoints)
4. **Code:** `backend/src/index.js` (middleware setup)

---

## Your GitHub OAuth Credentials Are Safe

- ✅ `CLIENT_ID` can be public (it's in your frontend code anyway)
- ✅ `CLIENT_SECRET` stays in `.env`, never sent to frontend
- ✅ Never commit `.env` to git (already in `.gitignore`)
- ✅ Each GitHub OAuth app can only use its registered `CLIENT_SECRET`

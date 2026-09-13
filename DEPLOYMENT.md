# Deploying RepoRadar

RepoRadar is two deployable pieces plus a database:

| Piece | What it is | Recommended host | Cost |
|---|---|---|---|
| `frontend/` | Vite + React 19 SPA (static files) | **Vercel** | Free |
| `backend/` | Express 5 API, GitHub OAuth sessions | **Render** (Web Service) | Free tier |
| Database | MongoDB (app data + session store) | **MongoDB Atlas** | Free M0 |

The backend **cannot** go on Vercel/Netlify functions as-is: it uses a long-lived
Express server with `express-session` and a Mongo-backed session store. It needs a
real always-on Node process. Render, Railway, and Fly.io all work; steps below use Render.

---

## Order of operations

There is a circular dependency: the backend needs the frontend's URL (`CLIENT_URL`)
and the frontend needs the backend's URL (`VITE_API_BASE`). So:

1. Database → 2. Backend (with a placeholder `CLIENT_URL`) → 3. Frontend →
4. Go back and fix `CLIENT_URL` + the GitHub OAuth callback.

---

## 1. MongoDB Atlas

1. Create a free **M0** cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a user with a password (avoid `@ : / ?` in it, or URL-encode them).
3. **Network Access** → add `0.0.0.0/0`. Render's free tier has no static outbound IP,
   so allowlisting a single IP will not work.
4. Copy the connection string (`mongodb+srv://...`). The app forces `dbName: "reporadar"`
   in code, so you don't need a database name in the URI.

## 2. Backend on Render

1. Push this repo to GitHub, then on <https://render.com> → **New → Web Service** → pick the repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Add environment variables (see `backend/.env.example`):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGO_CONNECTION_STRING` | from step 1 |
   | `SESSION_SECRET` | long random string — `openssl rand -hex 32` |
   | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | from step 4 |
   | `GITHUB_CALLBACK_URL` | `https://<your-api>.onrender.com/api/auth/github/callback` |
   | `CLIENT_URL` | placeholder for now, e.g. `http://localhost:5173` |
   | `GEMINI_API_KEY` | <https://aistudio.google.com/apikey> |

   Do **not** set `PORT` — Render injects it, and the code already reads `process.env.PORT`.

4. Deploy, then confirm: `https://<your-api>.onrender.com/api/health` returns
   `{"status":"ok", ...}`.

## 3. Frontend on Vercel

1. <https://vercel.com> → **Add New → Project** → same repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (build `npm run build`, output `dist`)
3. Environment variable:
   - `VITE_API_BASE` = `https://<your-api>.onrender.com` — **no trailing slash**.
     This is baked in at build time, so changing it later requires a redeploy.
4. Deploy. `frontend/vercel.json` already rewrites all routes to `index.html`, so
   React Router deep links survive a hard refresh.

## 4. GitHub OAuth App

<https://github.com/settings/developers> → **New OAuth App**:

- **Homepage URL:** `https://<your-app>.vercel.app`
- **Authorization callback URL:** `https://<your-api>.onrender.com/api/auth/github/callback`

This must match `GITHUB_CALLBACK_URL` **character for character**, or GitHub returns
`redirect_uri_mismatch`. Note it points at the *backend*, not the frontend.

## 5. Close the loop

Back in Render, set `CLIENT_URL` to `https://<your-app>.vercel.app` (no trailing slash)
and redeploy. This one variable drives both CORS and the post-login redirect — a wrong
value here is the single most common cause of "login spins and does nothing".

---

## Verifying

1. `GET /api/health` on the backend → `{"status":"ok"}`.
2. Open the frontend, click **Login with GitHub**, approve.
3. You should land back on the frontend home page, logged in.
4. Hard-refresh — you should stay logged in (proves the session cookie survives).

## Troubleshooting

| Symptom | Cause |
|---|---|
| `redirect_uri_mismatch` | GitHub OAuth App callback ≠ `GITHUB_CALLBACK_URL` |
| CORS error in console | `CLIENT_URL` doesn't exactly match the frontend origin (trailing slash, `http` vs `https`, `www`) |
| Login redirects back but user is null | Session cookie dropped. Requires `NODE_ENV=production` so the cookie is sent `Secure` + `SameSite=None`. Both sides must be HTTPS. |
| Calls still hit `localhost:5000` | `VITE_API_BASE` missing at **build** time — set it in Vercel, then redeploy |
| First request after idle takes ~50s | Render free tier cold start. Expected; upgrade or ping to keep warm. |
| `FATAL: SESSION_SECRET must be set` | Add `SESSION_SECRET` in Render |

## Custom domain (e.g. `reporadar.co.in`)

### Recommended layout

| Host | Serves | Points at |
|---|---|---|
| `reporadar.co.in` | frontend | Vercel |
| `www.reporadar.co.in` | redirect to apex | Vercel |
| `api.reporadar.co.in` | backend API | Render |

Putting the API on a **subdomain of the same parent domain** is the reason to prefer this
layout: `reporadar.co.in` and `api.reporadar.co.in` are *same-site*, so the login cookie
stops being a cross-site cookie and browsers (especially Safari and iOS, which are
aggressive about blocking third-party cookies) stop treating it as third-party. The
`SameSite=None` setting in `src/index.js` keeps working either way — this just makes it
far more robust.

Avoid putting the API on a *different* registrable domain than the frontend. That is the
setup most likely to break logins in privacy-hardened browsers.

### 1. Buy the domain

`.co.in` is an Indian TLD, typically ₹300–800/year. Any of these work:

- **Cloudflare Registrar** — cheapest (at-cost), best DNS, but check `.co.in` availability;
  its TLD list is limited.
- **Namecheap** / **Porkbun** — good pricing, clean DNS UI.
- **Hostinger** / **BigRock** — Indian registrars, reliable for `.co.in`, but watch the
  renewal price: the first year is often a loss-leader.

Buy *only* the domain. You do not need their hosting, email, or "website builder" upsells —
Vercel and Render are doing the hosting.

> Tip: whichever registrar you pick, consider pointing the nameservers at **Cloudflare** (free)
> and managing DNS there. Propagation is near-instant and the UI is much better than most
> registrars'.

### 2. Frontend → Vercel

In Vercel: **Project → Settings → Domains → Add** `reporadar.co.in` (add `www` too; Vercel
will offer to redirect one to the other — point `www` at the apex).

Vercel then shows the exact DNS records to create. **Use the values Vercel displays**, not
values copied from a blog post — they change. Currently they look like:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Add those at your registrar (or in Cloudflare). If you use Cloudflare, set the proxy status
to **DNS only** (grey cloud) for these records — Vercel issues its own certificate, and
Cloudflare's orange-cloud proxy on top of it can cause redirect loops.

### 3. Backend → Render

In Render: **Service → Settings → Custom Domains → Add** `api.reporadar.co.in`.

Render gives you a `CNAME` target:

| Type | Name | Value |
|---|---|---|
| `CNAME` | `api` | `<your-service>.onrender.com` |

Custom domains on Render require a paid instance on some plans — check your plan before
relying on this. If you stay on the free tier, keep using the `.onrender.com` URL for the
API and only put the frontend on the custom domain (the cookie is then cross-site again,
so `SameSite=None` is doing real work).

Wait for both hosts to report the certificate as **issued** before continuing. This is
usually a few minutes, occasionally up to an hour.

### 4. Update the environment to match

This is the step people forget — DNS alone does not finish the job. Every URL below must
be updated **and** both services redeployed.

**Render** (backend):

```
CLIENT_URL=https://reporadar.co.in
GITHUB_CALLBACK_URL=https://api.reporadar.co.in/api/auth/github/callback
```

**Vercel** (frontend) — then **redeploy**, since this is baked in at build time:

```
VITE_API_BASE=https://api.reporadar.co.in
```

**GitHub OAuth App** (<https://github.com/settings/developers>):

- Homepage URL → `https://reporadar.co.in`
- Authorization callback URL → `https://api.reporadar.co.in/api/auth/github/callback`

The callback must match `GITHUB_CALLBACK_URL` character for character. If you want the old
`.onrender.com` URL to keep working during the switchover, register a *second* OAuth App
rather than trying to put two callback URLs on one — GitHub allows only one.

Pick one canonical origin and use it everywhere: `https://reporadar.co.in`, no `www`, no
trailing slash. A `CLIENT_URL` of `https://www.reporadar.co.in` while the user is actually
on `https://reporadar.co.in` is a CORS failure.

### 5. Verify

1. `https://api.reporadar.co.in/api/health` → `{"status":"ok"}`
2. `https://reporadar.co.in` loads, and DevTools → Network shows calls going to
   `api.reporadar.co.in` (not `localhost`, not `.onrender.com`).
3. Log in with GitHub → lands back on `reporadar.co.in`, logged in.
4. Hard-refresh → still logged in.
5. Try it in Safari or an iPhone too — that is where cookie problems show up first.

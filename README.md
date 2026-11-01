# StudioSpace — Server (Express + MongoDB)

Backend for **StudioSpace**, a peer-to-peer creative workspace and production studio sharing platform. It serves the studio catalog, JWT cookie authentication, bookings with server-side double-booking prevention, and a saved-studios wishlist.

**Live API:** <placeholder-vercel-url> · Shared database: `studiospaceDB` (MongoDB Atlas or local)

## Tech stack
- Express 5 (JavaScript)
- MongoDB native driver (`mongodb` v6)
- jsonwebtoken (JWT, httpOnly cookie `token`)
- cookie-parser, cors (credentials), dotenv
- seed.js — 12 curated studios across the 5 platform categories

## API

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/` | — | Health check (text) |
| GET | `/health` | — | OK + platform category list |
| POST | `/jwt` | — | Body `{email}` → signs 7-day JWT into httpOnly cookie `token` |
| POST | `/logout` | — | Clears the token cookie |
| GET | `/studios` | — | `search` (title/location, case-insensitive), `category`, `sort` (`priceLow`/`priceHigh`/`rating`/`newest`), `limit` |
| GET | `/studios/:id` | — | Single studio, 404 for bad/missing ids |
| POST | `/studios` | JWT | Create studio (owner email must match token) |
| GET | `/my-studios?email=` | JWT | Token email must match `email` param, else 403 |
| PATCH | `/studios/:id` | JWT | Owner-only update |
| DELETE | `/studios/:id` | JWT | Owner-only delete (also cleans bookings/wishlist) |
| POST | `/bookings` | JWT | **409 on overlapping Pending/Confirmed slot** (same studio, same day, `newStart < existingEnd && newEnd > existingStart`) |
| GET | `/bookings?email=` | JWT | Customer's own bookings |
| GET | `/bookings/owner?email=` | JWT | Host inbox: every booking made against studios the token email owns |
| PATCH | `/bookings/:id/status` | JWT | Host-only lifecycle advance: `Pending → Confirmed → Completed` (strict; other jumps → 409) |
| PATCH | `/bookings/:id/cancel` | JWT | Customer-only, and only while `Pending` |
| POST | `/wishlist` | JWT | Save a studio |
| GET | `/wishlist?email=` | JWT | List saved studios |
| DELETE | `/wishlist/:id` | JWT | Remove saved studio |

Missing/invalid token on a protected route → `401 { "message": "Unauthorized access" }`.

## Local setup

```bash
cd studiospace-server
npm install
cp .env.example .env        # fill in ACCESS_TOKEN_SECRET etc.
npm run seed                # optional: 12 demo studios
npm start                   # http://localhost:5001
# or: npm run dev (nodemon)
```

Smoke tests: `bash scripts/test.sh http://localhost:5001`

## Environment (see `.env.example`)

| Key | Purpose |
|---|---|
| `PORT` | Server port (5000 conflicted with macOS AirPlay locally; using 5001) |
| `MONGODB_URI` | Atlas connection string or `mongodb://127.0.0.1:27017` |
| `DB_NAME` | `studiospaceDB` |
| `ACCESS_TOKEN_SECRET` | JWT signing secret |
| `CLIENT_URL` | Comma-separated allowed origins with credentials |
| `NODE_ENV` | `production` → cookie `Secure; SameSite=None` (cross-origin), dev → `Lax` |

## 🚀 Deployment (Vercel)

The API is a long-running Express app locally, and a Vercel serverless function in production — same router code, two entries:

| File | Role |
|---|---|
| `app.js` | Builds the Express app (shared) |
| `index.js` | Local bootstrap: connects MongoDB, `app.listen(PORT)` |
| `api/index.js` | Vercel entry: exports the same app |
| `vercel.json` | Rewrites every path to `/api` so `/studios`, `/bookings`, … keep working |

Steps:

1. Vercel → **New Project** → import this repo. Framework preset: **Other** (no build step; Vercel picks up `api/index.js` automatically).
2. Add the environment variables in *Project → Settings → Environment Variables*:
   - `MONGODB_URI` — Atlas connection string
   - `DB_NAME` — `studiospaceDB`
   - `ACCESS_TOKEN_SECRET` — long random string (`openssl rand -hex 32`)
   - `CLIENT_URL` — the deployed client origin, exactly, e.g. `https://studiospace-client.vercel.app`
   - `NODE_ENV` — `production` (usually preset by Vercel)
3. Deploy, then smoke test: `curl https://<service>.vercel.app/health` and `bash scripts/test.sh https://<service>.vercel.app`.
4. Run `npm run seed` once locally against the same Atlas database if the catalog is empty.

Because production serves the client and API on different origins, the JWT cookie is issued `Secure; SameSite=None` — HTTPS only, and `CLIENT_URL` must exactly match the client origin (no trailing slash). Serverless functions open a fresh MongoDB connection per cold instance; `lib/db.js` caches it per warm instance.

## Deploy

- **Vercel:** `vercel.json` is included; set the env variables above in the project settings.
- **Render / Railway:** start command `npm start`.
- In production set `MONGODB_URI` to your Atlas SRV string, `CLIENT_URL` to your deployed client URL(s) and a strong `ACCESS_TOKEN_SECRET`.

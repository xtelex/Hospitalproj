# Hospital Project

Monorepo containing:

- `Frontend/` (Vite + React)
- `Backend/` (Node/Express)

## Quick start

Frontend:

```bash
cd Frontend
npm install
npm run dev
```

Backend:

```bash
cd Backend
npm install
npm run dev
```

## Deploy

### Frontend (GitHub Pages via Actions)

This repo includes a GitHub Actions workflow that builds `Frontend/` and deploys it to GitHub Pages.

1. Push to GitHub (branch: `main`).
2. In GitHub repo → **Settings → Pages**:
   - **Build and deployment** → **Source**: `GitHub Actions`
3. In GitHub repo → **Settings → Secrets and variables → Actions → Variables**, set:
   - `VITE_API_BASE_URL` = `https://<your-backend-domain>/api`
   - (optional) `VITE_FIREBASE_*` variables (see `Frontend/.env.example`)

The site will be available at:
`https://<username>.github.io/<repo>/`

### Frontend (Vercel)

Vercel works well for Vite + React deployments and does not require GitHub Pages/Actions.

In Vercel:

1. **New Project** → select your repo (or deploy via CLI).
2. Set **Root Directory**: `Frontend`
3. Build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables (Project → Settings → Environment Variables):
   - `VITE_API_BASE_URL` = `https://<your-backend-domain>/api`
   - (optional) `VITE_FIREBASE_*` variables (see `Frontend/.env.example`)

This repo includes `Frontend/vercel.json` to make React Router routes work on refresh.

### Backend (needs a host)

GitHub Pages cannot run an Express server. Deploy `Backend/` to a Node host (Render/Railway/etc) and set env vars there:

- `PAYMONGO_SECRET_KEY`
- `FRONTEND_URL` (your GitHub Pages URL)
- (optional for webhooks) `PAYMONGO_WEBHOOK_SECRET`

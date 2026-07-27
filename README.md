# MILEPOST Dashboard — Vercel + Postgres version

This is the same dashboard you've been using inside Claude, rebuilt to run standalone with a
real database instead of Claude's artifact storage. Nothing about the dashboard itself changed —
Tracker, Archive, Summary, Team Load, Settings, CSV import/export, sorting, filters, the whole
thing — it's the exact same file. The only thing that changed is *where the data lives*: instead
of `window.storage` (which only exists inside a Claude artifact), it now talks to two small API
routes backed by a Postgres table.

## What's in this project
```
app/
  page.js                    -> redirects "/" to the dashboard
  layout.js                  -> minimal Next.js shell
  api/storage/list/route.js  -> GET  /api/storage/list?prefix=...
  api/storage/get/route.js   -> GET  /api/storage/get?key=...
  api/storage/set/route.js   -> POST /api/storage/set
  api/storage/delete/route.js-> POST /api/storage/delete
lib/db.js                    -> creates the one database table on first use (idempotent)
public/dashboard.html        -> the actual dashboard (unchanged, plus a small storage shim)
```

The whole app is one Postgres table, `kv_store` (key, value, updated_at) — it stores the exact
same keys the dashboard always used (`milepost:project:<id>`, `milepost:rules`,
`milepost:history`). You don't need to run any SQL by hand; the first API call creates the table
automatically.

## Step 1 — Push this to a NEW GitHub repo (separate from BA Workbench)

```bash
cd milepost-vercel
git init
git add .
git commit -m "Initial commit — MILEPOST dashboard"
```

Then on GitHub: create a **new, empty repository** (e.g. `milepost-dashboard`) — do not reuse
whatever repo powers BA Workbench. Then:

```bash
git remote add origin https://github.com/<your-username>/milepost-dashboard.git
git branch -M main
git push -u origin main
```

## Step 2 — Create a new database (isolated from BA Workbench)

1. In the Vercel dashboard, go to **Storage** → **Create Database** → **Postgres**.
2. Give it its own name, e.g. `milepost-db`. This is a completely separate database from
   anything BA Workbench uses — nothing here can touch that project's data.
3. Don't connect it to any project yet — you'll do that in Step 3.

## Step 3 — Import as a brand-new Vercel project

1. Vercel dashboard → **Add New** → **Project**.
2. Import the `milepost-dashboard` GitHub repo you just pushed.
3. Vercel will auto-detect Next.js. Click **Deploy** — it's fine if this first deploy has no
   database connected yet; you'll add that next and redeploy.
4. Once created, this shows up as its **own separate project** in your Vercel dashboard,
   alongside BA Workbench, with its own name/domain/settings. They do not share anything by
   default.

## Step 4 — Connect the database to THIS project only

1. Open the new `milepost-dashboard` project in Vercel → **Storage** tab.
2. Connect the `milepost-db` database you created in Step 2 to this project.
   Vercel will automatically add the required `POSTGRES_URL` (and related) environment
   variables to this project — and only this project.
3. Go to **Deployments** → redeploy (or just push any small commit) so the new env vars take
   effect.

## Step 5 — Verify isolation, then verify the app

1. In your Vercel dashboard project list, confirm you now see **two separate projects**:
   BA Workbench and milepost-dashboard.
2. Open BA Workbench's live URL and confirm it still works exactly as before — this is the
   proof that nothing was touched.
3. Open the new project's URL (e.g. `https://milepost-dashboard.vercel.app`) — it should
   redirect to the dashboard and seed the initial demo data on first load, exactly like the
   Claude artifact did.

## Local development (optional)

```bash
npm install
vercel env pull .env.local   # pulls the POSTGRES_URL etc. from your Vercel project
npm run dev
```
Then open http://localhost:3000.

## Notes

- This app has **no login/authentication** — anyone with the URL can see and edit the data,
  same as the shared-storage behavior in the Claude version. Don't put this on a domain you
  don't want publicly writable. Adding real auth (e.g. Vercel's own auth, or a simple password
  gate) is a reasonable next step if this needs to be locked down.
- The retry/backoff logic already built into the dashboard (for transient storage errors) is
  still there and still useful — Postgres over a network can still hiccup occasionally, same as
  any hosted database.
- If you ever want to wipe all data and start fresh, just delete all rows from the `kv_store`
  table (via Vercel's Postgres query UI) — the app will reseed itself on the next load, exactly
  like it did the first time.

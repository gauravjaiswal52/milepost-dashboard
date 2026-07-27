import { neon } from '@neondatabase/serverless';

// Using Neon's own driver directly (rather than @vercel/postgres) — that package makes
// assumptions tied to Vercel's now-retired native Postgres product that don't hold up cleanly
// against a Neon-marketplace DATABASE_URL. neon(connectionString) is Neon's documented, stable
// way to get a tagged-template `sql` function bound to a specific connection string, with no
// ambiguity about pools/clients/env-var name-matching.
// fullResults:true makes this return { rows, fields, ... } like node-postgres/@vercel/postgres,
// instead of Neon's default of a bare array — matching what all four route.js files already
// expect (`const { rows } = await sql...`), so nothing else has to change.
export const sql = neon(process.env.DATABASE_URL, { fullResults: true });

// One flat key-value table backs everything the dashboard stores: each project, the combined
// stage-rules blob, and the combined blocker-history blob — the exact same keys the app already
// uses (milepost:project:<id>, milepost:rules, milepost:history). Creating the table is
// idempotent, so it's safe to call on every request rather than requiring a separate manual
// setup step.
export async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS kv_store (
      store_key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

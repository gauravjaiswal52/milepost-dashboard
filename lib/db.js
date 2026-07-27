import { createPool } from '@vercel/postgres';

// Neon's Vercel integration names the connection string DATABASE_URL, not the POSTGRES_URL
// that @vercel/postgres looks for by default — so we point at it explicitly here rather than
// relying on name-matching. This is the one place the connection is created; every API route
// imports `sql` from this file instead of from '@vercel/postgres' directly.
const pool = createPool({ connectionString: process.env.DATABASE_URL });
export const sql = pool.sql;

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

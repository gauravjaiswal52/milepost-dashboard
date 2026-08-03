import { sql, ensureTable } from '../../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Explicit no-store headers on every response — the exports above stop NEXT.JS's own internal
// caching, but Vercel's edge network can still cache a GET response by URL at the HTTP layer
// unless the response itself says not to. This closes that gap.
function noCacheJson(body, init) {
  return Response.json(body, {
    ...init,
    headers: { ...(init && init.headers), 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  });
}

// Fetches many keys in ONE database round-trip instead of one HTTP request per key. This is the
// single biggest lever for keeping a free hosting tier's function-invocation count down: loading
// N projects used to mean N separate serverless invocations every time the app refreshed (every
// 20 seconds, per open browser tab) — this collapses that to one.
export async function POST(request) {
  try {
    await ensureTable();
    const { keys } = await request.json();
    if (!Array.isArray(keys) || keys.length === 0) return noCacheJson({ values: {} });
    const { rows } = await sql`SELECT store_key, value FROM kv_store WHERE store_key = ANY(${keys})`;
    const values = {};
    rows.forEach(r => { values[r.store_key] = r.value; });
    return noCacheJson({ values });
  } catch (e) {
    console.error('getmany failed', e);
    return noCacheJson({ error: 'Storage getmany failed: ' + e.message }, { status: 500 });
  }
}

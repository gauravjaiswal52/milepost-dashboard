import { sql } from '../../../../lib/db';

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

export async function GET(request) {
  try {
    // Table is created once (see the /set route) — skipping the existence check here on the
    // highest-frequency paths avoids an extra query on every single read.
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return noCacheJson({ error: 'Missing key' }, { status: 400 });
    const { rows } = await sql`SELECT value FROM kv_store WHERE store_key = ${key}`;
    if (rows.length === 0) return noCacheJson({ value: null });
    return noCacheJson({ value: rows[0].value });
  } catch (e) {
    console.error('get failed', e);
    return noCacheJson({ error: 'Storage get failed: ' + e.message }, { status: 500 });
  }
}

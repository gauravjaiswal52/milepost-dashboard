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
    const prefix = searchParams.get('prefix') || '';
    const { rows } = await sql`
      SELECT store_key FROM kv_store WHERE store_key LIKE ${prefix + '%'} ORDER BY store_key ASC
    `;
    return noCacheJson({ keys: rows.map(r => r.store_key) });
  } catch (e) {
    console.error('list failed', e);
    return noCacheJson({ error: 'Storage list failed: ' + e.message }, { status: 500 });
  }
}

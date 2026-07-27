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

export async function POST(request) {
  try {
    await ensureTable();
    const { key, value } = await request.json();
    if (!key) return noCacheJson({ error: 'Missing key' }, { status: 400 });
    await sql`
      INSERT INTO kv_store (store_key, value, updated_at)
      VALUES (${key}, ${value}, now())
      ON CONFLICT (store_key) DO UPDATE SET value = ${value}, updated_at = now()
    `;
    return noCacheJson({ ok: true });
  } catch (e) {
    console.error('set failed', e);
    return noCacheJson({ error: 'Storage set failed: ' + e.message }, { status: 500 });
  }
}

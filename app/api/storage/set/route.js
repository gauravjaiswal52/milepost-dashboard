import { sql, ensureTable } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await ensureTable();
    const { key, value } = await request.json();
    if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });
    await sql`
      INSERT INTO kv_store (store_key, value, updated_at)
      VALUES (${key}, ${value}, now())
      ON CONFLICT (store_key) DO UPDATE SET value = ${value}, updated_at = now()
    `;
    return Response.json({ ok: true });
  } catch (e) {
    console.error('set failed', e);
    return Response.json({ error: 'Storage set failed: ' + e.message }, { status: 500 });
  }
}

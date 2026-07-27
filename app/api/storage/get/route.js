import { sql } from '@vercel/postgres';
import { ensureTable } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });
    const { rows } = await sql`SELECT value FROM kv_store WHERE store_key = ${key}`;
    if (rows.length === 0) return Response.json({ value: null });
    return Response.json({ value: rows[0].value });
  } catch (e) {
    console.error('get failed', e);
    return Response.json({ error: 'Storage get failed: ' + e.message }, { status: 500 });
  }
}

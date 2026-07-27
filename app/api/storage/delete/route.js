import { sql } from '@vercel/postgres';
import { ensureTable } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await ensureTable();
    const { key } = await request.json();
    if (!key) return Response.json({ error: 'Missing key' }, { status: 400 });
    await sql`DELETE FROM kv_store WHERE store_key = ${key}`;
    return Response.json({ ok: true });
  } catch (e) {
    console.error('delete failed', e);
    return Response.json({ error: 'Storage delete failed: ' + e.message }, { status: 500 });
  }
}

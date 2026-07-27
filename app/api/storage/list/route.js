import { sql, ensureTable } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    const { rows } = await sql`
      SELECT store_key FROM kv_store WHERE store_key LIKE ${prefix + '%'}
    `;
    return Response.json({ keys: rows.map(r => r.store_key) });
  } catch (e) {
    console.error('list failed', e);
    return Response.json({ error: 'Storage list failed: ' + e.message }, { status: 500 });
  }
}

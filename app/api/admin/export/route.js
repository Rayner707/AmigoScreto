import { NextResponse } from 'next/server';
import { listTokens } from '@/lib/store';

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

export async function GET(req) {
  const provided = req.headers.get('x-admin-secret') || '';
  if (!ADMIN_SECRET || provided !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const origin = process.env.PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
  const rows = (await listTokens()).map((row) => ({
    name: row.giver,
    token: row.token,
    claimed: row.claimed,
    url: `${origin}/?t=${row.token}`
  }));

  return NextResponse.json({ participants: rows });
}

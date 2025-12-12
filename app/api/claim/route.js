import { NextResponse } from 'next/server';
import { claimAssignment } from '@/lib/store';

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, name } = body || {};

    const result = await claimAssignment(token, name);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      receiver: result.receiver,
      giver: result.giver,
      alreadyClaimed: result.alreadyClaimed
    });
  } catch (err) {
    return NextResponse.json({ error: 'Error al procesar la solicitud.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { rows } = await sql`SELECT value FROM settings WHERE key = 'dietary_notes'`;
  return NextResponse.json({ dietary_notes: rows[0]?.value ?? '' });
}

export async function PUT(req: NextRequest) {
  const { dietary_notes } = await req.json();
  await sql`
    INSERT INTO settings (key, value) VALUES ('dietary_notes', ${dietary_notes ?? ''})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  const { rating, notes } = await req.json();
  const { rows } = await sql`
    UPDATE meal_history
    SET rating = COALESCE(${rating ?? null}, rating),
        notes  = COALESCE(${notes ?? null}, notes)
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ entry: rows[0] });
}

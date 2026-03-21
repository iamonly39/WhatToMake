import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  const { rows: mealRows } = await sql`
    SELECT m.*,
           ROUND(AVG(h.rating)::numeric, 1) AS avg_rating
    FROM meals m
    LEFT JOIN meal_history h ON h.meal_id = m.id
    WHERE m.id = ${id}
    GROUP BY m.id
  `;
  if (!mealRows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rows: history } = await sql`
    SELECT * FROM meal_history
    WHERE meal_id = ${id}
    ORDER BY made_on DESC
  `;
  return NextResponse.json({ meal: mealRows[0], history });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  const { name, category, notes, source_url } = await req.json();
  const { rows } = await sql`
    UPDATE meals
    SET name       = COALESCE(${name ?? null}, name),
        category   = COALESCE(${category ?? null}, category),
        notes      = COALESCE(${notes ?? null}, notes),
        source_url = COALESCE(${source_url ?? null}, source_url)
    WHERE id = ${id}
    RETURNING *
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ meal: rows[0] });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  await sql`DELETE FROM meals WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

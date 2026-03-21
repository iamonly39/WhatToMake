export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { rows } = await sql`
    SELECT m.*,
           ROUND(AVG(h.rating)::numeric, 1) AS avg_rating
    FROM meals m
    LEFT JOIN meal_history h ON h.meal_id = m.id
    GROUP BY m.id
    ORDER BY m.name ASC
  `;
  return NextResponse.json({ meals: rows });
}

export async function POST(req: NextRequest) {
  const { name, category = 'other', notes, source_url } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  const { rows } = await sql`
    INSERT INTO meals (name, category, notes, source_url)
    VALUES (${name.trim()}, ${category}, ${notes ?? null}, ${source_url ?? null})
    RETURNING *
  `;
  return NextResponse.json({ meal: rows[0] }, { status: 201 });
}

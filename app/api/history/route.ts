export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { today } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const mealId = req.nextUrl.searchParams.get('meal_id');
  const { rows } = mealId
    ? await sql`
        SELECT h.*, m.name AS meal_name
        FROM meal_history h
        JOIN meals m ON m.id = h.meal_id
        WHERE h.meal_id = ${Number(mealId)}
        ORDER BY h.made_on DESC`
    : await sql`
        SELECT h.*, m.name AS meal_name
        FROM meal_history h
        JOIN meals m ON m.id = h.meal_id
        ORDER BY h.made_on DESC`;
  return NextResponse.json({ history: rows });
}

export async function POST(req: NextRequest) {
  const { meal_id, made_on, notes } = await req.json();
  if (!meal_id) return NextResponse.json({ error: 'meal_id required' }, { status: 400 });
  const date = made_on ?? today();
  const { rows } = await sql`
    INSERT INTO meal_history (meal_id, made_on, notes)
    VALUES (${meal_id}, ${date}, ${notes ?? null})
    RETURNING *
  `;
  return NextResponse.json({ entry: rows[0] }, { status: 201 });
}

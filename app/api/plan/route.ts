export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentWeekSaturday } from '@/lib/dates';

export async function GET() {
  const weekOf = getCurrentWeekSaturday();
  const { rows } = await sql`
    SELECT * FROM weekly_plans WHERE week_of = ${weekOf}
  `;
  if (!rows[0]) return NextResponse.json({ plan: null });

  const plan = rows[0];
  const mealIds: number[] = plan.meal_ids;

  if (mealIds.length > 0) {
    const idList = mealIds.join(',');
    const { rows: meals } = await sql.query(
      `SELECT m.*, ROUND(AVG(h.rating)::numeric, 1) AS avg_rating
       FROM meals m
       LEFT JOIN meal_history h ON h.meal_id = m.id
       WHERE m.id = ANY(ARRAY[${idList}]::int[])
       GROUP BY m.id`
    );
    // Preserve the order of meal_ids
    plan.meals = mealIds.map((id: number) => meals.find((m) => m.id === id)).filter(Boolean);
  } else {
    plan.meals = [];
  }

  return NextResponse.json({ plan });
}

export async function POST(req: NextRequest) {
  const { week_of, meal_ids } = await req.json();
  const weekOf = week_of ?? getCurrentWeekSaturday();
  const { rows } = await sql`
    INSERT INTO weekly_plans (week_of, meal_ids)
    VALUES (${weekOf}, ${meal_ids}::int[])
    ON CONFLICT (week_of) DO UPDATE SET meal_ids = EXCLUDED.meal_ids
    RETURNING *
  `;
  return NextResponse.json({ plan: rows[0] });
}

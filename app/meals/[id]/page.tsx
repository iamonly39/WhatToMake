import { sql } from '@/lib/db';
import type { Meal, HistoryEntry } from '@/lib/db';
import { notFound } from 'next/navigation';
import MealDetailClient from './MealDetailClient';

export default async function MealDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { rows: mealRows } = await sql`
    SELECT m.*, ROUND(AVG(h.rating)::numeric, 1) AS avg_rating
    FROM meals m
    LEFT JOIN meal_history h ON h.meal_id = m.id
    WHERE m.id = ${id}
    GROUP BY m.id
  `;
  if (!mealRows[0]) notFound();

  const { rows: history } = await sql`
    SELECT * FROM meal_history WHERE meal_id = ${id} ORDER BY made_on DESC
  `;

  return (
    <MealDetailClient
      meal={mealRows[0] as Meal & { avg_rating: number | null }}
      history={history as HistoryEntry[]}
    />
  );
}

export const dynamic = 'force-dynamic';

import { sql } from '@/lib/db';
import type { Meal } from '@/lib/db';
import MealCard from '@/components/MealCard';
import FloatingAddButton from '@/components/FloatingAddButton';

export default async function MealsPage() {
  const { rows } = await sql`
    SELECT m.*, ROUND(AVG(h.rating)::numeric, 1) AS avg_rating
    FROM meals m
    LEFT JOIN meal_history h ON h.meal_id = m.id
    GROUP BY m.id
    ORDER BY m.name ASC
  `;
  const meals = rows as (Meal & { avg_rating: number | null })[];

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900">Meal Library</h1>
      {meals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium">No meals yet.</p>
          <p className="text-sm">Tap + to add your first meal.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      )}
      <FloatingAddButton />
    </div>
  );
}

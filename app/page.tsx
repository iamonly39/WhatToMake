export const dynamic = 'force-dynamic';

import { sql } from '@/lib/db';
import { getCurrentWeekSaturday } from '@/lib/dates';
import { scoreMeals } from '@/lib/suggestions';
import type { Meal, HistoryEntry } from '@/lib/db';
import MealCard from '@/components/MealCard';
import HomePlanClient from './HomePlanClient';

async function getData() {
  const weekOf = getCurrentWeekSaturday();

  const [{ rows: planRows }, { rows: meals }, { rows: history }, { rows: settings }] =
    await Promise.all([
      sql`SELECT * FROM weekly_plans WHERE week_of = ${weekOf}`,
      sql`SELECT m.*, ROUND(AVG(h.rating)::numeric,1) AS avg_rating
          FROM meals m LEFT JOIN meal_history h ON h.meal_id = m.id
          GROUP BY m.id`,
      sql`SELECT * FROM meal_history`,
      sql`SELECT value FROM settings WHERE key = 'dietary_notes'`,
    ]);

  type PlanRow = { id: number; week_of: string; meal_ids: number[] };
  const plan = (planRows[0] as PlanRow) ?? null;
  let planMeals: Meal[] = [];
  if (plan) {
    const ids: number[] = plan.meal_ids;
    planMeals = ids
      .map((id) => meals.find((m) => m.id === id))
      .filter(Boolean) as Meal[];
  }

  const scored = scoreMeals(meals as Meal[], history as HistoryEntry[]);
  const suggestions = scored.slice(0, 3);

  const dietaryNotes: string = settings[0]?.value ?? '';

  return { weekOf, plan, planMeals, suggestions, dietaryNotes };
}

export default async function HomePage() {
  const { weekOf, plan, planMeals, suggestions, dietaryNotes } = await getData();

  const weekLabel = new Date(weekOf + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-5">
      {/* Week header */}
      <div>
        <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
          Week of
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{weekLabel}</h1>
      </div>

      {/* Dietary reminder banner */}
      {dietaryNotes && (
        <details className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm">
          <summary className="font-semibold text-amber-800 cursor-pointer list-none flex items-center gap-2">
            <span>⚠️</span>
            <span>Dietary reminders</span>
            <span className="ml-auto text-xs text-amber-600">tap to expand</span>
          </summary>
          <p className="mt-2 text-amber-700 whitespace-pre-wrap">{dietaryNotes}</p>
        </details>
      )}

      {/* Plan / suggestions — client island handles lock/shuffle/AI */}
      <HomePlanClient
        weekOf={weekOf}
        initialPlan={plan}
        initialPlanMeals={planMeals}
        initialSuggestions={suggestions}
      />
    </div>
  );
}

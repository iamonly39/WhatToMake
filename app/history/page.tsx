export const dynamic = 'force-dynamic';

import { sql } from '@/lib/db';
import type { Meal, HistoryEntry } from '@/lib/db';
import HistoryClient from './HistoryClient';

type Plan = { id: number; week_of: string; meal_ids: number[] };

export default async function HistoryPage() {
  const { rows: plans } = await sql`SELECT * FROM weekly_plans ORDER BY week_of DESC`;
  const { rows: meals } = await sql`SELECT * FROM meals`;
  const { rows: history } = await sql`SELECT * FROM meal_history`;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900">History</h1>
      <HistoryClient
        plans={plans as Plan[]}
        meals={meals as Meal[]}
        history={history as HistoryEntry[]}
      />
    </div>
  );
}

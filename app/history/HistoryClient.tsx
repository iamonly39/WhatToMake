'use client';

import { useState } from 'react';
import StarRating from '@/components/StarRating';
import type { Meal, HistoryEntry } from '@/lib/db';

type Plan = { id: number; week_of: string; meal_ids: number[] };

type Props = {
  plans: Plan[];
  meals: Meal[];
  history: HistoryEntry[];
};

export default function HistoryClient({ plans, meals, history: initialHistory }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);

  async function updateRating(entryId: number, rating: number) {
    await fetch(`/api/history/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    setHistory(history.map((h) => (h.id === entryId ? { ...h, rating } : h)));
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📅</p>
        <p className="font-medium">No history yet.</p>
        <p className="text-sm">Lock in a weekly plan to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {plans.map((plan) => {
        const planMeals = (plan.meal_ids as number[])
          .map((id) => meals.find((m) => m.id === id))
          .filter(Boolean) as Meal[];

        const weekLabel = new Date(plan.week_of + 'T12:00:00').toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        });

        return (
          <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Week of</p>
              <p className="font-bold text-gray-800">{weekLabel}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {planMeals.map((meal) => {
                // Find the history entry closest to this plan's week
                const entries = history
                  .filter((h) => h.meal_id === meal.id)
                  .sort((a, b) => (a.made_on > b.made_on ? -1 : 1));
                const entry = entries[0] ?? null;

                return (
                  <div key={meal.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{meal.name}</p>
                      {entry && (
                        <p className="text-xs text-gray-400">
                          Made{' '}
                          {new Date(entry.made_on + 'T12:00:00').toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    {entry ? (
                      <StarRating
                        value={entry.rating}
                        onChange={(r) => updateRating(entry.id, r)}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs text-gray-300 italic">not recorded</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

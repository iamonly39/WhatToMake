'use client';

import { useState } from 'react';
import MealCard from '@/components/MealCard';
import AiSuggestionCard from '@/components/AiSuggestionCard';
import type { Meal } from '@/lib/db';
import type { AiSuggestion } from '@/app/api/ai-suggestions/route';
import type { ScoredMeal } from '@/lib/suggestions';

type Props = {
  weekOf: string;
  initialPlan: { id: number; week_of: string; meal_ids: number[] } | null;
  initialPlanMeals: Meal[];
  initialSuggestions: ScoredMeal[];
};

export default function HomePlanClient({
  weekOf,
  initialPlan,
  initialPlanMeals,
  initialSuggestions,
}: Props) {
  const [plan, setPlan] = useState(initialPlan);
  const [planMeals, setPlanMeals] = useState<Meal[]>(initialPlanMeals);
  const [suggestions, setSuggestions] = useState<ScoredMeal[]>(initialSuggestions);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingShuffle, setLoadingShuffle] = useState(false);
  const [loadingLock, setLoadingLock] = useState(false);

  async function shuffle() {
    setLoadingShuffle(true);
    const res = await fetch('/api/suggestions');
    const data = await res.json();
    setSuggestions(data.suggestions);
    setLoadingShuffle(false);
  }

  async function lockPlan() {
    setLoadingLock(true);
    const mealIds = suggestions.slice(0, 3).map((s) => s.id);
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_of: weekOf, meal_ids: mealIds }),
    });
    const data = await res.json();
    setPlan(data.plan);
    setPlanMeals(suggestions.slice(0, 3));
    setLoadingLock(false);
  }

  async function changePlan() {
    setPlan(null);
    setPlanMeals([]);
  }

  async function loadAiSuggestions() {
    setLoadingAi(true);
    const res = await fetch('/api/ai-suggestions');
    const data = await res.json();
    setAiSuggestions(data.suggestions ?? []);
    setLoadingAi(false);
  }

  if (plan) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-lg">This Week's Plan</h2>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
            Locked in
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {planMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
        <button
          onClick={changePlan}
          className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold active:scale-95 transition-transform"
        >
          Change Plan
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Library suggestions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-lg">From Your Library</h2>
          <button
            onClick={shuffle}
            disabled={loadingShuffle}
            className="text-sm text-brand-600 font-semibold active:opacity-70 disabled:opacity-40"
          >
            {loadingShuffle ? 'Shuffling…' : '🔀 Shuffle'}
          </button>
        </div>
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Add meals to your library to see suggestions here.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {suggestions.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}
      </div>

      {/* AI suggestions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-lg">New Ideas</h2>
          {!aiSuggestions && (
            <button
              onClick={loadAiSuggestions}
              disabled={loadingAi}
              className="text-sm text-brand-600 font-semibold active:opacity-70 disabled:opacity-40"
            >
              {loadingAi ? 'Thinking…' : '✨ Ask AI'}
            </button>
          )}
        </div>
        {aiSuggestions === null ? (
          <p className="text-sm text-gray-400">
            Tap "Ask AI" to get personalized meal ideas based on your preferences and history.
          </p>
        ) : aiSuggestions.length === 0 ? (
          <p className="text-sm text-gray-400">No suggestions returned. Try again.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {aiSuggestions.map((s) => (
              <AiSuggestionCard key={s.name} suggestion={s} />
            ))}
          </div>
        )}
      </div>

      {/* Lock plan button */}
      {suggestions.length > 0 && (
        <button
          onClick={lockPlan}
          disabled={loadingLock}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50 text-lg"
        >
          {loadingLock ? 'Saving…' : 'Lock In This Week\'s Plan'}
        </button>
      )}
    </div>
  );
}

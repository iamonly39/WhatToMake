import { Meal, HistoryEntry } from './db';
import { daysSince } from './dates';

export type ScoredMeal = Meal & { score: number; days_since_made: number | null };

/**
 * Scores meals from the personal library based on rating history and recency.
 * Pure function — no DB calls. Pass in all meals and all history.
 */
export function scoreMeals(meals: Meal[], history: HistoryEntry[]): ScoredMeal[] {
  const scored: ScoredMeal[] = [];

  for (const meal of meals) {
    const mealHistory = history.filter((h) => h.meal_id === meal.id);

    // Most recent made_on date
    const dates = mealHistory.map((h) => h.made_on).sort().reverse();
    const mostRecent = dates[0] ?? null;
    const daysSinceMade = mostRecent ? daysSince(mostRecent) : null;

    // Hard exclude if made within 14 days
    if (daysSinceMade !== null && daysSinceMade < 14) continue;

    // Average rating from rated entries
    const rated = mealHistory.filter((h) => h.rating !== null);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, h) => sum + (h.rating ?? 0), 0) / rated.length
        : 3.0; // default for unrated meals

    // Recency penalty
    let recencyPenalty = 0;
    if (daysSinceMade !== null) {
      if (daysSinceMade < 30) recencyPenalty = -3;
      else if (daysSinceMade < 60) recencyPenalty = -1;
    }

    // Small random jitter so Shuffle produces variety
    const jitter = (Math.random() - 0.5) * 1.0;

    const score = avgRating + recencyPenalty + jitter;

    scored.push({ ...meal, avg_rating: avgRating, score, days_since_made: daysSinceMade });
  }

  return scored.sort((a, b) => b.score - a.score);
}

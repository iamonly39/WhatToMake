const BASE = 'https://api.spoonacular.com';

export type SpoonacularRecipe = {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  summary?: string;
  sourceUrl?: string;
};

/**
 * Parses free-form dietary notes into Spoonacular intolerances filter string.
 * Spoonacular supported intolerances: dairy, egg, gluten, grain, peanut,
 * seafood, sesame, shellfish, soy, sulfite, tree nut, wheat
 */
export function parseIntolerances(dietaryNotes: string): string {
  const notes = dietaryNotes.toLowerCase();
  const intolerances: string[] = [];
  if (notes.includes('shellfish') || notes.includes('shrimp') || notes.includes('crab')) {
    intolerances.push('shellfish');
  }
  if (notes.includes('seafood') || notes.includes('fish')) {
    intolerances.push('seafood');
  }
  if (notes.includes('dairy') || notes.includes('milk') || notes.includes('lactose')) {
    intolerances.push('dairy');
  }
  if (notes.includes('gluten') || notes.includes('wheat')) {
    intolerances.push('gluten');
  }
  if (notes.includes('nut') && !notes.includes('peanut')) {
    intolerances.push('tree nut');
  }
  if (notes.includes('peanut')) {
    intolerances.push('peanut');
  }
  return intolerances.join(',');
}

export async function searchRecipes(
  query: string,
  dietaryNotes: string,
  number = 12
): Promise<SpoonacularRecipe[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) throw new Error('SPOONACULAR_API_KEY not set');

  const intolerances = parseIntolerances(dietaryNotes);
  const params = new URLSearchParams({
    apiKey,
    query,
    number: String(number),
    addRecipeInformation: 'true',
    fillIngredients: 'false',
    ...(intolerances ? { intolerances } : {}),
  });

  const res = await fetch(`${BASE}/recipes/complexSearch?${params}`);
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);
  const data = await res.json();
  return data.results as SpoonacularRecipe[];
}

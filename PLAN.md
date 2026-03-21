# WhatToMake — Implementation Plan

## App Overview

A mobile-first weekly meal planning web app. The household shops Saturday/early Sunday, then batch-cooks 2–3 meals on Sunday. The app tracks meal history and dietary preferences, suggests meals from your personal library, discovers new recipes from the internet, and uses AI to generate personalized ideas.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | File-based routing, server components, API routes |
| Language | TypeScript | Strict mode throughout |
| Styling | Tailwind CSS | Mobile-first utility classes |
| Database | Vercel Postgres (Neon) | Serverless Postgres, built-in Vercel integration |
| Recipe API | Spoonacular | Search/browse external recipes, filter by dietary needs |
| AI | Claude API (claude-haiku-4-5) | AI-generated meal suggestions + recipe URL parsing |
| Auth | None — shared household app | Everyone sees and edits the same shared data |

---

## Environment Variables

```
# Vercel Postgres (auto-injected when you connect Vercel Postgres in dashboard)
POSTGRES_URL=

# Spoonacular (free tier: 150 req/day — https://spoonacular.com/food-api)
SPOONACULAR_API_KEY=

# Anthropic (https://console.anthropic.com)
ANTHROPIC_API_KEY=
```

All three are set in the Vercel dashboard under Project → Settings → Environment Variables. For local dev, copy to `.env.local` (gitignored).

---

## Database Schema

### Table: `meals`

```sql
CREATE TABLE IF NOT EXISTS meals (
  id          SERIAL PRIMARY KEY,
  name        TEXT    NOT NULL,
  category    TEXT    NOT NULL DEFAULT 'other',
  notes       TEXT,
  source_url  TEXT,             -- link to the original recipe (optional)
  created_at  DATE    NOT NULL DEFAULT CURRENT_DATE
);
```

`category` options: `casserole`, `pasta`, `soup`, `stir-fry`, `salad`, `sandwich`, `other`.

### Table: `meal_history`

```sql
CREATE TABLE IF NOT EXISTS meal_history (
  id        SERIAL PRIMARY KEY,
  meal_id   INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  made_on   DATE    NOT NULL,
  rating    INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes     TEXT
);
```

### Table: `weekly_plans`

```sql
CREATE TABLE IF NOT EXISTS weekly_plans (
  id       SERIAL PRIMARY KEY,
  week_of  DATE NOT NULL UNIQUE,  -- the Saturday that starts the week
  meal_ids INTEGER[] NOT NULL     -- Postgres native integer array
);
```

### Table: `settings`

```sql
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Seed the dietary notes row so it always exists
INSERT INTO settings (key, value)
VALUES ('dietary_notes', '')
ON CONFLICT (key) DO NOTHING;
```

A key-value table for household-wide settings. The `dietary_notes` key stores free-form guidance (e.g. "Low salt. No shellfish. Not spicy. Not crunchy."). Easy to extend with future keys without schema changes.

Schema lives in `scripts/schema.sql`, applied once via `npx tsx scripts/setup-db.ts`.

---

## File Structure

```
/home/user/WhatToMake/
  package.json
  next.config.js
  tailwind.config.ts
  tsconfig.json
  .gitignore
  .env.local                    # gitignored — copy of Vercel env vars for local dev
  app/
    layout.tsx                  # Root layout: header (with gear icon) + BottomNav
    page.tsx                    # Home: this week's plan + suggestions + AI ideas
    meals/
      page.tsx                  # Personal meal library
      new/
        page.tsx                # Add meal manually OR paste a URL to parse
      [id]/
        page.tsx                # Meal detail: edit, history, ratings, recipe link
    discover/
      page.tsx                  # Browse/search Spoonacular recipes, add to library
    history/
      page.tsx                  # Past weekly plans + inline rating
    preferences/
      page.tsx                  # Household dietary notes
    api/
      meals/
        route.ts                # GET list, POST create
        [id]/
          route.ts              # GET, PUT, DELETE
      history/
        route.ts                # GET list, POST record
        [id]/
          route.ts              # PUT rating/notes
      plan/
        route.ts                # GET current plan, POST upsert
      suggestions/
        route.ts                # GET library-based suggestions
      ai-suggestions/
        route.ts                # GET Claude-powered new meal ideas
      discover/
        route.ts                # GET Spoonacular search results
      parse-recipe/
        route.ts                # POST URL → Claude extracts recipe details
      settings/
        route.ts                # GET and PUT dietary_notes
  components/
    BottomNav.tsx               # 4-tab nav: Home, Meals, Discover, History
    MealCard.tsx                # Meal name, category badge, star rating
    StarRating.tsx              # Tap-to-rate 1–5 stars
    FloatingAddButton.tsx       # FAB linking to /meals/new
    WeekPlanCard.tsx            # Card showing a saved weekly plan
    DiscoverCard.tsx            # External recipe card with "Add to Library" button
    AiSuggestionCard.tsx        # AI suggestion card with description + "Add" button
  lib/
    db.ts                       # Vercel Postgres client
    suggestions.ts              # Library-based scoring algorithm (pure function)
    dates.ts                    # Date helpers
    anthropic.ts                # Anthropic client singleton
    spoonacular.ts              # Spoonacular API helpers
  scripts/
    schema.sql                  # CREATE TABLE statements
    setup-db.ts                 # Runs schema.sql
    seed.ts                     # Seeds initial meals from recipe links
```

---

## Navigation

**Bottom nav (4 tabs):** Home · Meals · Discover · History

**Preferences** lives behind a gear icon (⚙) in the top-right of the header — accessible everywhere but not a primary tab. This keeps the bottom nav uncluttered since preferences are set-and-forget.

---

## API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/meals` | List all meals |
| POST | `/api/meals` | Create a meal |
| GET | `/api/meals/[id]` | Get meal with history and avg rating |
| PUT | `/api/meals/[id]` | Update meal |
| DELETE | `/api/meals/[id]` | Delete meal (cascades to history) |
| GET | `/api/history` | List history (`?meal_id=` optional filter) |
| POST | `/api/history` | Record a meal as made |
| PUT | `/api/history/[id]` | Update rating/notes |
| GET | `/api/plan` | Get current week's plan (or null) |
| POST | `/api/plan` | Upsert plan for a week |
| GET | `/api/suggestions` | Library-based suggestions (scoring algorithm) |
| GET | `/api/ai-suggestions` | Claude-powered new meal ideas |
| GET | `/api/discover?query=&category=` | Spoonacular recipe search |
| POST | `/api/parse-recipe` | URL → Claude extracts name/category/notes |
| GET | `/api/settings` | Get dietary notes |
| PUT | `/api/settings` | Update dietary notes |

---

## Feature Details

### 1. Library Suggestions (`/api/suggestions`)

Scores meals you've already added. Pure TypeScript function in `lib/suggestions.ts`.

```
for each meal in your library:
  base_score    = avg rating (default 3.0 if unrated)
  days_since    = days since last made (Infinity if never)

  if days_since < 14  → skip (too recent)
  if days_since < 30  → recency_penalty = -3
  if days_since < 60  → recency_penalty = -1
  else                → recency_penalty = 0

  jitter = random ±0.5

  final_score = base_score + recency_penalty + jitter

return top 3 sorted by score
```

"Shuffle" re-calls this endpoint for fresh jitter. Shown on the Home page.

---

### 2. AI Suggestions (`/api/ai-suggestions`)

Calls Claude API with household context. Returns 2–3 *new* recipe ideas not already in your library.

**Prompt sent to Claude (claude-haiku-4-5):**
```
You are a helpful meal planning assistant.

Household dietary requirements: {dietary_notes}

Meals we've made recently: {last_10_meals_with_dates}
Meals already in our library: {all_meal_names}

Suggest 2-3 new meal ideas we haven't tried yet that fit our dietary needs.
For each, provide:
- name (short, clear)
- category (casserole/pasta/soup/stir-fry/salad/sandwich/other)
- a 1-sentence description
- why it fits our preferences

Return as JSON array.
```

Results show on the Home page in a separate "New Ideas" section. Each card has an "Add to Library" button that pre-fills the `/meals/new` form.

**Cost note:** claude-haiku-4-5 is ~$0.001 per call. Each household will make this call at most once or twice a week — effectively free.

---

### 3. Discover Page (`/discover` + `/api/discover`)

Searches Spoonacular for recipes, pre-filtered by dietary needs.

**How dietary notes map to Spoonacular filters:**
- "no shellfish" → `intolerances=shellfish`
- "low salt" → `maxSodium=600` (mg per serving)
- "not spicy" → excluded from results by Claude post-processing (Spoonacular doesn't have a spice filter)

The route calls Spoonacular's `GET /recipes/complexSearch` with:
- `query` from the user's search input (or category browse)
- `intolerances` derived from dietary_notes
- `addRecipeNutrition=false` (save API quota)
- `number=12` results per page

Each result shows: name, image, estimated time. Tap → see brief summary. "Add to My Library" saves it to `meals` with the Spoonacular recipe page as `source_url`.

**Free tier:** 150 requests/day — plenty for a household.

---

### 4. Add from URL (`/meals/new` + `/api/parse-recipe`)

On the Add Meal page, there's a URL input field at the top with a "Parse Recipe" button.

**Flow:**
1. User pastes a recipe URL
2. App calls `POST /api/parse-recipe` with the URL
3. Server fetches the page HTML (best-effort — some sites block)
4. HTML is passed to Claude with prompt: *"Extract the recipe name, best category from [list], and a brief ingredients/notes summary from this HTML. Return JSON."*
5. If fetch fails (403/blocked), Claude is prompted instead with just the URL to make a best-effort guess based on the URL text alone
6. Form fields (name, category, notes, source_url) are pre-filled
7. User reviews and edits before saving

This handles most popular recipe sites. For sites that block all scrapers, the form still works — the URL is just saved as-is and the user fills in the fields manually.

---

## Pages

### Home `/`

1. "Week of [Saturday]" header with gear icon (→ /preferences)
2. **Dietary reminder banner** — collapsed pill showing "Low salt · No shellfish · Not spicy" (tap to expand full notes)
3. If plan locked: 3 meal cards with locked badge + "Change Plan" button
4. If no plan:
   - **"From Your Library"** section: 3 library-based suggestions with Shuffle button
   - **"New Ideas"** section: 2 AI-generated suggestions with "Add & Use" button
5. "Lock In This Week's Plan" button

### Meals `/meals`
- Full library list: name, category badge, avg star rating
- Tap → `/meals/[id]`
- FAB → `/meals/new`

### Add Meal `/meals/new`
- URL field at top + "Parse Recipe" button (calls `/api/parse-recipe`)
- Form: name (required), category (select), notes, source_url
- Submit → `POST /api/meals` → redirect to detail page

### Meal Detail `/meals/[id]`
- View/edit name, category, notes
- Tappable recipe link (if source_url set)
- "Mark as Made Today" button
- Rating history with `StarRating`
- Delete (with confirmation)

### Discover `/discover`
- Search bar + category filter pills
- Grid of `DiscoverCard` components from Spoonacular results
- "Add to My Library" on each card → saves meal + redirects to detail

### History `/history`
- Past weekly plans, reverse chronological
- Unrated entries show inline `StarRating`
- Rating saves via `PUT /api/history/[id]`

### Preferences `/preferences`
- Editable textarea: household dietary notes
- Save button → `PUT /api/settings`
- Help text: "These notes guide AI suggestions and filter Discover results"

---

## Mobile UX

- Bottom nav: Home / Meals / Discover / History (4 tabs, gear icon in header for Preferences)
- Min 44px tap targets everywhere
- Card-based layout throughout
- `active:scale-95` press feedback
- `pb-20` padding on main content to clear bottom nav
- `loading.tsx` skeletons for all data-fetching pages
- Discover page: lazy-load images with `next/image`

---

## Implementation Order

1. **Scaffold** — `create-next-app`, install dependencies (`@vercel/postgres`, `@anthropic-ai/sdk`), add `.env.local`
2. **DB layer** — `scripts/schema.sql`, `scripts/setup-db.ts`, `lib/db.ts`, `lib/dates.ts`
3. **Meals API** — CRUD routes
4. **History API** — record and rate meals
5. **Settings API** — GET/PUT dietary notes
6. **Library suggestions** — `lib/suggestions.ts` pure function + `/api/suggestions`
7. **AI suggestions** — `lib/anthropic.ts` + `/api/ai-suggestions`
8. **Discover** — `lib/spoonacular.ts` + `/api/discover`
9. **Parse recipe** — `/api/parse-recipe` (fetch + Claude extraction)
10. **Plan API** — GET/POST current week plan
11. **Shared components** — `StarRating`, `MealCard`, `BottomNav`, `FloatingAddButton`, `WeekPlanCard`, `DiscoverCard`, `AiSuggestionCard`
12. **Root layout** — header with gear icon + bottom nav
13. **Home page** — library suggestions + AI ideas + lock flow + dietary banner
14. **Meals pages** — library, add (with URL parse), detail
15. **Discover page** — search + category browse + add to library
16. **History page** — past plans + inline rating
17. **Preferences page** — dietary notes edit
18. **Mobile polish** — 390px viewport audit, tap targets, skeletons
19. **Seed data** — `scripts/seed.ts` with your 3 real meals + a few more for variety

---

## Seed Meals (from your recipe links)

| Name | Category | Source |
|---|---|---|
| Sweet Potato Ground Turkey Chili | soup | evolvingtable.com |
| Ina Garten's Meat Loaf | other | foodnetwork.com |
| Pioneer Woman Chicken Spaghetti | casserole | thepioneerwoman.com |

---

## Key Design Decisions

- **Three suggestion sources, clearly separated on Home**: library picks (fast, personal), AI ideas (new, personalized), and Discover (browsable catalog). Each serves a different need without confusing them.
- **claude-haiku-4-5 for AI features**: Fast and cheap enough to call on every page load if needed. Using Haiku for parse-recipe and ai-suggestions; no need for Sonnet/Opus for these tasks.
- **Spoonacular free tier is sufficient**: 150 req/day for a household that browses occasionally is plenty.
- **Dietary notes as free text, not checkboxes**: Preferences evolve over time (especially for a child with special needs). Free text is more flexible and Claude/Spoonacular can interpret it.
- **Parse-recipe degrades gracefully**: If a site blocks scraping, Claude guesses from the URL and the user fills the rest. The URL is still saved so they can reference it.
- **Vercel Postgres (Neon)**: Serverless, zero ops, auto-injected env vars on Vercel.
- **No auth**: Shared household app — anyone with the URL can use it.

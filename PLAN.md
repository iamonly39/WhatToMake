# WhatToMake — Implementation Plan

## App Overview

A mobile-first weekly meal planning web app. The household shops Saturday/early Sunday, then batch-cooks 2–3 meals on Sunday. The app tracks meal history and ratings, then uses them to suggest what to make each week.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | File-based routing, server components, API routes |
| Language | TypeScript | Strict mode throughout |
| Styling | Tailwind CSS | Mobile-first utility classes |
| Database | Vercel Postgres (Neon) | Serverless Postgres, built-in Vercel integration |
| Auth | None — shared household app | Everyone sees and edits the same shared data |

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

Schema lives in `scripts/schema.sql` and is applied once via `npx tsx scripts/setup-db.ts` (or the Vercel Postgres dashboard).

---

## File Structure

```
/home/user/WhatToMake/
  package.json
  next.config.js
  tailwind.config.ts
  tsconfig.json
  .gitignore
  app/
    layout.tsx              # Root layout: wraps all pages, renders BottomNav
    page.tsx                # Home: current week's plan / suggestions
    meals/
      page.tsx              # Meal library list
      new/
        page.tsx            # Add new meal form
      [id]/
        page.tsx            # Meal detail: edit, history, "mark as made"
    history/
      page.tsx              # Past weekly plans + inline rating
    api/
      meals/
        route.ts            # GET (list), POST (create)
        [id]/
          route.ts          # GET, PUT, DELETE single meal
      history/
        route.ts            # GET (list), POST (record made)
        [id]/
          route.ts          # PUT (add/update rating and notes)
      plan/
        route.ts            # GET current week plan, POST save plan
      suggestions/
        route.ts            # GET suggested meals
  components/
    BottomNav.tsx           # Fixed bottom navigation bar
    MealCard.tsx            # Reusable card showing meal name + category
    StarRating.tsx          # Tap-to-rate 1–5 star component
    FloatingAddButton.tsx   # FAB for adding a new meal
    WeekPlanCard.tsx        # Card showing a saved weekly plan
  lib/
    db.ts                   # Vercel Postgres client (re-exports sql tag)
    suggestions.ts          # Suggestion scoring algorithm
    dates.ts                # Date helpers (current Saturday, etc.)
  scripts/
    schema.sql              # CREATE TABLE statements — run once
    setup-db.ts             # Runs schema.sql against the DB
    seed.ts                 # Optional: seed sample meals and history
  .env.local                # POSTGRES_URL (gitignored, set in Vercel dashboard)
```

---

## API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/meals` | List all meals |
| POST | `/api/meals` | Create a meal |
| GET | `/api/meals/[id]` | Get meal with history and avg rating |
| PUT | `/api/meals/[id]` | Update meal |
| DELETE | `/api/meals/[id]` | Delete meal (cascades to history) |
| GET | `/api/history` | List all history entries (supports `?meal_id=`) |
| POST | `/api/history` | Record a meal as made |
| PUT | `/api/history/[id]` | Update rating/notes on history entry |
| GET | `/api/plan` | Get current week's plan (or null) |
| POST | `/api/plan` | Upsert plan for a week |
| GET | `/api/suggestions` | Get top 3 scored meal suggestions |

---

## Suggestion Algorithm (`lib/suggestions.ts`)

Pure function — takes meals + history, returns scored list.

```
for each meal:
  base_score = average of all ratings (default 3.0 if no ratings)

  days_since = days since most recent made_on (Infinity if never made)

  if days_since < 14:
    skip entirely
  else if days_since < 30:
    recency_penalty = -3
  else if days_since < 60:
    recency_penalty = -1
  else:
    recency_penalty = 0

  jitter = random float in [-0.5, +0.5]

  final_score = base_score + recency_penalty + jitter

sort descending, return top 3
```

- 14-day hard cutoff prevents meal fatigue
- Jitter means "Shuffle" (re-calling the endpoint) gives variety
- Default 3.0 means new unrated meals are competitive

---

## Pages

### Home `/`
1. Show "Week of [Saturday date]" header
2. If plan locked: show 3 meal cards with locked badge
3. If no plan: show 3 suggestions from `/api/suggestions`
4. "Shuffle" button re-fetches suggestions (client component)
5. "Lock In This Week's Plan" calls `POST /api/plan`, shows locked state

### Meals `/meals`
- List all meals with name, category badge, avg star rating
- Tap → `/meals/[id]`
- Floating `+` button → `/meals/new`

### Add Meal `/meals/new`
- Form: name, category (select), notes
- On submit: `POST /api/meals` → redirect to `/meals/[id]`

### Meal Detail `/meals/[id]`
- View/edit name, category, notes
- "Mark as Made Today" → `POST /api/history`
- Chronological history with star ratings
- Delete button (with confirmation)

### History `/history`
- Past weekly plans in reverse chronological order
- Each plan shows the 3 meals
- Unrated history entries show interactive `StarRating`
- Rating saves via `PUT /api/history/[id]`

---

## Mobile UX
- Bottom nav: Home / Meals / History with active highlight
- Min 44px tap targets
- Card-based layout
- `active:scale-95` press feedback on buttons
- `pb-20` padding on main to clear bottom nav
- `loading.tsx` skeletons for perceived performance

---

## Implementation Order

1. **Scaffold** — `create-next-app`, install `@vercel/postgres`, add `.env.local`
2. **DB layer** — `scripts/schema.sql`, `scripts/setup-db.ts`, `lib/db.ts`, `lib/dates.ts`
3. **Meals API** — CRUD routes
4. **History API** — record and rate meals
5. **Suggestions algorithm** — pure function, test with mock data
6. **Plan + Suggestions API** — wire algorithm to routes
7. **Shared components** — `StarRating`, `MealCard`, `BottomNav`, `FloatingAddButton`, `WeekPlanCard`
8. **Root layout** — shell with bottom nav
9. **Home page** — suggestions + lock flow
10. **Meals pages** — library, add, detail
11. **History page** — past plans + inline rating
12. **Mobile polish** — 390px viewport audit, tap targets, skeletons
13. **Seed data** — `scripts/seed.ts` inserts your 3 real meals (see below) + a few generic ones for variety
14. **Recipe link display** — Meal detail page shows a tappable link to the original recipe

---

## Seed Meals (from your recipe links)

| Name | Category | Source |
|---|---|---|
| Sweet Potato Ground Turkey Chili | soup | evolvingtable.com |
| Ina Garten's Meat Loaf | other | foodnetwork.com |
| Pioneer Woman Chicken Spaghetti | casserole | thepioneerwoman.com |

**Sweet Potato Ground Turkey Chili** — Ground turkey, sweet potatoes, black beans, corn, tomatoes, chicken broth, chili powder, cumin, paprika, cinnamon. One pot, 45 min.

**Ina Garten's Meat Loaf** — Ground chuck, sautéed onions, Worcestershire, chicken stock, tomato paste, bread crumbs, eggs, ketchup topping. Bake 325°F for ~1h15m.

**Pioneer Woman Chicken Spaghetti** — Whole chicken (simmered), spaghetti cooked in broth, cream of mushroom soup, sharp cheddar, green pepper, onion, pimentos, cayenne. Bake 350°F for 45 min. Freezes well.

---

## Key Design Decisions

- **Vercel Postgres (Neon)**: Serverless, zero ops, integrates directly with Vercel deploy — connection string injected automatically via environment variables.
- **Shared household app, no auth**: Everyone hits the same data. Can add a simple shared PIN later if needed.
- **No authentication**: Personal/household use, not worth the scope.
- **`meal_ids` as Postgres integer array in `weekly_plans`**: Plans are tiny, never queried relationally; junction table would be overkill. Native `INTEGER[]` is cleaner than JSON in Postgres.
- **Pure suggestion function**: Easy to unit test and modify independently of routing.
- **Server components for initial render**: No loading spinners on first load, important on mobile.

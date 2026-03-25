# WhatToMake

A weekly meal planning and grocery app built with Next.js and Claude AI.

## Features

- **Meal Library** — Build a personal library of meals with categories and notes
- **Weekly Planner** — Assign meals to days of the week and generate a shopping list
- **AI Suggestions** — Get personalized meal ideas from Claude based on your preferences and history
- **Discover** — Browse recipes from Spoonacular and add them to your library with one tap
- **URL Import** — Paste any recipe URL and Claude will parse the name, category, and notes automatically
- **History** — Track what you've made and rate meals with stars

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Claude AI](https://anthropic.com) via `@anthropic-ai/sdk` — meal suggestions, recipe parsing
- [Spoonacular API](https://spoonacular.com/food-api) — recipe discovery
- [Vercel Postgres](https://vercel.com/storage/postgres) — meal and settings storage

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```
ANTHROPIC_API_KEY=
SPOONACULAR_API_KEY=
POSTGRES_URL=
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

/**
 * Seed script — inserts initial meals into the database.
 * Run with: npm run seed
 *
 * Safe to run multiple times — skips meals that already exist by name.
 */
import { sql } from '@vercel/postgres';

const MEALS = [
  {
    name: 'Sweet Potato Ground Turkey Chili',
    category: 'soup',
    notes:
      'Ground turkey, sweet potatoes, black beans, corn, canned tomatoes, chicken broth. Seasoned with chili powder, cumin, paprika, and a pinch of cinnamon. One pot, ~45 min. Keeps 3–4 days.',
    source_url: 'https://www.evolvingtable.com/healthy-sweet-potato-ground-turkey-chili/',
  },
  {
    name: "Ina Garten's Meat Loaf",
    category: 'other',
    notes:
      'Ground chuck, sautéed onions with thyme, Worcestershire sauce, chicken stock, tomato paste, bread crumbs, eggs. Ketchup glaze on top. Bake 325°F for ~1h15m.',
    source_url: 'https://www.foodnetwork.com/recipes/ina-garten/meat-loaf-recipe-1921718',
  },
  {
    name: 'Pioneer Woman Chicken Spaghetti',
    category: 'casserole',
    notes:
      'Whole chicken simmered in broth, spaghetti cooked in that broth, cream of mushroom soup, sharp cheddar, green pepper, onion, pimentos, cayenne. Bake 350°F for 45 min. Freezes well.',
    source_url:
      'https://www.thepioneerwoman.com/food-cooking/recipes/a11729/chicken-spaghetti-recipe/',
  },
  {
    name: 'Baked Ziti',
    category: 'pasta',
    notes:
      'Ziti pasta, ground beef or Italian sausage, marinara sauce, ricotta, mozzarella, and Parmesan. Bake covered at 375°F for 25 min, uncover for 15 min to brown.',
    source_url: null,
  },
  {
    name: 'Beef and Vegetable Soup',
    category: 'soup',
    notes:
      'Beef stew meat, potatoes, carrots, celery, onion, canned tomatoes, beef broth. Low-sodium broth works great. Simmer 1.5–2 hours. Better the next day.',
    source_url: null,
  },
  {
    name: 'Chicken and Rice Casserole',
    category: 'casserole',
    notes:
      'Chicken thighs, long-grain white rice, low-sodium chicken broth, cream of chicken soup, onion powder, garlic powder. Bake covered at 350°F for 1 hour.',
    source_url: null,
  },
];

async function main() {
  console.log('Seeding meals…');
  let added = 0;
  let skipped = 0;

  for (const meal of MEALS) {
    const { rows } = await sql`SELECT id FROM meals WHERE name = ${meal.name}`;
    if (rows.length > 0) {
      console.log(`  Skipped (exists): ${meal.name}`);
      skipped++;
      continue;
    }
    await sql`
      INSERT INTO meals (name, category, notes, source_url)
      VALUES (${meal.name}, ${meal.category}, ${meal.notes}, ${meal.source_url})
    `;
    console.log(`  Added: ${meal.name}`);
    added++;
  }

  console.log(`\nDone. Added ${added}, skipped ${skipped}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

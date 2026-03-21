import Link from 'next/link';
import StarRating from './StarRating';
import type { Meal } from '@/lib/db';

const CATEGORY_COLORS: Record<string, string> = {
  casserole: 'bg-orange-100 text-orange-800',
  pasta:     'bg-yellow-100 text-yellow-800',
  soup:      'bg-blue-100 text-blue-800',
  'stir-fry':'bg-green-100 text-green-800',
  salad:     'bg-emerald-100 text-emerald-800',
  sandwich:  'bg-purple-100 text-purple-800',
  other:     'bg-gray-100 text-gray-700',
};

type Props = {
  meal: Meal & { avg_rating?: number | null };
  showLink?: boolean;
  badge?: React.ReactNode;
};

export default function MealCard({ meal, showLink = true, badge }: Props) {
  const catColor = CATEGORY_COLORS[meal.category] ?? CATEGORY_COLORS.other;
  const card = (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-base leading-tight">{meal.name}</h3>
        {badge}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
          {meal.category}
        </span>
        {meal.avg_rating != null && (
          <StarRating value={Math.round(meal.avg_rating)} readonly size="sm" />
        )}
      </div>
      {meal.notes && (
        <p className="text-sm text-gray-500 line-clamp-2">{meal.notes}</p>
      )}
    </div>
  );

  return showLink ? (
    <Link href={`/meals/${meal.id}`} className="block">
      {card}
    </Link>
  ) : card;
}

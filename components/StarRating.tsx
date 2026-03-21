'use client';

type Props = {
  value: number | null;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
};

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: Props) {
  const sz = size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`${sz} leading-none transition-transform active:scale-110 disabled:cursor-default`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <span className={star <= (value ?? 0) ? 'text-brand-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

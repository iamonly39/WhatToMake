import Link from 'next/link';

export default function FloatingAddButton({ href = '/meals/new' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl leading-none active:scale-95 transition-transform"
      aria-label="Add new meal"
    >
      +
    </Link>
  );
}

import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-white bg-white/60 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-6 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-extrabold text-rose-500 text-lg">🌸 HerCare</p>
          <p className="text-ink-600 mt-2 max-w-xs">A gentle wellness companion for living well with PCOS.</p>
        </div>
        <div className="flex flex-col gap-2 text-ink-600">
          <Link to="/recipes" className="hover:text-rose-500">Recipes</Link>
          <Link to="/workouts" className="hover:text-rose-500">Workouts</Link>
          <Link to="/programs" className="hover:text-rose-500">Programs</Link>
        </div>
        <p className="text-ink-400 text-xs leading-relaxed">
          HerCare shares general wellness information and is not a substitute for professional medical advice.
          Please talk to your doctor about any health concerns.
        </p>
      </div>
    </footer>
  );
}

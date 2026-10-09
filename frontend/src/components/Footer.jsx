import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-rose-100 mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-rose-500 text-2xl">🌸</span>
              <span className="font-extrabold text-rose-500 text-xl tracking-tight">HerCare</span>
            </Link>
            <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
              A gentle wellness companion for living well with PCOS. We provide guided programs, 
              nourishing recipes, and mindful workouts designed specifically for your body's rhythm.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-800 mb-4">Explore</h4>
            <ul className="flex flex-col gap-3 text-sm text-zinc-500">
              <li><Link to="/recipes" className="hover:text-rose-500 transition-colors">Nourishing Recipes</Link></li>
              <li><Link to="/workouts" className="hover:text-rose-500 transition-colors">Mindful Workouts</Link></li>
              <li><Link to="/programs" className="hover:text-rose-500 transition-colors">Guided Programs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-800 mb-4">Legal</h4>
            <ul className="flex flex-col gap-3 text-sm text-zinc-500">
              <li><Link to="/" className="hover:text-rose-500 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/" className="hover:text-rose-500 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/" className="hover:text-rose-500 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-rose-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-400 text-xs text-center md:text-left max-w-2xl leading-relaxed">
            Disclaimer: HerCare shares general wellness information and is not a substitute for professional medical advice.
            Please consult your healthcare provider before beginning any new diet or exercise program.
          </p>
          <p className="text-zinc-500 font-medium text-xs whitespace-nowrap">
            &copy; {new Date().getFullYear()} HerCare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

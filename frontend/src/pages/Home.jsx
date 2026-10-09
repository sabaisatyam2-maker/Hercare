import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { recipeApi, programApi } from '../api/services';
import { Button } from '../components/Button';
import { RecipeCard, ProgramCard, CardGrid } from '../components/Cards';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  { emoji: '📓', title: 'Track your days', text: 'Mood, sleep, water, stress and cycle day - all in one calm place.' },
  { emoji: '🥗', title: 'Eat with ease', text: 'PCOS-friendly recipes with clear steps and diet tags you can filter.' },
  { emoji: '🧘‍♀️', title: 'Move kindly', text: 'Low-impact workouts for every energy level, from gentle to strong.' },
  { emoji: '📅', title: 'Follow a plan', text: '7 to 30 day programs that bring food, movement and habits together.' },
];

export default function Home() {
  const { user, isAdmin } = useAuth();
  const root = useRef(null);
  const recipes = useApi((signal) => recipeApi.list(undefined, signal), []);
  const programs = useApi((signal) => programApi.list(undefined, signal), []);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('[data-hero="badge"]', { opacity: 0, y: 16, duration: 0.5 })
        .from('[data-hero="title"]', { opacity: 0, y: 30, duration: 0.7 }, '-=0.2')
        .from('[data-hero="text"]', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
        .from('[data-hero="cta"]', { opacity: 0, y: 20, duration: 0.5 }, '-=0.3');
      gsap.to('[data-blob="a"]', { y: -18, x: 10, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('[data-blob="b"]', { y: 20, x: -14, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' });

      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 36, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // New content arrives after the first render: refresh trigger positions.
  useEffect(() => { ScrollTrigger.refresh(); }, [recipes.data, programs.data]);

  const featuredRecipes = (recipes.data?.recipes || []).slice(0, 4);
  const featuredPrograms = (programs.data?.programs || []).slice(0, 3);

  return (
    <div ref={root}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div data-blob="a" className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-rose-200/50 blur-3xl" aria-hidden="true" />
        <div data-blob="b" className="absolute top-20 -right-24 w-md h-112 rounded-full bg-lavender-200/60 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
          <span data-hero="badge" className="chip !text-rose-600 !bg-rose-50 !border-rose-100 mb-6">🌸 Made for women living with PCOS</span>
          <h1 data-hero="title" className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Your body. Your pace.<br />
            <span className="bg-linear-to-r from-rose-500 to-lavender-500 bg-clip-text text-transparent">Gentle, steady wellness.</span>
          </h1>
          <p data-hero="text" className="mt-6 text-lg text-ink-600 max-w-2xl mx-auto">
            Track how you feel each day, cook nourishing food, move in ways that feel good,
            and follow guided programs - all in one warm, judgement-free space.
          </p>
          <div data-hero="cta" className="mt-9 flex flex-wrap justify-center gap-3">
            {user ? (
              <Button to={isAdmin ? '/admin' : '/dashboard'} size="lg">{isAdmin ? 'Open admin panel' : 'Go to my dashboard'}</Button>
            ) : (
              <>
                <Button to="/register" size="lg">Start for free</Button>
                <Button to="/programs" variant="outline" size="lg">Browse programs</Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} data-reveal className="card p-6 hover:-translate-y-1 transition-transform">
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="text-sm text-ink-600 mt-1.5">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recipes */}
      {featuredRecipes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div data-reveal className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Fresh from the kitchen</h2>
              <p className="text-ink-600 mt-1">Simple, nourishing recipes to try this week.</p>
            </div>
            <Link to="/recipes" className="text-sm font-semibold text-rose-500 hover:underline">See all &rarr;</Link>
          </div>
          <div data-reveal><CardGrid>{featuredRecipes.map((r) => <RecipeCard key={r._id} recipe={r} />)}</CardGrid></div>
        </section>
      )}

      {/* Programs */}
      {featuredPrograms.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div data-reveal className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Guided programs</h2>
              <p className="text-ink-600 mt-1">Pick a plan and take it one day at a time.</p>
            </div>
            <Link to="/programs" className="text-sm font-semibold text-rose-500 hover:underline">See all &rarr;</Link>
          </div>
          <div data-reveal><CardGrid>{featuredPrograms.map((p) => <ProgramCard key={p._id} program={p} />)}</CardGrid></div>
        </section>
      )}

      {/* CTA */}
      {!user && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div data-reveal className="rounded-3xl bg-linear-to-br from-rose-500 to-lavender-500 text-white text-center p-10 sm:p-14 shadow-xl shadow-rose-200">
            <h2 className="text-2xl sm:text-4xl font-extrabold">Ready to feel more in tune with your body?</h2>
            <p className="mt-3 text-white/90 max-w-xl mx-auto">Create your free account in a minute and get a plan that fits your goals.</p>
            <Link to="/register" className="inline-block mt-7 bg-white text-rose-600 font-bold px-7 py-3 rounded-xl hover:scale-105 transition-transform">
              Create my account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

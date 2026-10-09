import { useEffect } from 'react';
import gsap from 'gsap';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Fade/slide in every `[data-anim]` inside ref whenever deps change. */
export function useStagger(ref, deps = [], { y = 22, stagger = 0.06, duration = 0.55 } = {}) {
  useEffect(() => {
    if (!ref.current || reduced()) return undefined;
    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray('[data-anim]');
      if (!targets.length) return;
      gsap.from(targets, {
        opacity: 0, y, duration, stagger, ease: 'power2.out', clearProps: 'opacity,transform',
      });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

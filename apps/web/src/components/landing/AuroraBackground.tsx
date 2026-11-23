import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { cn } from '@/lib/cn';

const PARTICLES = ['🎓', '✨', '💛', '✉️', '⭐', '🤍', '📖', '🌟'];

/** Deterministic pseudo-random numbers, so the particles don't jump between renders. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Slowly drifting colour light and rising graduation confetti, behind the hero. */
export function AuroraBackground({ className, particles = 18 }: { className?: string; particles?: number }) {
  const items = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: particles }, (_, i) => ({
      emoji: PARTICLES[i % PARTICLES.length],
      left: rand() * 100,
      size: 12 + rand() * 18,
      duration: 14 + rand() * 16,
      delay: -rand() * 30,
      opacity: 0.25 + rand() * 0.45,
      spin: `${(rand() - 0.5) * 300}deg`,
    }));
  }, [particles]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-night-900 via-night-800 to-maroon-700" />
      <div className="absolute -left-[15%] -top-[25%] h-[70%] w-[70%] animate-aurora rounded-full bg-maroon-500/45 blur-[90px]" />
      <div
        className="absolute -right-[10%] top-[5%] h-[60%] w-[55%] animate-aurora rounded-full bg-gold-500/30 blur-[100px]"
        style={{ animationDelay: '-6s', animationDuration: '22s' }}
      />
      <div
        className="absolute bottom-[-20%] left-[20%] h-[60%] w-[60%] animate-aurora rounded-full bg-fuchsia-700/25 blur-[110px]"
        style={{ animationDelay: '-12s', animationDuration: '26s' }}
      />
      {/* Fine star dust */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 30%, #fff8 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, #fff6 50%, transparent 51%), radial-gradient(1.5px 1.5px at 40% 70%, #ffe9b088 50%, transparent 51%), radial-gradient(1px 1px at 85% 60%, #fff7 50%, transparent 51%), radial-gradient(1px 1px at 10% 85%, #fff5 50%, transparent 51%)',
          backgroundSize: '320px 320px',
        }}
      />
      {items.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-[-10%] animate-float-up"
          style={
            {
              left: `${p.left}%`,
              fontSize: p.size,
              animationDelay: `${p.delay}s`,
              '--particle-duration': `${p.duration}s`,
              '--particle-opacity': p.opacity,
              '--particle-spin': p.spin,
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
            } as CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

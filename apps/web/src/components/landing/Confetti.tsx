import { useCallback, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

const COLORS = ['#C9A876', '#E7D3B0', '#8C1D28', '#D98A93', '#FFFFFF', '#B8905A', '#F4C95D'];
const SHAPES = ['🎓', '✨', '💛'];

interface Piece {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rotate: number;
  color: string;
  size: number;
  emoji?: string;
  round: boolean;
}

let nextId = 0;

/**
 * A burst of paper confetti (and a few caps) from a point on the screen.
 * Returns the layer to render and a `fire(x, y)` function. Does nothing when
 * the visitor prefers reduced motion.
 */
export function useConfetti(): [ReactNode, (x?: number, y?: number, amount?: number) => void] {
  const [pieces, setPieces] = useState<Piece[]>([]);

  const fire = useCallback((x = window.innerWidth / 2, y = window.innerHeight / 2, amount = 46) => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const batch: Piece[] = Array.from({ length: amount }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      return {
        id: nextId++,
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 160,
        rotate: (Math.random() - 0.5) * 720,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 7,
        emoji: i % 9 === 0 ? SHAPES[(i / 9) % SHAPES.length] : undefined,
        round: Math.random() > 0.6,
      };
    });
    setPieces((current) => [...current, ...batch]);
    const ids = new Set(batch.map((p) => p.id));
    window.setTimeout(() => setPieces((current) => current.filter((p) => !ids.has(p.id))), 1900);
  }, []);

  const layer =
    pieces.length > 0 && typeof document !== 'undefined'
      ? createPortal(
          <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
            {pieces.map((p) => (
              <motion.span
                key={p.id}
                className="absolute block"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.emoji ? undefined : p.size,
                  height: p.emoji ? undefined : p.size * (p.round ? 1 : 0.45),
                  backgroundColor: p.emoji ? undefined : p.color,
                  borderRadius: p.round ? '999px' : '2px',
                  fontSize: p.emoji ? 18 : undefined,
                }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{ x: p.dx, y: [0, p.dy, p.dy + 420], rotate: p.rotate, opacity: [1, 1, 0] }}
                transition={{ duration: 1.8, ease: 'easeOut', times: [0, 0.35, 1] }}
              >
                {p.emoji}
              </motion.span>
            ))}
          </div>,
          document.body,
        )
      : null;

  return [layer, fire];
}

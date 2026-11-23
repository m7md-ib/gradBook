import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * A book whose pages turn like paper: drag a page with a finger or the mouse
 * and it follows, lit and shadowed as it lifts; let go and it either finishes
 * the turn or falls back. Hovering a page's outer edge lifts its corner.
 *
 * The book is a list of spreads. In the "spread" layout each spread is two
 * facing pages (start = the page read first: the right one in Arabic); in the
 * "single" layout (phones) only `end` is shown. Turning from spread t to t+1
 * lifts spreads[t].end around the spine; its back is spreads[t+1].start.
 */

export interface Spread {
  start: ReactNode | null;
  end: ReactNode | null;
}

export interface FlipBookHandle {
  /** Turns one spread forward; resolves false when it can't (busy or last). */
  next: (duration?: number) => Promise<boolean>;
  prev: (duration?: number) => Promise<boolean>;
}

export interface FlipBookProps {
  spreads: Spread[];
  spread: number;
  onSpreadChange: (spread: number) => void;
  layout: 'spread' | 'single';
  isRtl: boolean;
  /** Back of the turning sheet in the single layout (it isn't another page there). */
  singleBack?: (lowerSpread: number) => ReactNode;
  /** Spread layout: centre the closed book (spread 0 has only a cover on the end side). */
  centerClosed?: boolean;
  /** Any touch, drag or click on the book — stops autoplay. */
  onInteract?: () => void;
  reducedMotion?: boolean;
  /** Accessible names for the edge zones. */
  nextLabel: string;
  prevLabel: string;
  className?: string;
  style?: CSSProperties;
}

const EASE: [number, number, number, number] = [0.42, 0, 0.18, 1];
const DEFAULT_DURATION = 0.85;
const PEEK = 0.07;

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

interface DragState {
  x0: number;
  y0: number;
  t0: number;
  pointerId: number;
  active: boolean;
  forward: boolean;
  lower: number;
  span: number;
}

export const FlipBook = forwardRef<FlipBookHandle, FlipBookProps>(function FlipBook(
  {
    spreads,
    spread,
    onSpreadChange,
    layout,
    isRtl,
    singleBack,
    centerClosed,
    onInteract,
    reducedMotion,
    nextLabel,
    prevLabel,
    className,
    style,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 0 = the sheet lies on the end side, 1 = it has landed on the start side.
  const progress = useMotionValue(0);
  // The lower spread of the turn in progress (the sheet is spreads[turn].end), or null.
  const [turn, setTurn] = useState<number | null>(null);
  const busy = useRef(false);
  const peeking = useRef<'next' | 'prev' | null>(null);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  const last = spreads.length - 1;
  const isSpread = layout === 'spread';
  // Forward turns rotate the free edge toward the viewer: positive in RTL (spine on the right).
  const sign = isRtl ? 1 : -1;

  const rotateY = useTransform(progress, (v) => v * 180 * sign);
  const lift = useTransform(progress, [0, 0.5, 1], [1, 1.015, 1]);
  const frontShade = useTransform(progress, [0, 0.5], [0, 0.4]);
  const backShade = useTransform(progress, [0.5, 1], [0.4, 0]);
  const gloss = useTransform(progress, [0, 0.5], ['120%', '-40%']);
  const glossOpacity = useTransform(progress, [0, 0.08, 0.45, 0.5], [0, 0.55, 0.35, 0]);
  const revealShadow = useTransform(progress, [0, 0.1, 0.55, 1], [0, 0.5, 0.18, 0]);
  const landShadow = useTransform(progress, [0, 0.5, 0.9, 1], [0, 0.08, 0.4, 0]);
  // On a phone the sheet swings past the spine, off the page: fade its back there.
  const singleBackOpacity = useTransform(progress, [0.5, 0.85], [1, 0]);
  const closedShift = useTransform(progress, (v) => `${(1 - v) * 25 * (isRtl ? 1 : -1)}%`);

  const stop = () => {
    controls.current?.stop();
    controls.current = null;
  };

  const run = useCallback(
    (to: number, duration: number) =>
      new Promise<void>((resolve) => {
        stop();
        if (reducedMotion || duration <= 0) {
          progress.set(to);
          resolve();
          return;
        }
        controls.current = animate(progress, to, { duration, ease: EASE, onComplete: () => resolve() });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reducedMotion],
  );

  /** Finishes the turn of `lower` toward forward (land on the start side) or back. */
  const finish = useCallback(
    async (lower: number, forward: boolean, duration = DEFAULT_DURATION) => {
      busy.current = true;
      peeking.current = null;
      const from = progress.get();
      const distance = Math.abs((forward ? 1 : 0) - from);
      await run(forward ? 1 : 0, Math.max(0.18, duration * distance));
      onSpreadChange(forward ? lower + 1 : lower);
      setTurn(null);
      progress.set(0);
      busy.current = false;
    },
    [onSpreadChange, progress, run],
  );

  const startTurn = (lower: number, at: number) => {
    stop();
    progress.set(at);
    setTurn(lower);
  };

  const goNext = useCallback(
    async (duration?: number) => {
      if (busy.current || spread >= last) return false;
      if (peeking.current !== 'next') startTurn(spread, 0);
      await finish(spread, true, duration);
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spread, last, finish],
  );

  const goPrev = useCallback(
    async (duration?: number) => {
      if (busy.current || spread <= 0) return false;
      if (peeking.current !== 'prev') startTurn(spread - 1, 1);
      await finish(spread - 1, false, duration);
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spread, finish],
  );

  useImperativeHandle(ref, () => ({ next: goNext, prev: goPrev }), [goNext, goPrev]);

  // ── Hovering an outer edge lifts the page's corner a little ──────────────
  function peek(which: 'next' | 'prev') {
    if (busy.current || reducedMotion || drag.current) return;
    if (which === 'next' ? spread >= last : spread <= 0) return;
    peeking.current = which;
    startTurn(which === 'next' ? spread : spread - 1, which === 'next' ? 0 : 1);
    void run(which === 'next' ? PEEK : 1 - PEEK, 0.35);
  }

  async function unpeek(which: 'next' | 'prev') {
    if (peeking.current !== which || busy.current) return;
    await run(which === 'next' ? 0 : 1, 0.3);
    if (peeking.current === which && !busy.current) {
      peeking.current = null;
      setTurn(null);
      progress.set(0);
    }
  }

  // ── Dragging ─────────────────────────────────────────────────────────────
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    onInteract?.();
    if (busy.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const width = containerRef.current?.getBoundingClientRect().width ?? 1;
    drag.current = {
      x0: e.clientX,
      y0: e.clientY,
      t0: performance.now(),
      pointerId: e.pointerId,
      active: false,
      forward: true,
      lower: spread,
      span: isSpread ? width * 0.85 : width * 0.8,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;

    if (!d.active) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) {
        if (Math.abs(dy) > 14) drag.current = null; // a vertical scroll, not a turn
        return;
      }
      const forward = isRtl ? dx > 0 : dx < 0;
      if (forward ? spread >= last : spread <= 0) {
        drag.current = null;
        return;
      }
      d.active = true;
      d.forward = forward;
      d.lower = forward ? spread : spread - 1;
      peeking.current = null;
      startTurn(d.lower, forward ? 0 : 1);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // The pointer may already be gone.
      }
    }

    const towardStart = (isRtl ? dx : -dx) / d.span;
    progress.set(clamp(d.forward ? towardStart : 1 + towardStart));
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    drag.current = null;
    if (!d?.active || e.pointerId !== d.pointerId) return;
    suppressClick.current = true;
    const seconds = Math.max(0.016, (performance.now() - d.t0) / 1000);
    const velocity = (isRtl ? e.clientX - d.x0 : d.x0 - e.clientX) / d.span / seconds;
    const at = progress.get();
    const forward = Math.abs(velocity) > 1.1 ? velocity > 0 : d.forward ? at > 0.32 : at > 0.68;
    void finish(d.lower, forward, 0.6);
  }

  // ── Layers ───────────────────────────────────────────────────────────────
  const idle = turn === null;
  const startStatic = isSpread ? (idle ? spreads[spread]?.start : spreads[turn]?.start) : null;
  const endStatic = idle ? spreads[spread]?.end : spreads[turn + 1]?.end;
  const sheetFront = idle ? null : spreads[turn]?.end;
  const sheetBack = idle ? null : isSpread ? spreads[turn + 1]?.start : singleBack?.(turn);

  const halfStyle = (side: 'start' | 'end'): CSSProperties =>
    isSpread ? { insetInlineStart: side === 'start' ? 0 : '50%', width: '50%' } : { insetInlineStart: 0, width: '100%' };
  const spineOrigin = isRtl ? '100% 50%' : '0% 50%';
  // Shadows fall from the spine toward the outer edge.
  const fromSpine = `linear-gradient(to ${isRtl ? 'left' : 'right'}, rgba(0,0,0,0.55), rgba(0,0,0,0.12) 45%, transparent 85%)`;
  const toSpine = `linear-gradient(to ${isRtl ? 'right' : 'left'}, rgba(0,0,0,0.45), transparent 70%)`;

  const shift =
    isSpread && centerClosed ? (turn === 0 ? closedShift : idle && spread === 0 ? `${25 * (isRtl ? 1 : -1)}%` : '0%') : '0%';

  const pagesLeft = Math.max(0, last - spread);
  const stack = (count: number, side: 'start' | 'end') => {
    const layers = Math.min(4, count);
    const dir = (side === 'end') === isRtl ? -1 : 1;
    return Array.from({ length: layers }, (_, i) => `${dir * (i + 1) * 1.5}px ${(i + 1) * 1.2}px 0 ${i % 2 ? '#efe6d4' : '#e2d6bf'}`).join(', ');
  };

  return (
    <motion.div
      ref={containerRef}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn('relative select-none', className)}
      style={{ ...style, x: shift, perspective: isSpread ? 2400 : 1700, touchAction: 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      {/* Ground shadow */}
      <div
        className="pointer-events-none absolute -bottom-4 h-8 rounded-[50%] bg-black/30 blur-xl"
        style={isSpread && spread === 0 && idle ? { insetInlineStart: '52%', width: '46%' } : { insetInlineStart: '4%', width: '92%' }}
        aria-hidden
      />

      {startStatic != null && (
        <div
          className="absolute inset-y-0 overflow-hidden rounded-s-md"
          style={{ ...halfStyle('start'), boxShadow: stack(spread, 'start') }}
        >
          {startStatic}
          <motion.div className="pointer-events-none absolute inset-0" style={{ background: toSpine, opacity: landShadow }} />
        </div>
      )}

      {endStatic != null && (
        <div
          className={cn('absolute inset-y-0 overflow-hidden', isSpread ? 'rounded-e-md' : 'rounded-md')}
          style={{ ...halfStyle('end'), boxShadow: stack(pagesLeft, 'end') }}
        >
          {endStatic}
          <motion.div className="pointer-events-none absolute inset-0" style={{ background: fromSpine, opacity: revealShadow }} />
        </div>
      )}

      {isSpread && (startStatic != null || (turn !== null && turn > 0)) && (
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-8 -translate-x-1/2 rtl:translate-x-1/2"
          style={{
            insetInlineStart: '50%',
            background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.16) 45%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.16) 55%, transparent)',
          }}
          aria-hidden
        />
      )}

      {!idle && (
        <motion.div
          className="absolute inset-y-0 z-20"
          style={{
            ...halfStyle('end'),
            rotateY,
            scale: lift,
            transformOrigin: spineOrigin,
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className={cn('absolute inset-0 overflow-hidden', isSpread ? 'rounded-e-md' : 'rounded-md')}
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {sheetFront}
            <motion.div className="pointer-events-none absolute inset-0" style={{ background: fromSpine, opacity: frontShade }} />
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: glossOpacity,
                backgroundImage: 'linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.65) 50%, transparent 65%)',
                backgroundSize: '220% 100%',
                backgroundPositionX: gloss,
              }}
            />
          </div>
          <motion.div
            className={cn('absolute inset-0 overflow-hidden', isSpread ? 'rounded-s-md' : 'rounded-md')}
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              opacity: isSpread ? 1 : singleBackOpacity,
            }}
          >
            {sheetBack}
            <motion.div className="pointer-events-none absolute inset-0" style={{ background: toSpine, opacity: backShade }} />
          </motion.div>
        </motion.div>
      )}

      {/* Outer edges: hover lifts the corner, a click turns the page. */}
      {spread < last && (
        <button
          type="button"
          aria-label={nextLabel}
          // A pointer shortcut; keyboard and screen-reader users have the arrow buttons.
          aria-hidden
          tabIndex={-1}
          className="absolute inset-y-0 z-30 w-[13%] cursor-pointer outline-none"
          style={{ insetInlineEnd: 0 }}
          onPointerEnter={(e) => e.pointerType === 'mouse' && peek('next')}
          onPointerLeave={(e) => e.pointerType === 'mouse' && void unpeek('next')}
          onClick={() => {
            onInteract?.();
            void goNext();
          }}
        />
      )}
      {spread > 0 && (
        <button
          type="button"
          aria-label={prevLabel}
          aria-hidden
          tabIndex={-1}
          className="absolute inset-y-0 z-30 w-[13%] cursor-pointer outline-none"
          style={{ insetInlineStart: 0 }}
          onPointerEnter={(e) => e.pointerType === 'mouse' && isSpread && peek('prev')}
          onPointerLeave={(e) => e.pointerType === 'mouse' && isSpread && void unpeek('prev')}
          onClick={() => {
            onInteract?.();
            void goPrev();
          }}
        />
      )}
    </motion.div>
  );
});

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { FALLBACK_THEME, type NotebookThemeStyle } from './types';

export interface PageSurfaceProps {
  children?: ReactNode;
  theme?: NotebookThemeStyle;
  /** Which side of an open book the page sits on; "start" is read first (the right page in Arabic). */
  side?: 'start' | 'end' | 'single';
  pageNumber?: number;
  /** Faint ruled lines, like a real notebook page. */
  ruled?: boolean;
  className?: string;
}

/** One sheet of paper: fills its slot in the book and scrolls inside when the content is long. */
export function PageSurface({ children, theme = FALLBACK_THEME, side = 'single', pageNumber, ruled, className }: PageSurfaceProps) {
  return (
    <div
      className={cn('paper-texture relative flex h-full w-full flex-col overflow-hidden', className)}
      style={{
        backgroundColor: theme.paperColor,
        color: theme.inkColor,
        backgroundImage: ruled
          ? `repeating-linear-gradient(to bottom, transparent 0, transparent 31px, ${theme.accentColor}22 31px, ${theme.accentColor}22 32px)`
          : undefined,
      }}
    >
      {/* The page curves into the spine: a soft shadow along that edge. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 from-black/[0.13] to-transparent',
          side === 'start'
            ? 'end-0 w-12 bg-gradient-to-l rtl:bg-gradient-to-r'
            : cn('start-0 bg-gradient-to-r rtl:bg-gradient-to-l', side === 'end' ? 'w-12' : 'w-6 from-black/[0.08]'),
        )}
      />
      <div
        className="scrollbar-thin relative flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-7 sm:py-7"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </div>
      {pageNumber !== undefined && (
        <div className="relative pb-2.5 text-center text-xs opacity-40" style={{ fontFamily: theme.bodyFont }}>
          {pageNumber}
        </div>
      )}
    </div>
  );
}

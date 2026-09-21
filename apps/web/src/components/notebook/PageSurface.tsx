import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { FALLBACK_THEME, type NotebookThemeStyle } from './types';

export interface PageSurfaceProps {
  children: ReactNode;
  theme?: NotebookThemeStyle;
  side?: 'left' | 'right' | 'single';
  pageNumber?: number;
  className?: string;
}

export function PageSurface({ children, theme = FALLBACK_THEME, side = 'single', pageNumber, className }: PageSurfaceProps) {
  return (
    <div
      className={cn(
        'paper-texture relative flex h-full min-h-[420px] flex-col overflow-hidden',
        side === 'left' && 'rounded-s-md',
        side === 'right' && 'rounded-e-md',
        side === 'single' && 'rounded-md',
        className,
      )}
      style={{ backgroundColor: theme.paperColor, color: theme.inkColor }}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 w-10',
          side === 'left' && 'end-0 bg-gradient-to-l rtl:bg-gradient-to-r from-black/10 to-transparent',
          side === 'right' && 'start-0 bg-gradient-to-r rtl:bg-gradient-to-l from-black/10 to-transparent',
        )}
      />
      <div className="relative flex flex-1 flex-col overflow-y-auto scrollbar-thin px-5 py-6 sm:px-8 sm:py-8">
        {children}
      </div>
      {pageNumber !== undefined && (
        <div className="relative pb-3 text-center text-xs opacity-40" style={{ fontFamily: theme.bodyFont }}>
          {pageNumber}
        </div>
      )}
    </div>
  );
}

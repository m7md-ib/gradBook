import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { DEFAULT_COVER_ELEMENTS, FALLBACK_THEME, type CoverElementsVisibility, type NotebookThemeStyle } from './types';

export interface CoverRendererProps {
  theme?: NotebookThemeStyle;
  coverImageUrl?: string | null;
  coverQuote?: string | null;
  elements?: CoverElementsVisibility;
  overlayOpacity?: number;
  graduateName: string;
  major?: string | null;
  institution?: string | null;
  graduationYear?: number | null;
  graduationDate?: string | null;
  className?: string;
  compact?: boolean;
}

export function CoverRenderer({
  theme = FALLBACK_THEME,
  coverImageUrl,
  coverQuote,
  elements = DEFAULT_COVER_ELEMENTS,
  overlayOpacity = 0.4,
  graduateName,
  major,
  institution,
  graduationYear,
  graduationDate,
  className,
  compact,
}: CoverRendererProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const backgroundStyle = coverImageUrl
    ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(160deg, ${theme.coverGradientFrom}, ${theme.coverGradientTo})` };

  return (
    <div
      className={cn(
        'relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-[10px]',
        'shadow-book ring-1 ring-black/10',
        className,
      )}
      style={backgroundStyle}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(to top, rgba(0,0,0,${overlayOpacity + 0.25}), rgba(0,0,0,${overlayOpacity * 0.3}) 55%, rgba(0,0,0,0.05))` }}
      />
      <div className="pointer-events-none absolute inset-3 rounded-[6px] border border-white/25" />

      {elements.showQuote && coverQuote && (
        <p
          className={cn(
            'absolute top-6 w-full px-6 text-center text-sm italic text-white/85 sm:top-8 sm:text-base',
            compact && 'top-4 text-xs sm:text-xs',
          )}
        >
          “{coverQuote}”
        </p>
      )}

      <div className={cn('relative flex flex-col gap-1 px-5 pb-6 text-white sm:px-7 sm:pb-8', compact && 'px-3 pb-3 gap-0.5')}>
        {elements.showGraduationYear && graduationYear && (
          <span
            className={cn(
              'mb-1 inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm',
              compact && 'px-2 py-0.5 text-[10px] mb-0.5',
            )}
          >
            {graduationYear}
          </span>
        )}
        {elements.showName && (
          <h2
            className={cn('font-heading-auto text-3xl font-bold leading-tight sm:text-4xl', compact && 'text-lg sm:text-lg')}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {graduateName}
          </h2>
        )}
        {(elements.showMajor || elements.showInstitution) && (
          <p className={cn('text-sm text-white/90 sm:text-base', compact && 'text-[11px]')}>
            {[elements.showMajor ? major : null, elements.showInstitution ? institution : null]
              .filter(Boolean)
              .join(' — ')}
          </p>
        )}
        {elements.showGraduationDate && graduationDate && (
          <p className={cn('text-xs text-white/70', compact && 'text-[10px]')}>{graduationDate}</p>
        )}
      </div>
    </div>
  );
}

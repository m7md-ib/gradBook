import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { CoverStyle } from '@daftar/shared';
import { cn } from '@/lib/cn';
import { DEFAULT_COVER_ELEMENTS, FALLBACK_THEME, type CoverElementsVisibility, type NotebookThemeStyle } from './types';

export interface CoverCropValue {
  /** Focal point in percent (0–100). */
  x: number;
  y: number;
  zoom: number;
}

export interface CoverRendererProps {
  theme?: NotebookThemeStyle;
  coverImageUrl?: string | null;
  coverQuote?: string | null;
  elements?: CoverElementsVisibility;
  overlayOpacity?: number;
  /** Image framing chosen by the owner; centred and unzoomed when absent. */
  crop?: CoverCropValue | null;
  /** Text size / colour / font / alignment chosen by the owner. */
  coverStyle?: Partial<CoverStyle> | null;
  graduateName: string;
  major?: string | null;
  institution?: string | null;
  graduationYear?: number | null;
  graduationDate?: string | null;
  className?: string;
  compact?: boolean;
}

/** CSS font stacks for the name-font choices (all loaded in index.html). */
export const COVER_FONT_FAMILIES: Record<CoverStyle['nameFont'], string | undefined> = {
  theme: undefined,
  ruqaa: '"Aref Ruqaa", serif',
  amiri: '"Amiri", serif',
  cairo: '"Cairo", sans-serif',
  tajawal: '"Tajawal", sans-serif',
  playfair: '"Playfair Display", serif',
};

export function CoverRenderer({
  theme = FALLBACK_THEME,
  coverImageUrl,
  coverQuote,
  elements = DEFAULT_COVER_ELEMENTS,
  overlayOpacity = 0.4,
  crop,
  coverStyle,
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

  const nameScale = coverStyle?.nameScale ?? 1;
  const textScale = coverStyle?.textScale ?? 1;
  const textColor = coverStyle?.textColor ?? '#FFFFFF';
  const nameFont = COVER_FONT_FAMILIES[coverStyle?.nameFont ?? 'theme'];
  const centered = coverStyle?.align === 'center';

  const focus = `${crop?.x ?? 50}% ${crop?.y ?? 50}%`;
  const imageStyle: CSSProperties = {
    objectPosition: focus,
    transform: `scale(${crop?.zoom ?? 1})`,
    transformOrigin: focus,
  };

  return (
    <div
      className={cn(
        'relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-[10px]',
        'shadow-book ring-1 ring-black/10',
        className,
      )}
      style={
        coverImageUrl
          ? undefined
          : { background: `linear-gradient(160deg, ${theme.coverGradientFrom}, ${theme.coverGradientTo})` }
      }
    >
      {coverImageUrl && (
        <img
          src={coverImageUrl}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          style={imageStyle}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(to top, rgba(0,0,0,${overlayOpacity + 0.25}), rgba(0,0,0,${overlayOpacity * 0.3}) 55%, rgba(0,0,0,0.05))` }}
      />
      <div className="pointer-events-none absolute inset-3 rounded-[6px] border border-white/25" />

      {elements.showQuote && coverQuote && (
        <p
          className={cn(
            'absolute top-6 w-full px-6 text-center text-sm italic sm:top-8 sm:text-base',
            compact && 'top-4 text-xs sm:text-xs',
          )}
          style={{ color: textColor, opacity: 0.85 }}
        >
          <span style={{ fontSize: `${textScale}em` }}>“{coverQuote}”</span>
        </p>
      )}

      <div
        className={cn(
          'relative flex flex-col gap-1 px-5 pb-6 sm:px-7 sm:pb-8',
          centered && 'items-center text-center',
          compact && 'gap-0.5 px-3 pb-3',
        )}
        style={{ color: textColor }}
      >
        {elements.showGraduationYear && graduationYear && (
          <span
            className={cn(
              'mb-1 inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm',
              compact && 'mb-0.5 px-2 py-0.5 text-[10px]',
            )}
          >
            {graduationYear}
          </span>
        )}
        {elements.showName && (
          <h2
            className={cn(
              'font-bold leading-tight text-3xl sm:text-4xl',
              !nameFont && 'font-heading-auto',
              compact && 'text-lg sm:text-lg',
            )}
            style={nameFont ? { fontFamily: nameFont } : undefined}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <span style={{ fontSize: `${nameScale}em` }}>{graduateName}</span>
          </h2>
        )}
        {(elements.showMajor || elements.showInstitution) && (
          <p className={cn('text-sm opacity-90 sm:text-base', compact && 'text-[11px] sm:text-[11px]')}>
            <span style={{ fontSize: `${textScale}em` }}>
              {[elements.showMajor ? major : null, elements.showInstitution ? institution : null]
                .filter(Boolean)
                .join(' — ')}
            </span>
          </p>
        )}
        {elements.showGraduationDate && graduationDate && (
          <p className={cn('text-xs opacity-70', compact && 'text-[10px]')}>
            <span style={{ fontSize: `${textScale}em` }}>{graduationDate}</span>
          </p>
        )}
      </div>
    </div>
  );
}

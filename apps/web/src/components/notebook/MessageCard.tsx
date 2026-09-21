import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

export interface MessageCardProps {
  authorName: string;
  body: string;
  relationship: string;
  reaction?: string | null;
  photoUrl?: string | null;
  featured?: boolean;
  className?: string;
}

const RELATIONSHIP_ICON: Record<string, string> = {
  friend: '🤍',
  family: '👨‍👩‍👧',
  classmate: '🎒',
  teacher: '🍎',
  colleague: '💼',
  other: '✨',
};

/** Deterministic small rotation from the text itself, so a note looks hand-placed
 *  but never jitters between re-renders. */
function useNoteTilt(seed: string): number {
  return useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
    return (hash % 5) - 2; // -2deg..2deg
  }, [seed]);
}

export function MessageCard({ authorName, body, relationship, reaction, photoUrl, featured, className }: MessageCardProps) {
  const { t } = useTranslation();
  const tilt = useNoteTilt(authorName + body.length);

  return (
    <div
      className={cn(
        'relative mx-auto flex w-full max-w-md flex-col gap-3 rounded-sm border border-ink/10 bg-[#FFFEF9] p-5 shadow-page-lg sm:p-6',
        featured && 'ring-2 ring-gold-400',
        className,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span
        className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 rotate-2 rounded-sm bg-gold-200/70 shadow-sm"
        aria-hidden
      />

      {featured && (
        <span className="absolute -top-3 rtl:right-3 ltr:left-3 rounded-full bg-gold-500 px-2.5 py-0.5 text-[11px] font-semibold text-ink shadow-sm">
          ⭐ {t('notebook.featured')}
        </span>
      )}

      <div className="flex items-center gap-2 text-xs text-ink/50">
        <span>{RELATIONSHIP_ICON[relationship] ?? '✨'}</span>
        <span>{t(`notebook.relationship.${relationship}`, relationship)}</span>
      </div>

      {photoUrl && (
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          className="h-40 w-full rounded-sm object-cover shadow-page"
        />
      )}

      <p className="whitespace-pre-wrap font-body text-[15px] leading-relaxed text-ink/90 sm:text-base">{body}</p>

      <div className="mt-1 flex items-center justify-end gap-2 font-heading-auto text-lg text-ink/80">
        <span>—</span>
        <span className="font-bold">{authorName}</span>
        {reaction && <span className="text-xl">{reaction}</span>}
      </div>
    </div>
  );
}

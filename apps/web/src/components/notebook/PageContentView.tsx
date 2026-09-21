import { useTranslation } from 'react-i18next';
import { MessageCard } from './MessageCard';
import type { NotebookPageContent } from './types';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';

export function PageContentView({
  content,
  onWriteClick,
}: {
  content: NotebookPageContent;
  onWriteClick?: () => void;
}) {
  const { t, i18n } = useTranslation();

  switch (content.kind) {
    case 'intro':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center animate-fade-up">
          {content.showProfilePhoto && content.profilePhotoUrl && (
            <img
              src={content.profilePhotoUrl}
              alt={content.graduateName}
              className="h-24 w-24 rounded-full object-cover shadow-page-lg ring-4 ring-white sm:h-28 sm:w-28"
            />
          )}
          <h2 className="font-heading-auto text-2xl font-bold sm:text-3xl">{content.graduateName}</h2>
          <p className="text-sm opacity-70 sm:text-base">
            {content.major} — {content.institution}
          </p>
          {content.welcomeMessage && (
            <p className="mt-2 max-w-sm whitespace-pre-wrap text-sm leading-relaxed opacity-90 sm:text-base">
              {content.welcomeMessage}
            </p>
          )}
        </div>
      );

    case 'write-cta':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
          <p className="max-w-xs font-heading-auto text-xl leading-relaxed sm:text-2xl">
            {t('notebook.introDefaultMessage')}
          </p>
          {onWriteClick && (
            <Button size="lg" onClick={onWriteClick}>
              ✍️ {t('notebook.writeButton')}
            </Button>
          )}
        </div>
      );

    case 'message':
      return (
        <div className="flex h-full items-center justify-center">
          <MessageCard
            authorName={content.authorName}
            body={content.body}
            relationship={content.relationship}
            reaction={content.reaction}
            photoUrl={content.photoUrl}
            featured={content.featured}
          />
        </div>
      );

    case 'gallery-divider':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl">🖼️</span>
          <h3 className="font-heading-auto text-2xl font-bold">{t('notebook.memoriesTitle')}</h3>
        </div>
      );

    case 'gallery':
      return (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {content.items.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-md shadow-page">
              <img src={item.imageUrl} alt={item.caption ?? ''} loading="lazy" className="aspect-square w-full object-cover" />
              {item.caption && <figcaption className="p-1.5 text-center text-[11px] opacity-70">{item.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );

    case 'timeline-divider':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl">🗺️</span>
          <h3 className="font-heading-auto text-2xl font-bold">{t('notebook.timelineTitle')}</h3>
        </div>
      );

    case 'timeline':
      return (
        <ol className="relative flex flex-col gap-5 ps-5">
          <div className="absolute top-1 bottom-1 start-[7px] w-px bg-current opacity-20" />
          {content.items.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -start-5 top-1.5 h-2.5 w-2.5 rounded-full bg-maroon-600" />
              {item.date && <div className="text-xs opacity-60">{formatDate(item.date, i18n.language)}</div>}
              <div className="font-heading-auto text-lg font-bold">{item.title}</div>
              {item.description && <p className="text-sm opacity-80">{item.description}</p>}
            </li>
          ))}
        </ol>
      );

    case 'end':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <span className="text-4xl">💛</span>
          <p className="max-w-xs font-heading-auto text-xl leading-relaxed">{t('notebook.endMessage')}</p>
          <p className="max-w-xs text-sm opacity-70">— {content.graduateName}</p>
        </div>
      );

    default:
      return null;
  }
}

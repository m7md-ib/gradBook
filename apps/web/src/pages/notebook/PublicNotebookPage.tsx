import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Notebook3D, type NotebookPageContent } from '@/components/notebook';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import {
  usePublicNotebook,
  usePublicMessages,
  usePublicGallery,
  usePublicTimeline,
  useSubmitAccessCode,
  useSubmitMessage,
} from '@/hooks/usePublicNotebook';
import { useThemes } from '@/hooks/useCatalog';
import { isExpiredView, publicEndpoints } from '@/api/endpoints/public';
import { getApiErrorCode, getApiErrorMessage } from '@/api/client';
import { AccessCodeGate } from './AccessCodeGate';
import { ExpiredScreen } from './ExpiredScreen';
import { WriteMessageModal } from './WriteMessageModal';
import { MusicControl } from './MusicControl';
import { ShareBar } from '@/components/ShareBar';

export default function PublicNotebookPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const { data, isLoading, error, refetch } = usePublicNotebook(slug);
  const notebook = data && !isExpiredView(data) ? data : undefined;

  const { data: themes } = useThemes();
  const { data: messagesData } = usePublicMessages(notebook ? slug : undefined, 1, undefined);
  const { data: galleryData } = usePublicGallery(notebook?.allowGallery ? slug : undefined);
  const { data: timelineData } = usePublicTimeline(notebook ? slug : undefined);

  const submitAccessCode = useSubmitAccessCode(slug);
  const submitMessage = useSubmitMessage(slug);

  const [pageIndex, setPageIndex] = useState(0);
  const [bookOpened, setBookOpened] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [writeTarget, setWriteTarget] = useState<string | undefined>();
  const [accessError, setAccessError] = useState<string | undefined>();

  useEffect(() => {
    if (searchParams.get('src') === 'qr' && slug) {
      void publicEndpoints.trackEvent(slug, 'qr_scan');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const theme = themes?.find((th) => th.slug === notebook?.themeSlug);

  const pages = useMemo<NotebookPageContent[]>(() => {
    if (!notebook) return [];
    const list: NotebookPageContent[] = [];
    const graduate = notebook.graduates[0];

    if (graduate) {
      list.push({
        kind: 'intro',
        graduateName: notebook.type === 'class' ? notebook.title ?? graduate.fullName : graduate.fullName,
        institution: graduate.institution,
        major: graduate.major,
        profilePhotoUrl: graduate.profilePhotoUrl,
        welcomeMessage: notebook.welcomeMessage,
        showProfilePhoto: notebook.showProfilePhoto,
      });
    }
    list.push({ kind: 'write-cta' });

    for (const m of messagesData?.items ?? []) {
      list.push({
        kind: 'message',
        id: m.id,
        authorName: m.authorName,
        body: m.body,
        relationship: m.relationship,
        reaction: m.reaction,
        photoUrl: m.photoUrl,
        featured: m.featured,
        pageNumber: m.pageNumber,
      });
    }

    if (notebook.allowGallery && galleryData && galleryData.items.length > 0) {
      list.push({ kind: 'gallery-divider' });
      for (let i = 0; i < galleryData.items.length; i += 4) {
        list.push({ kind: 'gallery', items: galleryData.items.slice(i, i + 4).map((g) => ({ id: g.id, imageUrl: g.imageUrl, caption: g.caption })) });
      }
    }

    if (timelineData && timelineData.length > 0) {
      list.push({ kind: 'timeline-divider' });
      list.push({
        kind: 'timeline',
        items: timelineData.map((tl) => ({ id: tl.id, title: tl.title, description: tl.description, date: tl.date })),
      });
    }

    list.push({ kind: 'end', graduateName: graduate?.fullName ?? '' });
    return list;
  }, [notebook, messagesData, galleryData, timelineData]);

  if (isLoading) return <PageSpinner />;

  if (error) {
    if (getApiErrorCode(error) === 'access_code_required') {
      return (
        <AccessCodeGate
          error={accessError}
          loading={submitAccessCode.isPending}
          onSubmit={async (code) => {
            try {
              await submitAccessCode.mutateAsync(code);
              setAccessError(undefined);
              await refetch();
            } catch (e) {
              setAccessError(getApiErrorMessage(e, t('notebook.accessCodeError') ?? undefined));
            }
          }}
        />
      );
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper text-center">
        <span className="text-4xl">📕</span>
        <p className="text-ink/60">{getApiErrorMessage(error)}</p>
      </div>
    );
  }

  if (!data) return null;
  if (isExpiredView(data)) return <ExpiredScreen data={data} />;
  if (!notebook) return null;

  const graduate = notebook.graduates[0];
  const notebookUrl = `${window.location.origin}/d/${notebook.slug}`;

  async function handleWriteSubmit(values: Parameters<typeof submitMessage.mutateAsync>[0] & { photoFile?: File | null }) {
    const result = await submitMessage.mutateAsync(values);
    if (!result.requiresApproval) {
      toast.success(t('notebook.writeFormSuccess'));
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-16">
      <Helmet>
        <title>
          {graduate?.fullName} — {t('common.appName')}
        </title>
        <meta property="og:title" content={`${graduate?.fullName} — ${t('common.appName')}`} />
        <meta property="og:description" content={t('notebook.sharePreviewText', { name: graduate?.fullName ?? '' }) ?? ''} />
        {notebook.coverImageUrl && <meta property="og:image" content={notebook.coverImageUrl} />}
      </Helmet>

      {notebook.musicEnabled && notebook.musicTrackId && <MusicControl trackUrl={notebook.musicTrackId} />}

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-10">
        <Notebook3D
          cover={{
            theme,
            coverImageUrl: notebook.coverImageUrl,
            coverQuote: notebook.coverQuote,
            elements: notebook.coverElements,
            overlayOpacity: notebook.coverOverlayOpacity,
            graduateName: notebook.type === 'class' ? notebook.title ?? '' : graduate?.fullName ?? '',
            major: graduate?.major,
            institution: graduate?.institution,
            graduationYear: graduate?.graduationYear,
            graduationDate: graduate?.graduationDate,
          }}
          book={{
            theme,
            pages,
            currentIndex: pageIndex,
            onIndexChange: setPageIndex,
            onWriteClick: () => {
              setWriteTarget(undefined);
              setWriteOpen(true);
              void publicEndpoints.trackEvent(slug!, 'write_start');
            },
          }}
          onOpen={() => {
            setBookOpened(true);
            void publicEndpoints.trackEvent(slug!, 'notebook_open');
          }}
        />

        {bookOpened && (
          <div className="fixed bottom-5 z-30 ltr:left-5 rtl:right-5">
            <Button
              size="lg"
              className="shadow-book"
              onClick={() => {
                setWriteTarget(undefined);
                setWriteOpen(true);
              }}
            >
              ✍️ {t('notebook.writeButton')}
            </Button>
          </div>
        )}

        {bookOpened && (
          <div className="w-full max-w-sm">
            <ShareBar
              url={notebookUrl}
              text={t('notebook.sharePreviewText', { name: graduate?.fullName ?? '' }) ?? ''}
            />
          </div>
        )}
      </div>

      <WriteMessageModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onSubmit={handleWriteSubmit}
        graduates={notebook.graduates}
        defaultTargetGraduateId={writeTarget}
      />
    </div>
  );
}

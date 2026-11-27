import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Notebook3D, type NotebookPageContent } from '@/components/notebook';
import { PageSpinner } from '@/components/ui/Spinner';
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
import { useConfetti } from '@/components/landing/Confetti';

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
  const [confetti, fireConfetti] = useConfetti();
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

  const firstName = notebook.type === 'class' ? undefined : graduate?.fullName.split(/\s+/)[0];
  const shareText = t('notebook.sharePreviewText', { name: graduate?.fullName ?? '' }) ?? '';

  async function handleWriteSubmit(values: Parameters<typeof submitMessage.mutateAsync>[0] & { photoFile?: File | null }) {
    const result = await submitMessage.mutateAsync(values);
    // A little celebration once the message is in the book.
    fireConfetti(window.innerWidth / 2, window.innerHeight * 0.35, 80);
    return { requiresApproval: result.requiresApproval };
  }

  async function shareNotebook() {
    if (navigator.share) {
      try {
        await navigator.share({ url: notebookUrl, text: shareText, title: shareText });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(notebookUrl);
      toast.success(t('common.copied'));
    }
  }

  function openWrite() {
    setWriteTarget(undefined);
    setWriteOpen(true);
    void publicEndpoints.trackEvent(slug!, 'write_start');
  }

  return (
    <div className="min-h-screen bg-paper bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,#EFDDBF_0%,transparent_70%)] pb-16">
      <Helmet>
        <title>
          {graduate?.fullName} — {t('common.appName')}
        </title>
        <meta property="og:title" content={`${graduate?.fullName} — ${t('common.appName')}`} />
        <meta property="og:description" content={t('notebook.sharePreviewText', { name: graduate?.fullName ?? '' }) ?? ''} />
        {notebook.coverImageUrl && <meta property="og:image" content={notebook.coverImageUrl} />}
        {/* Graduates' notebooks are shared by link, not meant to show up in search results. */}
        <meta name="robots" content="noindex" />
      </Helmet>

      {confetti}
      {notebook.musicEnabled && notebook.musicTrackId && <MusicControl trackUrl={notebook.musicTrackId} />}

      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-4">
        <Link to="/" className="font-heading-auto text-xl font-bold text-maroon-700">
          📖 {t('common.appName')}
        </Link>
        <Link
          to="/"
          className="rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-maroon-700 shadow-page ring-1 ring-ink/5 backdrop-blur"
        >
          🎓 {t('notebook.makeYourOwnShort')}
        </Link>
      </header>

      {/* pb-32: the floating "write" button must not cover the share card at the end. */}
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 pb-32 pt-4">
        <Notebook3D
          cover={{
            theme,
            coverImageUrl: notebook.coverImageUrl,
            coverQuote: notebook.coverQuote,
            elements: notebook.coverElements,
            overlayOpacity: notebook.coverOverlayOpacity,
            crop: notebook.coverCrop,
            coverStyle: notebook.coverStyle,
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
            onWriteClick: openWrite,
          }}
          // Header on top, page controls and the pinned "write" button below.
          reservedHeight="17.5rem"
          onOpen={() => {
            setBookOpened(true);
            void publicEndpoints.trackEvent(slug!, 'notebook_open');
          }}
        />

        {bookOpened && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-md rounded-3xl bg-white/80 p-5 shadow-page ring-1 ring-ink/5"
          >
            <h2 className="mb-3 text-center font-heading-auto text-lg font-bold text-ink">{t('notebook.shareWithOthers')}</h2>
            <ShareBar url={notebookUrl} text={shareText} />
          </motion.section>
        )}

        {bookOpened && (
          <Link
            to="/"
            className="group flex w-full max-w-md items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-night-800 via-maroon-700 to-maroon-600 p-5 text-white shadow-book"
          >
            <span className="text-4xl transition-transform group-hover:-rotate-6">🎓</span>
            <span className="flex-1">
              <span className="block font-heading-auto text-lg font-bold text-gold-100">{t('notebook.makeYourOwn')}</span>
              <span className="block text-sm text-white/70">{t('notebook.makeYourOwnHint')}</span>
            </span>
            <Icon name="chevron" className="h-5 w-5 text-white/60 rtl:rotate-180" />
          </Link>
        )}
      </div>

      <AnimatePresence>
        {bookOpened && !writeOpen && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.4 }}
            className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={openWrite}
              className="relative flex w-full max-w-sm items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-l from-maroon-600 to-maroon-500 py-4 text-lg font-bold text-white shadow-book active:scale-[0.98]"
            >
              <span
                className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.22)_50%,transparent_65%)] bg-[length:200%_100%]"
                aria-hidden
              />
              <span className="relative">✍️ {firstName ? t('notebook.writeTo', { name: firstName }) : t('notebook.writeButton')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <WriteMessageModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onSubmit={handleWriteSubmit}
        graduates={notebook.graduates}
        defaultTargetGraduateId={writeTarget}
        recipientName={firstName}
        onShare={shareNotebook}
      />
    </div>
  );
}

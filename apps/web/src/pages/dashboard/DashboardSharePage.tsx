import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNotebookQr, useRegenerateQr } from '@/hooks/useNotebook';
import { Icon } from '@/components/ui/Icon';
import { PageHeader, Panel } from '@/components/ui/PageHeader';
import { PageSpinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/api/client';
import { cn } from '@/lib/cn';
import type { NotebookDto } from '@/types/api';

export default function DashboardSharePage() {
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const { t } = useTranslation();
  const { data: qr, isLoading } = useNotebookQr(notebook.id);
  const regenerate = useRegenerateQr(notebook.id);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/d/${notebook.slug}`;
  const graduate = notebook.graduates?.[0];
  const name = notebook.type === 'class' ? notebook.title ?? '' : graduate?.fullName ?? '';
  const text = t('notebook.sharePreviewText', { name }) ?? '';
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t('common.copied'));
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    try {
      await navigator.share({ url, text, title: text });
    } catch {
      // cancelled
    }
  }

  async function handleRegenerate() {
    try {
      await regenerate.mutateAsync();
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const channels = [
    {
      key: 'whatsapp',
      label: t('dashboard.shareWhatsapp'),
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      className: 'bg-[#25D366] text-white',
      icon: <Icon name="whatsapp" className="h-5 w-5" />,
    },
    {
      key: 'telegram',
      label: t('dashboard.shareTelegram'),
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      className: 'bg-[#229ED9] text-white',
      icon: <span className="text-base">✈️</span>,
    },
    {
      key: 'x',
      label: t('dashboard.shareTwitter'),
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      className: 'bg-ink text-white',
      icon: <span className="text-base font-black">𝕏</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon="share" title={t('dashboard.shareTitle')} subtitle={t('dashboard.shareSubtitle')} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-night-800 via-maroon-700 to-maroon-600 p-5 text-white shadow-book sm:p-6"
      >
        <div className="absolute -top-16 h-48 w-48 rounded-full bg-gold-400/30 blur-3xl ltr:-right-10 rtl:-left-10" aria-hidden />
        <p className="relative text-sm text-white/70">{t('dashboard.shareLink')}</p>
        <div className="relative mt-2 flex items-center gap-2 rounded-2xl bg-white/10 p-1.5 ps-3.5 ring-1 ring-white/15 backdrop-blur-md">
          <span className="min-w-0 flex-1 truncate text-[15px] font-medium" dir="ltr">
            {url.replace(/^https?:\/\//, '')}
          </span>
          <button
            type="button"
            onClick={copy}
            className={cn(
              'flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold shadow-md transition active:scale-95',
              copied ? 'bg-emerald-400 text-ink' : 'bg-gold-400 text-ink hover:bg-gold-300',
            )}
          >
            <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {channels.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className={cn('flex flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-bold shadow-md transition hover:brightness-110 active:scale-95', c.className)}
            >
              {c.icon}
              {c.label}
            </a>
          ))}
        </div>
        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-sm font-bold ring-1 ring-white/20 transition hover:bg-white/25 active:scale-[0.99]"
          >
            <Icon name="share" className="h-4 w-4" />
            {t('dashboard.shareMore')}
          </button>
        )}
      </motion.div>

      <Panel title={t('dashboard.qrTitle')} hint={t('dashboard.qrHint')}>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="relative rounded-3xl bg-gradient-to-br from-gold-200 via-white to-gold-100 p-3 shadow-page-lg">
            {isLoading ? (
              <div className="flex h-48 w-48 items-center justify-center">
                <PageSpinner />
              </div>
            ) : (
              qr && <img src={qr.imageUrl} alt="QR" className="h-48 w-48 rounded-2xl bg-white p-2" />
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1">
            {qr && (
              <a
                href={qr.imageUrl}
                download={`daftar-${notebook.slug}-qr.png`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-maroon-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-maroon-700 active:scale-[0.99]"
              >
                <Icon name="download" className="h-4 w-4" />
                {t('dashboard.shareQrDownload')}
              </a>
            )}
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerate.isPending}
              className="flex items-center justify-center gap-2 rounded-2xl bg-ink/[0.04] py-3 text-sm font-semibold text-ink/70 transition hover:bg-ink/[0.08] disabled:opacity-60"
            >
              <Icon name="refresh" className={cn('h-4 w-4', regenerate.isPending && 'animate-spin')} />
              {t('dashboard.shareQrRegenerate')}
            </button>
            <p className="text-center text-xs text-ink/45 sm:text-start">{t('dashboard.qrPrintTip')}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

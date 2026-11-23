import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useFeatureMessage, useModerateMessage, useOwnerMessages } from '@/hooks/useMessages';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatRelativeDay } from '@/lib/format';
import { getApiErrorMessage } from '@/api/client';
import { cn } from '@/lib/cn';
import type { NotebookDto } from '@/types/api';
import type { MessageStatus } from '@daftar/shared';

const FILTERS: Array<{ value: MessageStatus | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'dashboard.messagesFilterAll' },
  { value: 'pending', labelKey: 'dashboard.messagesFilterPending' },
  { value: 'approved', labelKey: 'dashboard.messagesFilterApproved' },
  { value: 'hidden', labelKey: 'dashboard.messagesFilterHidden' },
];

const AVATAR_TINTS = [
  'from-maroon-400 to-maroon-600',
  'from-gold-400 to-gold-600',
  'from-sky-400 to-indigo-500',
  'from-emerald-400 to-teal-600',
  'from-fuchsia-400 to-purple-600',
];

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function ActionButton({
  icon,
  label,
  onClick,
  tone = 'plain',
  active,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  tone?: 'plain' | 'primary' | 'danger';
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95',
        tone === 'primary' && 'bg-maroon-600 text-white shadow-sm hover:bg-maroon-700',
        tone === 'danger' && 'text-red-600 hover:bg-red-50',
        tone === 'plain' && (active ? 'bg-gold-100 text-gold-800 ring-1 ring-gold-300' : 'bg-ink/[0.04] text-ink/70 hover:bg-ink/[0.08]'),
      )}
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function DashboardMessagesPage() {
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<MessageStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useOwnerMessages(notebook.id, {
    status: status === 'all' ? undefined : status,
    search: search || undefined,
    page: 1,
    pageSize: 50,
  });
  const moderate = useModerateMessage(notebook.id);
  const feature = useFeatureMessage(notebook.id);

  async function act(promise: Promise<unknown>, success?: string) {
    try {
      await promise;
      if (success) toast.success(success);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon="mail"
        title={t('dashboard.messagesTitle')}
        subtitle={data ? t('dashboard.messagesCount', { count: data.total ?? data.items.length }) : undefined}
        actions={
          <Link
            to="/dashboard/print"
            className="flex h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-semibold text-maroon-700 shadow-page ring-1 ring-ink/5 active:scale-95"
          >
            <Icon name="download" className="h-4 w-4" />
            PDF
          </Link>
        }
      />

      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35 ltr:left-4 rtl:right-4" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('dashboard.messagesSearch') ?? undefined}
          className="h-12 w-full rounded-2xl border border-ink/10 bg-white/85 text-[15px] text-ink shadow-page outline-none transition placeholder:text-ink/35 focus:border-maroon-300 focus:ring-4 focus:ring-maroon-100 ltr:pl-11 ltr:pr-4 rtl:pl-4 rtl:pr-11"
        />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2">
          {FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                className={cn('relative rounded-full px-4 py-2 text-sm font-semibold transition-colors', active ? 'text-white' : 'bg-white/80 text-ink/60 ring-1 ring-ink/5')}
              >
                {active && (
                  <motion.span
                    layoutId="message-filter"
                    className="absolute inset-0 rounded-full bg-gradient-to-l from-maroon-600 to-maroon-500 shadow-md"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{t(f.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : data?.items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3 rounded-3xl bg-white/70 px-6 py-14 text-center shadow-page"
        >
          <span className="text-5xl">💌</span>
          <p className="font-semibold text-ink/70">{t('dashboard.noMessagesFound')}</p>
          <Link to="/dashboard/share" className="text-sm font-semibold text-maroon-600">
            {t('dashboard.noMessagesShareHint')}
          </Link>
        </motion.div>
      ) : (
        <motion.ul layout className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {data?.items.map((m, i) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                className={cn(
                  'relative overflow-hidden rounded-3xl bg-white/90 p-4 shadow-page ring-1 sm:p-5',
                  m.featured ? 'ring-gold-300' : 'ring-ink/5',
                  m.status === 'hidden' && 'opacity-70',
                )}
              >
                {m.status === 'pending' && <span className="absolute inset-y-0 w-1 bg-gold-400 ltr:left-0 rtl:right-0" aria-hidden />}
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-heading-auto text-lg font-bold text-white shadow-sm',
                      tintFor(m.authorName),
                    )}
                  >
                    {m.authorName.trim().charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-bold text-ink">{m.authorName}</span>
                      {m.featured && <Icon name="star" className="h-4 w-4 fill-gold-400 text-gold-500" />}
                      <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] text-ink/55">
                        {t(`notebook.relationship.${m.relationship}`)}
                      </span>
                      {m.status === 'pending' && (
                        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-800">
                          {t('dashboard.messagesFilterPending')}
                        </span>
                      )}
                      {m.status === 'hidden' && (
                        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink/60">
                          {t('dashboard.messagesFilterHidden')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink/40">{formatRelativeDay(m.createdAt, i18n.language)}</p>
                  </div>
                </div>

                <p dir="auto" className="mt-3 whitespace-pre-wrap text-start text-[15px] leading-relaxed text-ink/85">
                  {m.body}
                </p>
                {m.photoUrl && <img src={m.photoUrl} alt="" loading="lazy" className="mt-3 max-h-56 w-full rounded-2xl object-cover" />}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/5 pt-3">
                  {m.status !== 'approved' && (
                    <ActionButton
                      icon="check"
                      tone="primary"
                      label={t('dashboard.approve')}
                      onClick={() => act(moderate.mutateAsync({ messageId: m.id, status: 'approved' }), t('dashboard.messagePublished') ?? undefined)}
                    />
                  )}
                  <ActionButton
                    icon="star"
                    active={m.featured}
                    label={m.featured ? t('dashboard.unfeature') : t('dashboard.feature')}
                    onClick={() => act(feature.mutateAsync({ messageId: m.id, featured: !m.featured }))}
                  />
                  {m.status !== 'hidden' && (
                    <ActionButton
                      icon="eyeOff"
                      label={t('dashboard.hide')}
                      onClick={() => act(moderate.mutateAsync({ messageId: m.id, status: 'hidden' }))}
                    />
                  )}
                  <span className="flex-1" />
                  <ActionButton
                    icon="trash"
                    tone="danger"
                    label={t('common.delete')}
                    onClick={() => {
                      if (window.confirm(t('dashboard.deleteMessageConfirm', { name: m.authorName }))) {
                        void act(moderate.mutateAsync({ messageId: m.id, status: 'deleted' }));
                      }
                    }}
                  />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useFeatureMessage, useModerateMessage, useOwnerMessages } from '@/hooks/useMessages';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatRelativeDay } from '@/lib/format';
import { getApiErrorMessage } from '@/api/client';
import type { NotebookDto } from '@/types/api';
import type { MessageStatus } from '@daftar/shared';

const FILTERS: Array<{ value: MessageStatus | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'dashboard.messagesFilterAll' },
  { value: 'pending', labelKey: 'dashboard.messagesFilterPending' },
  { value: 'approved', labelKey: 'dashboard.messagesFilterApproved' },
  { value: 'hidden', labelKey: 'dashboard.messagesFilterHidden' },
];

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

  async function act(promise: Promise<unknown>) {
    try {
      await promise;
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('dashboard.messagesTitle')}</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                status === f.value ? 'bg-maroon-600 text-white' : 'bg-white/70 text-ink/60'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
        <Input
          placeholder={t('dashboard.messagesSearch') ?? undefined}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : data?.items.length === 0 ? (
        <p className="py-10 text-center text-ink/50">{t('dashboard.noMessagesFound')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data?.items.map((m) => (
            <div key={m.id} className="rounded-xl bg-white/70 p-4 shadow-page">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading-auto font-bold text-ink">{m.authorName}</span>
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/50">
                      {t(`notebook.relationship.${m.relationship}`)}
                    </span>
                    {m.status === 'pending' && (
                      <span className="rounded-full bg-gold-200 px-2 py-0.5 text-xs text-ink">
                        {t('dashboard.messagesFilterPending')}
                      </span>
                    )}
                    {m.featured && <span title={t('notebook.featured') ?? ''}>⭐</span>}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{m.body}</p>
                  {m.photoUrl && <img src={m.photoUrl} alt="" className="mt-2 h-20 w-20 rounded-lg object-cover" />}
                  <p className="mt-1 text-xs text-ink/40">{formatRelativeDay(m.createdAt, i18n.language)}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {m.status !== 'approved' && (
                    <Button size="sm" onClick={() => act(moderate.mutateAsync({ messageId: m.id, status: 'approved' }))}>
                      {t('dashboard.approve')}
                    </Button>
                  )}
                  {m.status !== 'hidden' && (
                    <Button size="sm" variant="outline" onClick={() => act(moderate.mutateAsync({ messageId: m.id, status: 'hidden' }))}>
                      {t('dashboard.hide')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => act(feature.mutateAsync({ messageId: m.id, featured: !m.featured }))}
                  >
                    {m.featured ? t('dashboard.unfeature') : t('dashboard.feature')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => act(moderate.mutateAsync({ messageId: m.id, status: 'deleted' }))}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TimelineItemType } from '@daftar/shared';
import { useOwnerTimeline, useTimelineMutations } from '@/hooks/useTimeline';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/format';
import { getApiErrorMessage } from '@/api/client';
import type { NotebookDto } from '@/types/api';

export default function DashboardTimelinePage() {
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const { t, i18n } = useTranslation();
  const { data: items, isLoading } = useOwnerTimeline(notebook.id);
  const { create, remove } = useTimelineMutations(notebook.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: TimelineItemType.CUSTOM as string, title: '', description: '', date: '' });

  const typeOptions = Object.values(TimelineItemType).map((v) => ({ value: v, label: v.replace(/_/g, ' ') }));

  async function handleAdd() {
    if (!form.title.trim()) return;
    try {
      await create.mutateAsync({
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        date: form.date || undefined,
        sortOrder: items?.length ?? 0,
      });
      setForm({ type: TimelineItemType.CUSTOM, title: '', description: '', date: '' });
      setShowForm(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('dashboard.timelineTitle')}</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          + {t('dashboard.addTimelineItem')}
        </Button>
      </div>

      {showForm && (
        <div className="flex flex-col gap-3 rounded-xl bg-white/70 p-4 shadow-page">
          <Select label="النوع" value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} options={typeOptions} />
          <Input label="العنوان" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input type="date" label="التاريخ" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Textarea
            label="الوصف"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Button loading={create.isPending} onClick={handleAdd} className="self-end">
            {t('common.save')}
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items?.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/70 p-4 shadow-page">
            <div>
              {item.date && <div className="text-xs text-ink/50">{formatDate(item.date, i18n.language)}</div>}
              <div className="font-heading-auto font-bold text-ink">{item.title}</div>
              {item.description && <p className="text-sm text-ink/60">{item.description}</p>}
            </div>
            <Button size="sm" variant="danger" onClick={() => remove.mutate(item.id)}>
              {t('common.delete')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

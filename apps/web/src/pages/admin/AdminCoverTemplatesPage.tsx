import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ThemeCategory } from '@daftar/shared';
import {
  useAdminCoverTemplates,
  useCreateAdminCoverTemplate,
  useDeleteAdminCoverTemplate,
  useUpdateAdminCoverTemplate,
} from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/api/client';

const CATEGORY_OPTIONS = Object.values(ThemeCategory).map((value) => ({ value, label: value }));

const EMPTY_FORM = {
  slug: '',
  category: ThemeCategory.ELEGANT as ThemeCategory,
  nameAr: '',
  nameEn: '',
  sortOrder: 0,
};

export default function AdminCoverTemplatesPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useAdminCoverTemplates();
  const update = useUpdateAdminCoverTemplate();
  const create = useCreateAdminCoverTemplate();
  const remove = useDeleteAdminCoverTemplate();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState<File | null>(null);

  async function toggleActive(id: string, active: boolean) {
    try {
      await update.mutateAsync({ id, payload: { active } });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!image) {
      toast.error(t('admin.coverTemplateImage'));
      return;
    }
    try {
      await create.mutateAsync({ ...form, image });
      toast.success(t('common.success'));
      setForm(EMPTY_FORM);
      setImage(null);
      setShowForm(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('admin.deleteCoverTemplateConfirm') ?? '')) return;
    try {
      await remove.mutateAsync(id);
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.coverTemplates')}</h1>
        <Button size="sm" variant={showForm ? 'outline' : 'primary'} onClick={() => setShowForm((v) => !v)}>
          {showForm ? t('common.cancel') : t('admin.addCoverTemplate')}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-3 rounded-xl bg-white/70 p-4 shadow-page sm:grid-cols-2">
          <Input
            label={t('admin.coverTemplateSlug')}
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            dir="ltr"
          />
          <Select
            label={t('admin.coverTemplateCategory')}
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v as ThemeCategory })}
          />
          <Input
            label={t('admin.coverTemplateNameAr')}
            required
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          />
          <Input
            label={t('admin.coverTemplateNameEn')}
            required
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
          <Input
            label={t('admin.coverTemplateSortOrder')}
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink/80">{t('admin.coverTemplateImage')}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="rounded-lg border border-ink/10 bg-white px-3 py-2"
            />
          </label>
          <Button type="submit" loading={create.isPending} className="self-start sm:col-span-2">
            {t('common.save')}
          </Button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((template) => (
          <div key={template.id} className="flex flex-col gap-3 rounded-xl bg-white/70 p-4 shadow-page">
            <img src={template.thumbnailUrl} alt="" className="h-40 w-full rounded-lg object-cover" />
            <div>
              <div className="font-heading-auto font-bold text-ink">
                {i18n.language === 'ar' ? template.nameAr : template.nameEn}
              </div>
              <div className="text-xs text-ink/60">{template.category}</div>
            </div>
            <div className="flex items-center justify-between">
              <Button size="sm" variant={template.active ? 'outline' : 'secondary'} onClick={() => toggleActive(template.id, !template.active)}>
                {template.active ? t('admin.block') : t('admin.unblock')}
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(template.id)}>
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

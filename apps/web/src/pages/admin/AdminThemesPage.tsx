import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ThemeCategory } from '@daftar/shared';
import { useAdminThemes, useCreateAdminTheme, useDeleteAdminTheme, useUpdateAdminTheme } from '@/hooks/useAdmin';
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
  paperColor: '#FBF6EC',
  accentColor: '#B8905A',
  inkColor: '#2B241B',
  headingFont: 'Cairo',
  bodyFont: 'Cairo',
  coverGradientFrom: '#F3E7D3',
  coverGradientTo: '#D9C09B',
};

export default function AdminThemesPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useAdminThemes();
  const update = useUpdateAdminTheme();
  const create = useCreateAdminTheme();
  const remove = useDeleteAdminTheme();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  async function toggleActive(slug: string, active: boolean) {
    try {
      await update.mutateAsync({ slug, payload: { active } });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success(t('common.success'));
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleDelete(slug: string) {
    if (!window.confirm(t('admin.deleteThemeConfirm') ?? '')) return;
    try {
      await remove.mutateAsync(slug);
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('admin.themes')}</h1>
        <Button size="sm" variant={showForm ? 'outline' : 'primary'} onClick={() => setShowForm((v) => !v)}>
          {showForm ? t('common.cancel') : t('admin.addTheme')}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-3 rounded-xl bg-white/70 p-4 shadow-page sm:grid-cols-2">
          <Input label={t('admin.themeSlug')} required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" />
          <Select
            label={t('admin.themeCategory')}
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v as ThemeCategory })}
          />
          <Input label={t('admin.themeNameAr')} required value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <Input label={t('admin.themeNameEn')} required value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
          <Input label={t('admin.themePaperColor')} type="color" value={form.paperColor} onChange={(e) => setForm({ ...form, paperColor: e.target.value })} />
          <Input label={t('admin.themeAccentColor')} type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} />
          <Input label={t('admin.themeInkColor')} type="color" value={form.inkColor} onChange={(e) => setForm({ ...form, inkColor: e.target.value })} />
          <Input label={t('admin.themeHeadingFont')} required value={form.headingFont} onChange={(e) => setForm({ ...form, headingFont: e.target.value })} />
          <Input label={t('admin.themeBodyFont')} required value={form.bodyFont} onChange={(e) => setForm({ ...form, bodyFont: e.target.value })} />
          <Input label={t('admin.themeGradientFrom')} type="color" value={form.coverGradientFrom} onChange={(e) => setForm({ ...form, coverGradientFrom: e.target.value })} />
          <Input label={t('admin.themeGradientTo')} type="color" value={form.coverGradientTo} onChange={(e) => setForm({ ...form, coverGradientTo: e.target.value })} />
          <Button type="submit" loading={create.isPending} className="self-start sm:col-span-2">
            {t('common.save')}
          </Button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((theme) => (
          <div key={theme.slug} className="flex items-center justify-between rounded-xl p-4 shadow-page" style={{ backgroundColor: theme.paperColor }}>
            <div>
              <div className="font-heading-auto font-bold" style={{ color: theme.inkColor }}>
                {i18n.language === 'ar' ? theme.nameAr : theme.nameEn}
              </div>
              <div className="text-xs opacity-60" style={{ color: theme.inkColor }}>
                {theme.category}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={theme.active ? 'outline' : 'secondary'} onClick={() => toggleActive(theme.slug, !theme.active)}>
                {theme.active ? t('admin.block') : t('admin.unblock')}
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(theme.slug)}>
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

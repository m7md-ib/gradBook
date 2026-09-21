import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { NotebookVisibility, MessageApprovalMode } from '@daftar/shared';
import { useUpdateSettings, useUpdateSlug } from '@/hooks/useNotebook';
import { useOwnerReports, useResolveOwnerReport } from '@/hooks/useModeration';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/api/client';
import type { NotebookDto } from '@/types/api';

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl bg-white/70 px-4 py-3 shadow-page">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      <input type="checkbox" className="h-5 w-5 accent-maroon-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function DashboardSettingsPage() {
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const { t } = useTranslation();
  const updateSettings = useUpdateSettings(notebook.id);
  const updateSlug = useUpdateSlug(notebook.id);
  const { data: reports } = useOwnerReports(notebook.id);
  const resolveReport = useResolveOwnerReport(notebook.id);

  const [visibility, setVisibility] = useState(notebook.visibility);
  const [approvalMode, setApprovalMode] = useState(notebook.approvalMode);
  const [allowPhotos, setAllowPhotos] = useState(notebook.allowPhotos);
  const [allowGallery, setAllowGallery] = useState(notebook.allowGallery);
  const [musicEnabled, setMusicEnabled] = useState(notebook.musicEnabled);
  const [slug, setSlug] = useState(notebook.slug);

  async function saveSettings() {
    try {
      await updateSettings.mutateAsync({ visibility, approvalMode, allowPhotos, allowGallery, musicEnabled });
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function saveSlug() {
    try {
      await updateSlug.mutateAsync(slug);
      toast.success(t('dashboard.settingsSlugSaved'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading-auto text-2xl font-bold text-ink">{t('dashboard.settingsTitle')}</h1>

      <section className="flex flex-col gap-3">
        <label className="text-sm font-medium text-ink/70">{t('dashboard.settingsSlug')}</label>
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-1 rounded-xl border border-ink/15 bg-white/80 px-3">
            <span className="text-sm text-ink/40" dir="ltr">
              /d/
            </span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
              dir="ltr"
            />
          </div>
          <Button loading={updateSlug.isPending} onClick={saveSlug}>
            {t('common.save')}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading-auto text-lg font-bold text-ink">{t('dashboard.settingsVisibility')}</h2>
        <Select
          value={visibility}
          onChange={(v) => setVisibility(v as NotebookVisibility)}
          options={[
            { value: NotebookVisibility.PUBLIC, label: t('dashboard.visibilityPublic') },
            { value: NotebookVisibility.PRIVATE, label: t('dashboard.visibilityPrivate') },
            { value: NotebookVisibility.INVITE_ONLY, label: t('dashboard.visibilityInvite') },
          ]}
        />
        {visibility !== NotebookVisibility.PUBLIC && notebook.accessCode && (
          <p className="text-sm text-ink/60">
            {t('notebook.accessCodeTitle')}: <span className="font-mono font-bold">{notebook.accessCode}</span>
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading-auto text-lg font-bold text-ink">{t('dashboard.settingsApproval')}</h2>
        <Select
          value={approvalMode}
          onChange={(v) => setApprovalMode(v as MessageApprovalMode)}
          options={[
            { value: MessageApprovalMode.AUTO, label: t('dashboard.approvalAuto') },
            { value: MessageApprovalMode.MANUAL, label: t('dashboard.approvalManual') },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <ToggleRow label={t('dashboard.settingsAllowPhotos')} checked={allowPhotos} onChange={setAllowPhotos} />
        <ToggleRow label={t('dashboard.settingsAllowGallery')} checked={allowGallery} onChange={setAllowGallery} />
        <ToggleRow label={t('notebook.musicPlay')} checked={musicEnabled} onChange={setMusicEnabled} />
      </section>

      <Button loading={updateSettings.isPending} onClick={saveSettings} className="self-start">
        {t('common.save')}
      </Button>

      <section className="flex flex-col gap-3 border-t border-ink/10 pt-6">
        <h2 className="font-heading-auto text-lg font-bold text-ink">{t('dashboard.reportsTitle')}</h2>
        {!reports?.items.length ? (
          <p className="text-sm text-ink/50">{t('dashboard.noReports')}</p>
        ) : (
          reports.items.map((report) => (
            <div key={report.id} className="flex items-center justify-between rounded-xl bg-white/70 p-3 shadow-page">
              <div>
                <p className="text-sm text-ink/80">{report.reason}</p>
                <p className="text-xs text-ink/40">{report.targetType} · {report.status}</p>
              </div>
              {report.status === 'open' && (
                <Button size="sm" variant="outline" onClick={() => resolveReport.mutate({ reportId: report.id, status: 'dismissed' })}>
                  {t('dashboard.dismiss')}
                </Button>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

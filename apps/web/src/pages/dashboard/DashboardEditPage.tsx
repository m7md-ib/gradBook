import { useState, type ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { GraduateInfoInput } from '@daftar/shared';
import {
  useAddGraduate,
  useRemoveGraduate,
  useUpdateCover,
  useUpdateDetails,
  useUpdateGraduate,
  useUpdateIntro,
  useUploadCoverImage,
} from '@/hooks/useNotebook';
import { StepChooseTheme } from '@/pages/wizard/steps/StepChooseTheme';
import { StepCustomizeCover } from '@/pages/wizard/steps/StepCustomizeCover';
import { GraduateForm } from '@/components/dashboard/GraduateForm';
import { GraduateAvatar, GraduatePhoto } from '@/components/dashboard/GraduatePhoto';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/api/client';
import type { GraduateDto, NotebookDto } from '@/types/api';
import { PageHeader } from '@/components/ui/PageHeader';

/** Everything picked in the creation wizard, editable after the fact. */
export default function DashboardEditPage() {
  const { t } = useTranslation();
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const graduates = notebook.graduates ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader icon="edit" title={t('edit.title')} subtitle={t('edit.subtitle')} />

      {notebook.type === 'class' ? (
        <ClassGraduatesSection notebook={notebook} graduates={graduates} />
      ) : (
        graduates[0] && <IndividualGraduateSection notebookId={notebook.id} graduate={graduates[0]} />
      )}

      <ThemeSection notebook={notebook} />
      <CoverSection notebook={notebook} graduate={graduates[0]} />
      <WelcomeSection notebook={notebook} />
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-ink/5 bg-white/85 p-5 shadow-page sm:p-6">
      <div>
        <h2 className="font-heading-auto text-lg font-bold text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-ink/60">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Turns form values into a PATCH body where emptied optional fields are cleared (null). */
function toGraduatePatch(values: GraduateInfoInput) {
  return {
    fullName: values.fullName,
    institution: values.institution,
    major: values.major,
    graduationYear: values.graduationYear,
    graduationDate: values.graduationDate || null,
    shortMessage: values.shortMessage?.trim() || null,
  };
}

function IndividualGraduateSection({ notebookId, graduate }: { notebookId: string; graduate: GraduateDto }) {
  const { t } = useTranslation();
  const update = useUpdateGraduate(notebookId);

  async function save(values: GraduateInfoInput) {
    try {
      await update.mutateAsync({ graduateId: graduate.id, payload: toGraduatePatch(values) });
      toast.success(t('edit.saved'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card title={t('edit.graduateSection')}>
      <div>
        <p className="mb-2 text-sm font-medium text-ink/70">{t('edit.photo')}</p>
        <GraduatePhoto notebookId={notebookId} graduate={graduate} />
      </div>
      <GraduateForm key={graduate.id} initial={graduate} submitLabel={t('common.save')} submitting={update.isPending} onSubmit={save} />
    </Card>
  );
}

function ClassGraduatesSection({ notebook, graduates }: { notebook: NotebookDto; graduates: GraduateDto[] }) {
  const { t } = useTranslation();
  const updateDetails = useUpdateDetails(notebook.id);
  const add = useAddGraduate(notebook.id);
  const update = useUpdateGraduate(notebook.id);
  const remove = useRemoveGraduate(notebook.id);
  const [title, setTitle] = useState(notebook.title ?? '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function run(action: () => Promise<unknown>, after?: () => void) {
    try {
      await action();
      toast.success(t('edit.saved'));
      after?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card title={t('edit.graduatesSection')} hint={t('edit.graduatesHint')}>
      <div className="flex flex-wrap items-end gap-2">
        <Input label={t('edit.classTitle') ?? undefined} value={title} onChange={(e) => setTitle(e.target.value)} className="min-w-[220px] flex-1" />
        <Button loading={updateDetails.isPending} onClick={() => run(() => updateDetails.mutateAsync({ title: title.trim() }))}>
          {t('common.save')}
        </Button>
      </div>

      <ul className="flex flex-col divide-y divide-ink/10 rounded-xl border border-ink/10">
        {graduates.map((g) => (
          <li key={g.id} className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <GraduateAvatar graduate={g} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-ink">{g.fullName}</div>
                <div className="truncate text-xs text-ink/50">
                  {g.major} — {g.institution}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingId(editingId === g.id ? null : g.id)}>
                  {t('edit.editGraduate')}
                </Button>
                {graduates.length > 1 && (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(t('edit.removeGraduateConfirm', { name: g.fullName }))) {
                        void run(() => remove.mutateAsync(g.id));
                      }
                    }}
                  >
                    {t('edit.removeGraduate')}
                  </Button>
                )}
              </div>
            </div>
            {editingId === g.id && (
              <div className="flex flex-col gap-4 rounded-xl bg-paper p-4">
                <GraduatePhoto notebookId={notebook.id} graduate={g} />
                <GraduateForm
                  initial={g}
                  submitLabel={t('common.save')}
                  submitting={update.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(values) =>
                    run(() => update.mutateAsync({ graduateId: g.id, payload: toGraduatePatch(values) }), () => setEditingId(null))
                  }
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="rounded-xl bg-paper p-4">
          <GraduateForm
            initial={{
              fullName: '',
              institution: graduates[0]?.institution ?? '',
              major: '',
              graduationYear: graduates[0]?.graduationYear ?? new Date().getFullYear(),
              graduationDate: null,
              shortMessage: null,
            }}
            submitLabel={t('edit.addGraduate')}
            submitting={add.isPending}
            onCancel={() => setAdding(false)}
            onSubmit={(values) =>
              run(
                () => add.mutateAsync({ ...values, shortMessage: values.shortMessage || undefined }),
                () => setAdding(false),
              )
            }
          />
        </div>
      ) : (
        <Button variant="outline" className="self-start" onClick={() => setAdding(true)}>
          ➕ {t('edit.addGraduate')}
        </Button>
      )}
    </Card>
  );
}

function ThemeSection({ notebook }: { notebook: NotebookDto }) {
  const { t } = useTranslation();
  const updateDetails = useUpdateDetails(notebook.id);
  const [themeSlug, setThemeSlug] = useState(notebook.themeSlug);

  async function save() {
    try {
      await updateDetails.mutateAsync({ themeSlug });
      toast.success(t('edit.saved'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card title={t('edit.designSection')}>
      <StepChooseTheme
        selectedThemeSlug={themeSlug}
        onSelect={setThemeSlug}
        onNext={save}
        nextLabel={t('common.save')}
        submitting={updateDetails.isPending}
      />
    </Card>
  );
}

function CoverSection({ notebook, graduate }: { notebook: NotebookDto; graduate?: GraduateDto }) {
  const { t } = useTranslation();
  const updateCover = useUpdateCover(notebook.id);
  const uploadCoverImage = useUploadCoverImage(notebook.id);

  return (
    <Card title={t('edit.coverSection')}>
      <StepCustomizeCover
        // Remount when the theme changes so the template list follows it.
        key={notebook.themeSlug}
        wizard={{
          themeSlug: notebook.themeSlug,
          graduate: {
            fullName: notebook.type === 'class' ? notebook.title ?? '' : graduate?.fullName ?? '',
            institution: graduate?.institution ?? '',
            major: graduate?.major ?? '',
            graduationYear: graduate?.graduationYear ?? new Date().getFullYear(),
            graduationDate: graduate?.graduationDate ?? undefined,
          },
          cover: {
            sourceType: notebook.coverSourceType,
            templateSlug: notebook.coverTemplateSlug ?? undefined,
            customImageUrl: notebook.coverSourceType === 'custom' ? notebook.coverImageUrl ?? undefined : undefined,
            quote: notebook.coverQuote ?? '',
            elements: notebook.coverElements,
            overlayOpacity: Number(notebook.coverOverlayOpacity),
            crop: notebook.coverCrop ?? undefined,
            style: notebook.coverStyle ?? undefined,
          },
        }}
        onUploadImage={async (file) => (await uploadCoverImage.mutateAsync(file)).coverImageUrl ?? ''}
        onNext={async (cover) => {
          try {
            await updateCover.mutateAsync({
              sourceType: cover.sourceType,
              templateSlug: cover.templateSlug,
              overlayOpacity: cover.overlayOpacity,
              quote: cover.quote,
              elements: cover.elements,
              crop: cover.crop,
              style: cover.style,
            });
            toast.success(t('edit.saved'));
          } catch (error) {
            toast.error(getApiErrorMessage(error));
          }
        }}
        saving={updateCover.isPending}
        nextLabel={t('common.save')}
      />
    </Card>
  );
}

function WelcomeSection({ notebook }: { notebook: NotebookDto }) {
  const { t } = useTranslation();
  const updateIntro = useUpdateIntro(notebook.id);
  const [welcomeMessage, setWelcomeMessage] = useState(notebook.welcomeMessage ?? '');
  const [showProfilePhoto, setShowProfilePhoto] = useState(notebook.showProfilePhoto);

  async function save() {
    try {
      await updateIntro.mutateAsync({ welcomeMessage: welcomeMessage.trim() || undefined, showProfilePhoto });
      toast.success(t('edit.saved'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card title={t('edit.welcomeSection')}>
      <Textarea
        label={t('edit.welcomeMessage') ?? undefined}
        placeholder={t('edit.welcomePlaceholder') ?? undefined}
        maxLength={600}
        rows={3}
        value={welcomeMessage}
        onChange={(e) => setWelcomeMessage(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          className="h-4 w-4 accent-maroon-600"
          checked={showProfilePhoto}
          onChange={(e) => setShowProfilePhoto(e.target.checked)}
        />
        {t('edit.showProfilePhoto')}
      </label>
      <Button className="self-start" loading={updateIntro.isPending} onClick={save}>
        {t('common.save')}
      </Button>
    </Card>
  );
}

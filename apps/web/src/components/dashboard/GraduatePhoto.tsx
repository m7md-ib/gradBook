import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUploadGraduatePhoto } from '@/hooks/useNotebook';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/api/client';
import { cn } from '@/lib/cn';
import type { GraduateDto } from '@/types/api';

export function GraduateAvatar({ graduate, size = 'md' }: { graduate: GraduateDto; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'h-10 w-10 text-sm' : 'h-16 w-16 text-xl';
  return graduate.profilePhotoUrl ? (
    <img src={graduate.profilePhotoUrl} alt={graduate.fullName} className={cn(dims, 'shrink-0 rounded-full object-cover')} />
  ) : (
    <span className={cn(dims, 'flex shrink-0 items-center justify-center rounded-full bg-maroon-100 font-bold text-maroon-700')}>
      {graduate.fullName.trim().charAt(0)}
    </span>
  );
}

/** Avatar plus an upload button for one graduate's profile photo. */
export function GraduatePhoto({ notebookId, graduate }: { notebookId: string; graduate: GraduateDto }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadGraduatePhoto(notebookId);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await upload.mutateAsync({ graduateId: graduate.id, file });
      toast.success(t('edit.saved'));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex items-center gap-3">
      <GraduateAvatar graduate={graduate} />
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
      <Button size="sm" variant="outline" loading={upload.isPending} onClick={() => inputRef.current?.click()}>
        📷 {graduate.profilePhotoUrl ? t('edit.changePhoto') : t('edit.uploadPhoto')}
      </Button>
    </div>
  );
}

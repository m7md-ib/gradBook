import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

export function ShareBar({ url, text }: { url: string; text: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url, text, title: text });
      } catch {
        // user cancelled — no-op
      }
    } else {
      await copyLink();
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white/70 px-4 py-2.5">
        <span className="flex-1 truncate text-sm text-ink/70" dir="ltr">
          {url}
        </span>
        <Button size="sm" variant="outline" onClick={copyLink}>
          {copied ? t('common.copied') : t('common.copy')}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={whatsappUrl} target="_blank" rel="noreferrer">
          <Button size="sm" variant="secondary">
            {t('dashboard.shareWhatsapp')}
          </Button>
        </a>
        <a href={telegramUrl} target="_blank" rel="noreferrer">
          <Button size="sm" variant="secondary">
            {t('dashboard.shareTelegram')}
          </Button>
        </a>
        <a href={twitterUrl} target="_blank" rel="noreferrer">
          <Button size="sm" variant="secondary">
            {t('dashboard.shareTwitter')}
          </Button>
        </a>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button size="sm" variant="outline" onClick={nativeShare}>
            📤 {t('common.share')}
          </Button>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

/** Link with copy, plus WhatsApp / Telegram / X and the phone's own share sheet. */
export function ShareBar({ url, text, className }: { url: string; text: string; className?: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t('common.copied'));
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    try {
      await navigator.share({ url, text, title: text });
    } catch {
      // user cancelled — no-op
    }
  }

  const channels = [
    { key: 'wa', label: t('dashboard.shareWhatsapp'), href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, className: 'bg-[#25D366] text-white', icon: <Icon name="whatsapp" className="h-4 w-4" /> },
    { key: 'tg', label: t('dashboard.shareTelegram'), href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, className: 'bg-[#229ED9] text-white', icon: <span>✈️</span> },
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, className: 'bg-ink text-white', icon: <span className="font-black">𝕏</span> },
  ];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 ps-4 shadow-page ring-1 ring-ink/5">
        <span className="min-w-0 flex-1 truncate text-sm text-ink/70" dir="ltr">
          {url.replace(/^https?:\/\//, '')}
        </span>
        <button
          type="button"
          onClick={copyLink}
          className={cn(
            'flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold transition active:scale-95',
            copied ? 'bg-emerald-500 text-white' : 'bg-maroon-600 text-white hover:bg-maroon-700',
          )}
        >
          <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
          {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>
      <div className={cn('grid gap-2', canNativeShare ? 'grid-cols-4' : 'grid-cols-3')}>
        {channels.map((c) => (
          <a
            key={c.key}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className={cn('flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold shadow-sm transition hover:brightness-110 active:scale-95', c.className)}
          >
            {c.icon}
            {c.label}
          </a>
        ))}
        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3 text-xs font-bold text-ink/75 shadow-sm ring-1 ring-ink/10 active:scale-95"
            aria-label={t('common.share')}
          >
            <Icon name="share" className="h-4 w-4" />
            {t('common.share')}
          </button>
        )}
      </div>
    </div>
  );
}

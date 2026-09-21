import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function MusicControl({ trackUrl }: { trackUrl: string }) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play().catch(() => undefined);
    }
    setPlaying((p) => !p);
  }

  return (
    <div className="fixed bottom-5 z-30 ltr:right-5 rtl:left-5">
      <audio ref={audioRef} src={trackUrl} loop />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t('notebook.musicPause') ?? undefined : t('notebook.musicPlay') ?? undefined}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-page-lg backdrop-blur transition-transform hover:scale-105"
      >
        {playing ? '⏸️' : '🎵'}
      </button>
    </div>
  );
}

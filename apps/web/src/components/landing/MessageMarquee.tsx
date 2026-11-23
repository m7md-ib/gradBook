import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

export interface MarqueeMessage {
  author: string;
  body: string;
  emoji: string;
}

function Note({ message, index }: { message: MarqueeMessage; index: number }) {
  const tilt = ((index * 37) % 5) - 2;
  return (
    <figure
      className="relative mx-3 w-64 shrink-0 rounded-sm bg-[#FFFEF9] p-4 text-start shadow-page-lg ring-1 ring-ink/5 transition-transform duration-300 hover:-translate-y-1 hover:rotate-0 sm:w-72"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-2 rounded-sm bg-gold-200/80" aria-hidden />
      <blockquote className="text-sm leading-relaxed text-ink/85">{message.body}</blockquote>
      <figcaption className="mt-3 flex items-center justify-end gap-1.5 font-heading-auto text-base text-maroon-700">
        — {message.author} <span aria-hidden>{message.emoji}</span>
      </figcaption>
    </figure>
  );
}

/** Two rows of handwritten-style notes gliding in opposite directions; pauses on hover. */
export function MessageMarquee({ messages, className }: { messages: MarqueeMessage[]; className?: string }) {
  const { i18n } = useTranslation();
  const textDir = i18n.dir(i18n.language);
  const half = Math.ceil(messages.length / 2);
  const rows = [messages.slice(0, half), messages.slice(half)];

  return (
    <div
      dir="ltr"
      className={cn('flex flex-col gap-8 py-4', className)}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      {rows.map((row, r) => (
        <div key={r} className="group flex overflow-hidden py-3">
          <div
            dir={textDir}
            className={cn('flex w-max group-hover:[animation-play-state:paused]', r === 0 ? 'animate-marquee' : 'animate-marquee-reverse')}
            style={{ ['--marquee-duration' as string]: `${row.length * 9}s` }}
          >
            {[...row, ...row].map((m, i) => (
              <Note key={i} message={m} index={i + r * 3} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

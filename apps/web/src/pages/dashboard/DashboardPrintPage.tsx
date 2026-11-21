import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { messagesEndpoints } from '@/api/endpoints/messages';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/format';
import type { NotebookDto, OwnerMessage } from '@/types/api';

/** Every approved message, oldest first (the order they appear in the notebook). */
function useAllApprovedMessages(notebookId: string) {
  return useQuery({
    queryKey: ['notebooks', notebookId, 'messages', 'print'],
    queryFn: async () => {
      const all: OwnerMessage[] = [];
      for (let page = 1; ; page += 1) {
        const result = await messagesEndpoints.list(notebookId, { status: 'approved', page, pageSize: 100 });
        all.push(...result.items);
        if (page >= result.totalPages) break;
      }
      return all.sort(
        (a, b) => (a.pageNumber ?? Infinity) - (b.pageNumber ?? Infinity) || a.createdAt.localeCompare(b.createdAt),
      );
    },
  });
}

/**
 * A print-friendly copy of the notebook (the dashboard chrome is hidden with
 * print: utilities), so graduates can keep their messages as a PDF via the
 * browser's "Save as PDF" — the terms recommend keeping your own copy.
 */
export default function DashboardPrintPage() {
  const { t, i18n } = useTranslation();
  const { notebook } = useOutletContext<{ notebook: NotebookDto }>();
  const { data: messages, isLoading } = useAllApprovedMessages(notebook.id);
  const graduates = notebook.graduates ?? [];
  const main = graduates[0];
  const name = notebook.type === 'class' ? notebook.title ?? '' : main?.fullName ?? notebook.title ?? '';

  if (isLoading || !messages) return <PageSpinner />;

  // Class notebooks: one section per graduate, then the messages addressed to everyone.
  const sections =
    notebook.type === 'class'
      ? [
          ...graduates.map((g) => ({ key: g.id, title: g.fullName, items: messages.filter((m) => m.targetGraduateId === g.id) })),
          { key: 'all', title: t('print.forEveryone'), items: messages.filter((m) => !m.targetGraduateId) },
        ].filter((s) => s.items.length > 0)
      : [{ key: 'all', title: null as string | null, items: messages }];

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{t('print.notebookOf', { name })}</title>
      </Helmet>
      <style>{'@page { size: A4; margin: 16mm 14mm; }'}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 p-4 shadow-page print:hidden">
        <div>
          <h1 className="font-heading-auto text-xl font-bold text-ink">{t('print.title')}</h1>
          <p className="text-sm text-ink/60">{t('print.hint')}</p>
        </div>
        <Button onClick={() => window.print()} disabled={messages.length === 0}>
          🖨️ {t('print.button')}
        </Button>
      </div>

      <article className="rounded-2xl bg-white p-8 shadow-page print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-col items-center gap-2 border-b border-ink/10 pb-8 text-center [break-after:page] print:min-h-[90vh] print:justify-center print:border-0">
          <div className="text-4xl">📖</div>
          <h2 className="font-heading-auto text-4xl font-bold text-maroon-700">{t('print.notebookOf', { name })}</h2>
          {main && (
            <p className="text-ink/60">
              {[main.major, main.institution, main.graduationYear].filter(Boolean).join(' · ')}
            </p>
          )}
          <p className="text-sm text-ink/40">{t('print.messageCount', { count: messages.length })}</p>
        </header>

        {messages.length === 0 ? (
          <p className="py-12 text-center text-ink/50">{t('print.empty')}</p>
        ) : (
          sections.map((section) => (
            <section key={section.key} className="mt-8">
              {section.title && (
                <h3 className="mb-4 border-b border-gold-300 pb-2 font-heading-auto text-2xl font-bold text-ink">
                  {section.title}
                </h3>
              )}
              <div className="flex flex-col gap-5">
                {section.items.map((m) => (
                  <figure key={m.id} className="rounded-xl border border-ink/10 bg-paper/60 p-5 [break-inside:avoid] print:bg-white">
                    <blockquote dir="auto" className="whitespace-pre-line text-start text-lg leading-relaxed text-ink">
                      {m.body}
                    </blockquote>
                    {m.photoUrl && <img src={m.photoUrl} alt="" className="mt-3 max-h-64 rounded-lg object-contain" />}
                    <figcaption className="mt-3 text-sm text-ink/60">
                      — <span className="font-semibold text-ink/80">{m.authorName}</span>
                      {' · '}
                      {t(`notebook.relationship.${m.relationship}`)}
                      {' · '}
                      {formatDate(m.createdAt, i18n.language)}
                      {m.reaction && <span className="ms-2">{m.reaction}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))
        )}
      </article>
    </div>
  );
}

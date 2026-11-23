import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useMyNotebooks, useNotebookStats } from '@/hooks/useNotebook';
import { useMyOrders } from '@/hooks/useCommerce';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import type { NotebookDto } from '@/types/api';

interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: IconName;
  end?: boolean;
}

const HOME: NavItem = { to: '/dashboard', label: 'dashboard.myNotebook', short: 'dashboard.navShort.home', icon: 'book', end: true };
const MESSAGES: NavItem = { to: '/dashboard/messages', label: 'dashboard.messagesTitle', short: 'dashboard.navShort.messages', icon: 'mail' };
const SHARE: NavItem = { to: '/dashboard/share', label: 'dashboard.shareAndQr', short: 'dashboard.navShort.share', icon: 'share' };
const EDIT: NavItem = { to: '/dashboard/edit', label: 'edit.title', short: 'dashboard.navShort.edit', icon: 'edit' };
const GALLERY: NavItem = { to: '/dashboard/gallery', label: 'dashboard.galleryTitle', short: 'dashboard.navShort.gallery', icon: 'image' };
const TIMELINE: NavItem = { to: '/dashboard/timeline', label: 'dashboard.timelineTitle', short: 'dashboard.navShort.timeline', icon: 'map' };
const SETTINGS: NavItem = { to: '/dashboard/settings', label: 'dashboard.settingsTitle', short: 'dashboard.navShort.settings', icon: 'settings' };
const PAYMENT: NavItem = { to: '/dashboard/payment', label: 'dashboard.paymentTitle', short: 'dashboard.navShort.payment', icon: 'card' };
const PRINT: NavItem = { to: '/dashboard/print', label: 'print.open', short: 'dashboard.navShort.print', icon: 'download' };

const SIDEBAR = [HOME, EDIT, MESSAGES, GALLERY, TIMELINE, SHARE, SETTINGS];
/** The phone's bottom bar keeps the four things people do most; the rest live under "More". */
const BOTTOM = [HOME, MESSAGES, SHARE, EDIT];
const MORE = [GALLERY, TIMELINE, SETTINGS, PAYMENT, PRINT];

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-gold-100 text-gold-800',
  pending_payment: 'bg-gold-100 text-gold-800',
  expired: 'bg-red-100 text-red-700',
};

function StatusChip({ status, className }: { status: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLE[status], className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', status === 'active' ? 'bg-emerald-500' : status === 'expired' ? 'bg-red-500' : 'bg-gold-500')} />
      {t(`dashboard.status.${status}`, status)}
    </span>
  );
}

function NotebookAvatar({ notebook, className }: { notebook: NotebookDto; className?: string }) {
  const graduate = notebook.graduates?.[0];
  const name = notebook.type === 'class' ? notebook.title ?? '' : graduate?.fullName ?? '';
  const photo = notebook.type === 'class' ? null : graduate?.profilePhotoUrl;
  return photo ? (
    <img src={photo} alt="" className={cn('h-10 w-10 rounded-full object-cover ring-2 ring-white', className)} />
  ) : (
    <span
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-maroon-500 to-night-700 font-heading-auto text-lg font-bold text-gold-100 ring-2 ring-white',
        className,
      )}
    >
      {name.trim().charAt(0) || '📖'}
    </span>
  );
}

export default function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: notebooks, isLoading } = useMyNotebooks();
  const notebook = notebooks?.[0];
  const { data: stats } = useNotebookStats(notebook?.id);
  const [moreOpen, setMoreOpen] = useState(false);
  // Captured per render so the page fading out keeps showing its own content.
  const outlet = useOutlet({ notebook });

  useEffect(() => setMoreOpen(false), [location.pathname]);

  if (isLoading) return <PageSpinner />;

  if (!notebook) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
        <span className="text-5xl">📖</span>
        <p className="text-ink/70">{t('dashboard.noNotebookYet')}</p>
        <Button onClick={() => navigate('/create')}>{t('nav.createNotebook')}</Button>
      </div>
    );
  }

  const name = notebook.type === 'class' ? notebook.title ?? '' : notebook.graduates?.[0]?.fullName ?? '';
  const pending = stats?.pendingMessages ?? 0;
  const signOut = () => void logout().then(() => navigate('/'));
  const toggleLanguage = () => void i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  const moreActive = MORE.some((item) => location.pathname.startsWith(item.to));

  return (
    <div className="flex min-h-screen bg-paper">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-e border-ink/5 bg-white/60 backdrop-blur lg:flex print:!hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-night-800 via-maroon-700 to-maroon-600 px-5 pb-5 pt-6 text-white">
          <div className="absolute -top-10 h-32 w-32 rounded-full bg-gold-400/30 blur-2xl ltr:-right-6 rtl:-left-6" aria-hidden />
          <Link to="/" className="relative font-heading-auto text-2xl font-bold text-gold-200">
            📖 {t('common.appName')}
          </Link>
          <div className="relative mt-5 flex items-center gap-3">
            <NotebookAvatar notebook={notebook} className="ring-white/30" />
            <div className="min-w-0">
              <div className="truncate font-semibold">{name}</div>
              <StatusChip status={notebook.status} className="mt-1" />
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {SIDEBAR.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="relative">
              {({ isActive }) => (
                <span
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'text-white' : 'text-ink/70 hover:bg-ink/5',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-l from-maroon-600 to-maroon-500 shadow-md"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon name={item.icon} className="relative" />
                  <span className="relative flex-1">{t(item.label)}</span>
                  {item === MESSAGES && pending > 0 && (
                    <span className="relative rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-bold text-ink">{pending}</span>
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t border-ink/5 p-4">
          <a href={`/d/${notebook.slug}`} target="_blank" rel="noreferrer">
            <Button className="w-full gap-2" variant="secondary">
              <Icon name="external" className="h-4 w-4" /> {t('dashboard.openNotebook')}
            </Button>
          </a>
          <span className="truncate px-1 text-xs text-ink/45">{user?.email}</span>
          <div className="flex items-center justify-between px-1">
            <button type="button" onClick={toggleLanguage} className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
              <Icon name="globe" className="h-4 w-4" /> {t('common.language')}
            </button>
            <button type="button" onClick={signOut} className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-red-600">
              <Icon name="logout" className="h-4 w-4 rtl:rotate-180" /> {t('common.logout')}
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* ── Phone top bar ──────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/5 bg-paper/85 px-4 py-2.5 backdrop-blur-lg lg:hidden print:hidden">
          <NotebookAvatar notebook={notebook} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-ink">{name}</div>
            <StatusChip status={notebook.status} />
          </div>
          <a
            href={`/d/${notebook.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center gap-1.5 rounded-full bg-maroon-600 px-3.5 text-xs font-semibold text-white shadow-md active:scale-95"
          >
            <Icon name="external" className="h-4 w-4" />
            {t('dashboard.viewShort')}
          </a>
        </header>

        {notebook.status !== 'active' && (
          <div className="print:hidden">
            <PaymentBanner notebookId={notebook.id} status={notebook.status} />
          </div>
        )}

        <main className="mx-auto max-w-5xl px-4 pb-8 pt-5 [--sticky-bottom:5.6rem] sm:px-6 sm:pt-8 lg:px-10 lg:[--sticky-bottom:0px] print:max-w-none print:p-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Phone bottom bar ───────────────────────────────────────── */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/5 bg-white/90 backdrop-blur-xl lg:hidden print:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
            {BOTTOM.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="relative flex flex-1 flex-col items-center gap-0.5 pb-1.5">
                {({ isActive }) => (
                  <>
                    <span className="relative flex h-8 w-14 items-center justify-center">
                      {isActive && (
                        <motion.span
                          layoutId="bottom-active"
                          className="absolute inset-0 rounded-full bg-maroon-50"
                          transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                        />
                      )}
                      <Icon name={item.icon} className={cn('relative h-[22px] w-[22px]', isActive ? 'text-maroon-700' : 'text-ink/50')} strokeWidth={isActive ? 2.1 : 1.8} />
                      {item === MESSAGES && pending > 0 && (
                        <span className="absolute -top-0.5 rounded-full bg-maroon-600 px-1.5 text-[10px] font-bold leading-4 text-white ring-2 ring-white ltr:right-2 rtl:left-2">
                          {pending}
                        </span>
                      )}
                    </span>
                    <span className={cn('text-[11px] leading-tight', isActive ? 'font-bold text-maroon-700' : 'text-ink/55')}>{t(item.short)}</span>
                  </>
                )}
              </NavLink>
            ))}
            <button type="button" onClick={() => setMoreOpen(true)} className="relative flex flex-1 flex-col items-center gap-0.5 pb-1.5">
              <span className="relative flex h-8 w-14 items-center justify-center">
                {moreActive && <span className="absolute inset-0 rounded-full bg-maroon-50" />}
                <Icon name="grid" className={cn('relative h-[22px] w-[22px]', moreActive ? 'text-maroon-700' : 'text-ink/50')} />
              </span>
              <span className={cn('text-[11px] leading-tight', moreActive ? 'font-bold text-maroon-700' : 'text-ink/55')}>{t('dashboard.navShort.more')}</span>
            </button>
          </div>
        </nav>
        <div className="h-24 lg:hidden print:hidden" />
      </div>

      {/* ── "More" sheet ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-50 bg-night-900/40 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-label={t('dashboard.moreTitle')}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[1.75rem] bg-paper px-4 pt-2 shadow-2xl lg:hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 500) setMoreOpen(false);
              }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/15" />
              <div className="grid grid-cols-3 gap-3">
                {MORE.map((item, i) => (
                  <motion.div key={item.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex flex-col items-center gap-2 rounded-2xl p-3 text-center text-xs font-semibold shadow-page ring-1 transition active:scale-95',
                          isActive ? 'bg-maroon-600 text-white ring-maroon-600' : 'bg-white text-ink/75 ring-ink/5',
                        )
                      }
                    >
                      <Icon name={item.icon} className="h-6 w-6" />
                      {t(item.short)}
                    </NavLink>
                  </motion.div>
                ))}
                <motion.button
                  type="button"
                  onClick={toggleLanguage}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * MORE.length }}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 text-xs font-semibold text-ink/75 shadow-page ring-1 ring-ink/5 active:scale-95"
                >
                  <Icon name="globe" className="h-6 w-6" />
                  {t('common.language')}
                </motion.button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-page ring-1 ring-ink/5">
                <span className="truncate text-xs text-ink/50">{user?.email}</span>
                <button type="button" onClick={signOut} className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-red-600">
                  <Icon name="logout" className="h-4 w-4 rtl:rotate-180" />
                  {t('common.logout')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentBanner({ notebookId, status }: { notebookId: string; status: string }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { data: orders } = useMyOrders();

  // Only a manual transfer has a real "awaiting confirmation" state; any other
  // pending order is just an abandoned checkout, so offer a fresh one instead.
  // (The API returns orders newest first.)
  const pending = orders?.find(
    (o) => o.notebookId === notebookId && o.status === 'pending' && o.payments?.[0]?.provider === 'manual',
  );
  const reference = pending?.payments?.[0]?.providerReference;
  const expired = status === 'expired';

  let message: string;
  let action: { to: string; label: string } | null;
  if (pending && reference) {
    message = t('dashboard.bannerAwaitingPayment', { reference });
    action = { to: `/checkout/${pending.id}`, label: t('dashboard.viewPaymentDetails') };
  } else {
    message = expired ? t('dashboard.bannerExpired') : t('dashboard.bannerDraft');
    action = { to: '/dashboard/payment', label: expired ? t('dashboard.renewNow') : t('dashboard.completePayment') };
  }
  if (action.to === pathname) action = null;

  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-10">
      <div
        className={cn(
          'mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl p-4 text-sm shadow-page sm:flex-row sm:items-center',
          expired && !pending ? 'bg-red-50 text-red-900 ring-1 ring-red-200' : 'bg-gradient-to-l from-gold-100 to-gold-50 text-ink ring-1 ring-gold-300/50',
        )}
      >
        <span className="flex flex-1 items-start gap-2.5">
          <Icon name={pending ? 'clock' : 'card'} className="mt-0.5 h-5 w-5 text-maroon-600" />
          <span className="font-medium leading-relaxed">{message}</span>
        </span>
        {action && (
          <Link
            to={action.to}
            className="shrink-0 rounded-xl bg-maroon-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md active:scale-95"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

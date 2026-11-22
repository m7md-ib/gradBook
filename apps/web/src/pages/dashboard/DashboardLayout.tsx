import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useMyNotebooks } from '@/hooks/useNotebook';
import { useMyOrders } from '@/hooks/useCommerce';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

// `short` labels the phone's bottom bar, where seven bare icons were a guessing game.
const NAV_ITEMS = [
  { to: '/dashboard', label: 'dashboard.myNotebook', short: 'dashboard.navShort.home', icon: '📖', end: true },
  { to: '/dashboard/edit', label: 'edit.title', short: 'dashboard.navShort.edit', icon: '✏️' },
  { to: '/dashboard/messages', label: 'dashboard.messagesTitle', short: 'dashboard.navShort.messages', icon: '💌' },
  { to: '/dashboard/gallery', label: 'dashboard.galleryTitle', short: 'dashboard.navShort.gallery', icon: '🖼️' },
  { to: '/dashboard/timeline', label: 'dashboard.timelineTitle', short: 'dashboard.navShort.timeline', icon: '🗺️' },
  { to: '/dashboard/share', label: 'dashboard.shareAndQr', short: 'dashboard.navShort.share', icon: '🔗' },
  { to: '/dashboard/settings', label: 'dashboard.settingsTitle', short: 'dashboard.navShort.settings', icon: '⚙️' },
] as const;

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: notebooks, isLoading } = useMyNotebooks();

  if (isLoading) return <PageSpinner />;

  const notebook = notebooks?.[0];

  if (!notebook) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
        <span className="text-4xl">📖</span>
        <p className="text-ink/70">لا يوجد لديك دفتر بعد</p>
        <Button onClick={() => navigate('/create')}>{t('nav.createNotebook')}</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-64 shrink-0 flex-col border-e border-ink/10 bg-white/50 p-5 lg:flex print:!hidden">
        <div className="mb-6 font-heading-auto text-2xl font-bold text-maroon-700">📖 {t('common.appName')}</div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-maroon-600 text-white' : 'text-ink/70 hover:bg-ink/5',
                )
              }
            >
              <span>{item.icon}</span>
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-col gap-3 border-t border-ink/10 pt-4">
          <span className="truncate text-xs text-ink/50">{user?.email}</span>
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
            <Button size="sm" variant="outline" onClick={() => void logout().then(() => navigate('/'))}>
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        {notebook.status !== 'active' && (
          <div className="print:hidden">
            <PaymentBanner notebookId={notebook.id} status={notebook.status} />
          </div>
        )}

        <header className="flex items-center justify-between border-b border-ink/10 bg-white/50 px-4 py-3 lg:hidden print:hidden">
          <span className="font-heading-auto text-xl font-bold text-maroon-700">📖 {t('common.appName')}</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {/* Logout lived only in the desktop sidebar — phones had no way out. */}
            <button
              type="button"
              onClick={() => void logout().then(() => navigate('/'))}
              className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/70 hover:bg-ink/5"
            >
              {t('common.logout')}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
          <Outlet context={{ notebook }} />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around gap-0.5 border-t border-ink/10 bg-white/95 px-1 py-1.5 backdrop-blur lg:hidden print:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-0.5 text-[10px] leading-tight',
                  isActive ? 'bg-maroon-50 font-semibold text-maroon-700' : 'text-ink/55',
                )
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="w-full truncate text-center">{t(item.short)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="h-20 lg:hidden print:hidden" />
      </div>
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
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-center text-sm font-medium',
        expired && !pending ? 'bg-red-100 text-red-800' : 'bg-gold-100 text-ink',
      )}
    >
      <span>{message}</span>
      {action && (
        <Link to={action.to} className="rounded-full bg-maroon-600 px-3 py-1 text-xs font-semibold text-white hover:bg-maroon-700">
          {action.label}
        </Link>
      )}
    </div>
  );
}

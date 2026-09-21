import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useMyNotebooks } from '@/hooks/useNotebook';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'dashboard.myNotebook', icon: '📖', end: true },
  { to: '/dashboard/messages', label: 'dashboard.messagesTitle', icon: '💌' },
  { to: '/dashboard/gallery', label: 'dashboard.galleryTitle', icon: '🖼️' },
  { to: '/dashboard/timeline', label: 'dashboard.timelineTitle', icon: '🗺️' },
  { to: '/dashboard/share', label: 'dashboard.shareAndQr', icon: '🔗' },
  { to: '/dashboard/settings', label: 'dashboard.settingsTitle', icon: '⚙️' },
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
      <aside className="hidden w-64 shrink-0 flex-col border-e border-ink/10 bg-white/50 p-5 lg:flex">
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
          <div
            className={cn(
              'px-4 py-2.5 text-center text-sm font-medium',
              notebook.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-gold-100 text-ink',
            )}
          >
            {notebook.status === 'draft' && 'لم يتم تفعيل دفترك بعد — أكمل عملية الشراء لتفعيله.'}
            {notebook.status === 'pending_payment' && 'طلبك قيد المعالجة...'}
            {notebook.status === 'expired' && t('dashboard.renewNotebook')}
          </div>
        )}

        <header className="flex items-center justify-between border-b border-ink/10 bg-white/50 px-4 py-3 lg:hidden">
          <span className="font-heading-auto text-xl font-bold text-maroon-700">📖 {t('common.appName')}</span>
          <LanguageSwitcher />
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet context={{ notebook }} />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-ink/10 bg-white/95 py-2 backdrop-blur lg:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) => cn('flex flex-col items-center gap-0.5 px-2 text-[11px]', isActive ? 'text-maroon-600' : 'text-ink/50')}
            >
              <span className="text-lg">{item.icon}</span>
            </NavLink>
          ))}
        </nav>
        <div className="h-16 lg:hidden" />
      </div>
    </div>
  );
}

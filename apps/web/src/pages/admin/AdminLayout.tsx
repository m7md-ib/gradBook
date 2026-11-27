import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useAdminAttention } from '@/hooks/useAdmin';

const NAV_ITEMS = [
  { to: '/admin', label: 'admin.overview', icon: '📊', end: true },
  { to: '/admin/users', label: 'admin.users', icon: '👥' },
  { to: '/admin/notebooks', label: 'admin.notebooks', icon: '📖' },
  { to: '/admin/orders', label: 'admin.orders', icon: '💳' },
  { to: '/admin/reports', label: 'admin.reports', icon: '🚩' },
  { to: '/admin/packages', label: 'admin.packages', icon: '📦' },
  { to: '/admin/themes', label: 'admin.themes', icon: '🎨' },
  { to: '/admin/cover-templates', label: 'admin.coverTemplates', icon: '🖼️' },
  { to: '/admin/settings', label: 'admin.settings', icon: '⚙️' },
] as const;

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: attention } = useAdminAttention();
  const badges: Record<string, number> = {
    '/admin/orders': attention?.pendingOrders ?? 0,
    '/admin/reports': attention?.openReports ?? 0,
  };
  const waiting = (attention?.pendingOrders ?? 0) + (attention?.openReports ?? 0);

  // Show the count in the tab title too, so a new transfer is noticed even
  // when the panel sits in a background tab.
  useEffect(() => {
    const base = t('admin.title');
    document.title = waiting > 0 ? `(${waiting}) ${base}` : base;
  }, [waiting, t]);

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-60 shrink-0 flex-col border-e border-ink/10 bg-white/50 p-5 lg:flex">
        <div className="mb-6 font-heading-auto text-xl font-bold text-maroon-700">🛠️ {t('admin.title')}</div>
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
              <span className="flex-1">{t(item.label)}</span>
              <CountBadge count={badges[item.to] ?? 0} />
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

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 bg-paper/90 backdrop-blur-lg lg:hidden">
        <header className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
          <span className="font-heading-auto text-lg font-bold text-maroon-700">🛠️ {t('admin.title')}</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {/* Phones had no way to sign out of the admin panel. */}
            <button
              type="button"
              onClick={() => void logout().then(() => navigate('/'))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow-page ring-1 ring-ink/5"
              aria-label={t('common.logout')}
            >
              <Icon name="logout" className="h-[18px] w-[18px] rtl:rotate-180" />
            </button>
          </div>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-ink/10 px-2 py-2 [scrollbar-width:none]">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                cn('shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold', isActive ? 'bg-maroon-600 text-white shadow-sm' : 'bg-white/80 text-ink/60 ring-1 ring-ink/5')
              }
            >
              <span className="inline-flex items-center gap-1.5">
                {t(item.label)}
                <CountBadge count={badges[item.to] ?? 0} />
              </span>
            </NavLink>
          ))}
        </div>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gold-500 px-1.5 text-[11px] font-bold leading-5 text-ink">
      {count}
    </span>
  );
}

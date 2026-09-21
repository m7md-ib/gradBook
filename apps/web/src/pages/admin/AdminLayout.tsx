import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { to: '/admin', label: 'admin.overview', icon: '📊', end: true },
  { to: '/admin/users', label: 'admin.users', icon: '👥' },
  { to: '/admin/notebooks', label: 'admin.notebooks', icon: '📖' },
  { to: '/admin/orders', label: 'admin.orders', icon: '💳' },
  { to: '/admin/reports', label: 'admin.reports', icon: '🚩' },
  { to: '/admin/packages', label: 'admin.packages', icon: '📦' },
  { to: '/admin/themes', label: 'admin.themes', icon: '🎨' },
  { to: '/admin/settings', label: 'admin.settings', icon: '⚙️' },
] as const;

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

      <div className="flex-1 overflow-x-auto">
        <header className="flex items-center justify-between border-b border-ink/10 bg-white/50 px-4 py-3 lg:hidden">
          <span className="font-heading-auto text-lg font-bold text-maroon-700">🛠️ {t('admin.title')}</span>
          <LanguageSwitcher />
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-ink/10 bg-white/30 px-2 py-2 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                cn('shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium', isActive ? 'bg-maroon-600 text-white' : 'bg-white/70 text-ink/60')
              }
            >
              {t(item.label)}
            </NavLink>
          ))}
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

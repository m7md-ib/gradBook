import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-paper/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-heading-auto text-2xl font-bold text-maroon-700">
          <span aria-hidden>📖</span>
          {t('common.appName')}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/#how-it-works" className="text-sm font-medium text-ink/70 hover:text-ink">
            {t('nav.howItWorks')}
          </Link>
          <Link to="/#pricing" className="text-sm font-medium text-ink/70 hover:text-ink">
            {t('nav.pricing')}
          </Link>
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-ink/70 hover:text-ink">
                {t('nav.myDashboard')}
              </Link>
              <Button size="sm" variant="outline" onClick={() => void logout().then(() => navigate('/'))}>
                {t('common.logout')}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink/70 hover:text-ink">
                {t('nav.login')}
              </Link>
              <Button size="sm" onClick={() => navigate('/signup')}>
                {t('nav.createNotebook')}
              </Button>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
          aria-expanded={open}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink/5 bg-paper px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link to="/#how-it-works" onClick={() => setOpen(false)} className="text-sm font-medium text-ink/80">
              {t('nav.howItWorks')}
            </Link>
            <Link to="/#pricing" onClick={() => setOpen(false)} className="text-sm font-medium text-ink/80">
              {t('nav.pricing')}
            </Link>
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-ink/80">
                  {t('nav.myDashboard')}
                </Link>
                <Button size="sm" variant="outline" onClick={() => void logout().then(() => navigate('/'))}>
                  {t('common.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-ink/80">
                  {t('nav.login')}
                </Link>
                <Button size="sm" onClick={() => navigate('/signup')}>
                  {t('nav.createNotebook')}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

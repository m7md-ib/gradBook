import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/**
 * `overlay`: sits transparent with light text over a dark hero, and turns
 * into the regular bar once the page scrolls.
 */
export function Navbar({ variant = 'default' }: { variant?: 'default' | 'overlay' }) {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (variant !== 'overlay') return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const dark = variant === 'overlay' && !scrolled && !open;
  const linkClass = cn('text-sm font-medium transition-colors', dark ? 'text-white/80 hover:text-white' : 'text-ink/70 hover:text-ink');

  return (
    <header
      className={cn(
        'top-0 z-40 w-full transition-colors duration-300',
        variant === 'overlay' ? 'fixed' : 'sticky',
        dark ? 'dark-nav border-b border-transparent bg-transparent' : 'border-b border-ink/5 bg-paper/85 backdrop-blur-md',
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className={cn('flex items-center gap-2 font-heading-auto text-2xl font-bold transition-colors', dark ? 'text-gold-200' : 'text-maroon-700')}>
          <span aria-hidden>📖</span>
          {t('common.appName')}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/#how-it-works" className={linkClass}>
            {t('nav.howItWorks')}
          </Link>
          <Link to="/#pricing" className={linkClass}>
            {t('nav.pricing')}
          </Link>
          <LanguageSwitcher className={linkClass} />
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={linkClass}>
                {t('nav.myDashboard')}
              </Link>
              <Button
                size="sm"
                variant="outline"
                className={dark ? 'border-white/30 text-white hover:bg-white/10' : undefined}
                onClick={() => void logout().then(() => navigate('/'))}
              >
                {t('common.logout')}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>
                {t('nav.login')}
              </Link>
              <Button size="sm" variant={dark ? 'secondary' : 'primary'} onClick={() => navigate('/signup')}>
                {t('nav.createNotebook')}
              </Button>
            </>
          )}
        </div>

        <button
          className={cn('flex h-10 w-10 items-center justify-center rounded-lg md:hidden', dark ? 'text-white' : 'text-ink')}
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

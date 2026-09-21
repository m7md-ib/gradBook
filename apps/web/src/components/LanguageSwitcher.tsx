import { useTranslation } from 'react-i18next';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();

  function toggle() {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    void i18n.changeLanguage(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={className ?? 'text-sm font-medium text-ink/70 hover:text-ink transition-colors'}
      aria-label="toggle language"
    >
      {t('common.language')}
    </button>
  );
}

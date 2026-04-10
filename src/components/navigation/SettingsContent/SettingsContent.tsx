import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore, type Theme } from '@/stores/uiStore';
import { SUPPORTED_LANGUAGES } from '@/i18n/i18n';
import styles from './SettingsContent.module.css';

interface SettingsContentProps {
  onClose: () => void;
}

const THEME_VALUES: Theme[] = ['light', 'dark', 'luther'];

export const SettingsContent: React.FC<SettingsContentProps> = ({ onClose: _onClose }) => {
  const { t } = useTranslation();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value);
  };

  return (
    <div className={styles['container']} data-testid="settings-content">

      <div className={styles['section']}>
        <div className={styles['sectionLabel']}>{t('settings.theme', 'Theme')}</div>
        <div className={styles['themeButtons']}>
          {THEME_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              className={`${styles['themeBtn'] ?? ''} ${theme === v ? (styles['themeBtnActive'] ?? '') : ''}`}
              onClick={() => handleThemeChange(v)}
              data-testid={`theme-btn-${v}`}
              aria-pressed={theme === v}
            >
              {t(`settings.themes.${v}`, v)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles['section']}>
        <div className={styles['sectionLabel']}>{t('settings.language', 'Language')}</div>
        <select
          className={styles['languageSelect']}
          value={locale}
          onChange={handleLanguageChange}
          data-testid="language-select"
          aria-label={t('settings.language', 'Language')}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
};

export default SettingsContent;

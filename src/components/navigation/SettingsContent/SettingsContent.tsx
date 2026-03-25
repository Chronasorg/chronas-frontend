import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore, type Theme } from '@/stores/uiStore';
import { SUPPORTED_LANGUAGES } from '@/i18n/i18n';
import styles from './SettingsContent.module.css';

interface SettingsContentProps {
  onClose: () => void;
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'luther', label: 'Luther' },
];

export const SettingsContent: React.FC<SettingsContentProps> = ({ onClose: _onClose }) => {
  const { i18n } = useTranslation();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    setLocale(newLocale);
    void i18n.changeLanguage(newLocale);
  };

  return (
    <div className={styles['container']} data-testid="settings-content">

      <div className={styles['section']}>
        <div className={styles['sectionLabel']}>Theme</div>
        <div className={styles['themeButtons']}>
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`${styles['themeBtn']} ${theme === t.value ? styles['themeBtnActive'] : ''}`}
              onClick={() => handleThemeChange(t.value)}
              data-testid={`theme-btn-${t.value}`}
              aria-pressed={theme === t.value}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles['section']}>
        <div className={styles['sectionLabel']}>Language</div>
        <select
          className={styles['languageSelect']}
          value={locale}
          onChange={handleLanguageChange}
          data-testid="language-select"
          aria-label="Language"
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

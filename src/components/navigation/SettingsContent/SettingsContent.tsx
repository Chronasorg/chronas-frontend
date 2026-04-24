import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore, type Theme } from '@/stores/uiStore';
import { useMapStore, type LabelNameMode } from '@/stores/mapStore';
import { SUPPORTED_LANGUAGES } from '@/i18n/i18n';
import { getShareableURL } from '@/utils/urlStateUtils';
import styles from './SettingsContent.module.css';

interface SettingsContentProps {
  onClose: () => void;
}

const THEME_VALUES: Theme[] = ['light', 'dark', 'luther'];

interface LabelNameModeOption { value: LabelNameMode; label: string; }
const LABEL_NAME_MODE_OPTIONS: LabelNameModeOption[] = [
  { value: 'historical', label: 'Historical Names' },
  { value: 'modern', label: 'Modern Names' },
  { value: 'both', label: 'Both' },
];

export const SettingsContent: React.FC<SettingsContentProps> = ({ onClose: _onClose }) => {
  const { t } = useTranslation();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const labelNameMode = useMapStore((s) => s.labelNameMode);
  const setLabelNameMode = useMapStore((s) => s.setLabelNameMode);
  const isFullscreenState = useUIStore((s) => s.isFullscreen);
  const setFullscreen = useUIStore((s) => s.setFullscreen);
  const [copied, setCopied] = useState(false);

  // Keep store state in sync with browser fullscreen changes (user pressing Esc, etc.)
  useEffect(() => {
    const handleChange = () => {
      setFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, [setFullscreen]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value);
  };

  const handleFullscreenToggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = getShareableURL();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  }, []);

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

      <div className={styles['section']}>
        <div className={styles['sectionLabel']}>{t('layers.mapLabels', 'Map Labels')}</div>
        <select
          className={styles['languageSelect']}
          value={labelNameMode}
          onChange={(e) => setLabelNameMode(e.target.value as LabelNameMode)}
          data-testid="label-name-mode-select"
          aria-label={t('layers.mapLabels', 'Map Labels')}
        >
          {LABEL_NAME_MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {t(`layers.labelModes.${o.value}`, o.label)}
            </option>
          ))}
        </select>
      </div>

      {/* Fullscreen toggle — Issue #19 */}
      <div className={styles['section']}>
        <div className={styles['sectionLabel']}>{t('settings.fullscreen', 'Fullscreen')}</div>
        <div className={styles['actionButtons']}>
          <button
            type="button"
            className={`${styles['actionBtn'] ?? ''} ${isFullscreenState ? (styles['actionBtnActive'] ?? '') : ''}`}
            onClick={() => { void handleFullscreenToggle(); }}
            data-testid="fullscreen-toggle"
            aria-pressed={isFullscreenState}
          >
            {isFullscreenState
              ? t('settings.exitFullscreen', 'Exit Fullscreen')
              : t('settings.enterFullscreen', 'Enter Fullscreen')}
          </button>
        </div>
      </div>

      {/* Share current view — Issue #21 */}
      <div className={styles['section']}>
        <div className={styles['sectionLabel']}>{t('settings.share', 'Share this view')}</div>
        <div className={styles['actionButtons']}>
          <button
            type="button"
            className={styles['actionBtn'] ?? ''}
            onClick={() => { void handleCopyLink(); }}
            data-testid="share-copy-link"
          >
            {copied
              ? t('settings.linkCopied', 'Link copied!')
              : t('settings.copyLink', 'Copy link')}
          </button>
        </div>
      </div>

    </div>
  );
};

export default SettingsContent;

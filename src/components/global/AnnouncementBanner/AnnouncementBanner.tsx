import { useState } from 'react';
import styles from './AnnouncementBanner.module.css';

const DISMISSED_KEY = 'chs_banner_dismissed';

export const AnnouncementBanner: React.FC = () => {
  const [visible, setVisible] = useState(() => localStorage.getItem(DISMISSED_KEY) !== '1');

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <div className={styles['banner']} role="banner">
      Welcome to the new Chronas frontend! Found a bug or have an idea?{' '}
      <a
        className={styles['link']}
        href="https://github.com/Chronasorg/chronas-frontend/issues"
        target="_blank"
        rel="noopener noreferrer"
      >
        Let us know on GitHub
      </a>
      <button
        className={styles['closeButton']}
        onClick={handleClose}
        aria-label="Dismiss banner"
      >
        &times;
      </button>
    </div>
  );
};

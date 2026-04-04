import { useUIStore } from '../../../stores/uiStore';
import styles from './AnnouncementBanner.module.css';

export const AnnouncementBanner: React.FC = () => {
  const bannerVisible = useUIStore((s) => s.bannerVisible);
  const toggleBanner = useUIStore((s) => s.toggleBanner);

  if (!bannerVisible) return null;

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
        onClick={toggleBanner}
        aria-label="Dismiss banner"
      >
        &times;
      </button>
    </div>
  );
};

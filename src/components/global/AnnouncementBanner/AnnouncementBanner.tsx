import { useLayoutEffect, useState } from 'react';
import { useUIStore } from '../../../stores/uiStore';
import styles from './AnnouncementBanner.module.css';

/**
 * Publishes the banner's rendered height as `--banner-height` on <html>, so the
 * fixed sidebar, drawers and map can start below it instead of being covered.
 * The height changes when the text wraps (narrow screens) and drops to 0 on dismiss.
 */
function useBannerHeightVariable(element: HTMLElement | null): void {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!element) {
      root.style.setProperty('--banner-height', '0px');
      return undefined;
    }
    const update = () => {
      root.style.setProperty('--banner-height', `${String(element.offsetHeight)}px`);
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      return () => root.style.setProperty('--banner-height', '0px');
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.setProperty('--banner-height', '0px');
    };
  }, [element]);
}

export const AnnouncementBanner: React.FC = () => {
  const bannerVisible = useUIStore((s) => s.bannerVisible);
  const toggleBanner = useUIStore((s) => s.toggleBanner);
  // Callback ref in state, so the effect re-runs when the element mounts/unmounts
  const [bannerElement, setBannerElement] = useState<HTMLDivElement | null>(null);

  useBannerHeightVariable(bannerElement);

  if (!bannerVisible) return null;

  return (
    <div className={styles['banner']} role="banner" ref={setBannerElement}>
      <span className={styles['message']}>
        <span className={styles['optional']}>Welcome to Chronas! </span>
        Found a bug<span className={styles['optional']}> or have an idea</span>?
      </span>{' '}
      <a
        className={styles['link']}
        href="https://github.com/Chronasorg/chronas-frontend/issues"
        target="_blank"
        rel="noopener noreferrer"
      >
        Let us know on GitHub
      </a>
      {' · '}
      <a
        className={styles['link']}
        href="https://old.chronas.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        Classic version
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

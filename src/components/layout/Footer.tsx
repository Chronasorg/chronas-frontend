import React from 'react';
import styles from './Footer.module.css';

export interface FooterProps {
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Footer component - placeholder for the application footer.
 * Will contain status information, links, and credits after migration.
 */
export const Footer: React.FC<FooterProps> = ({ className }) => {
  const footerClass = styles['footer'] ?? '';
  
  return (
    <footer
      data-testid="footer"
      className={`${footerClass} ${className ?? ''}`.trim()}
    >
      <div className={styles['content']}>
        <div className={styles['left']}>
          <span className={styles['placeholder']}>
            [Status info placeholder]
          </span>
        </div>
        <div className={styles['center']}>
          <span className={styles['copyright']}>
            © {new Date().getFullYear()} Chronas
          </span>
        </div>
        <div className={styles['right']}>
          <span className={styles['placeholder']}>
            [Links placeholder]
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

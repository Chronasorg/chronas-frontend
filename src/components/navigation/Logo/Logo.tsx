/**
 * Logo Component
 *
 * Displays the Chronas logo SVG with theme-appropriate colors.
 * Links to the /info route when clicked.
 *
 * Requirements: 2.1, 2.2, 2.3
 */

import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

/**
 * Logo component props
 */
export interface LogoProps {
  /** Additional CSS class name */
  className?: string | undefined;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Chronas Logo SVG component.
 * Based on the original logo from chronas/public/images/newLogo10.svg
 */
function ChronasLogoSVG() {
  return (
    <svg
      viewBox="0 0 100 100"
      className={styles['logo-svg'] ?? ''}
      aria-hidden="true"
    >
      {/* Outer circle */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      {/* Inner design - stylized C */}
      <path
        d="M65 30 C45 30, 30 40, 30 50 C30 60, 45 70, 65 70"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Horizontal line through center */}
      <line
        x1="35"
        y1="50"
        x2="70"
        y2="50"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Small decorative dots */}
      <circle cx="25" cy="50" r="3" fill="currentColor" />
      <circle cx="75" cy="50" r="3" fill="currentColor" />
    </svg>
  );
}

/**
 * Logo component that displays the Chronas logo and links to /info.
 *
 * @param props - Logo props
 * @returns The logo element
 */
export function Logo({ className, testId }: LogoProps) {
  const combinedClassName = [
    styles['logo'] ?? '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <Link
      to="/info"
      className={combinedClassName}
      aria-label="Chronas - Go to info page"
      data-testid={testId}
      onClick={() => {
        // Match legacy behavior of setting info section
        try {
          localStorage.setItem('chs_info_section', 'welcome');
        } catch {
          // Ignore localStorage errors
        }
      }}
    >
      <ChronasLogoSVG />
    </Link>
  );
}

export default Logo;

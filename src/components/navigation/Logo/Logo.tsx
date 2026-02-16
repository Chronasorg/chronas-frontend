/**
 * Logo Component
 *
 * Displays the Chronas logo as inline SVG for CSS styling.
 * Links to the /info route when clicked.
 * Matches production styling (light theme).
 *
 * Production reference: chronas/src/components/menu/Menu.js
 * - Uses SVG from /images/newLogo10.svg with react-inlinesvg
 * - Has logoMenuContainer + lightTheme classes
 * - CSS targets svg g { fill: #1f1f1f } for light theme
 * - marginBottom: 24px, width: 50px
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { Link } from 'react-router-dom';
import styles from './Logo.module.css';
import { LOGO_SVG_PATHS } from './logoSvgPaths';

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
 * Logo component that displays the Chronas logo and links to /info.
 * Uses inline SVG so CSS can style the fill color for light/dark themes.
 */
export function Logo({ className, testId }: LogoProps) {
  const combinedClassName = [
    styles['logo'] ?? '',
    styles['logoMenuContainer'] ?? '',
    styles['lightTheme'] ?? '',
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <Link
      to="/info"
      className={combinedClassName}
      aria-label="Chronas - Go to info page"
      data-testid={testId}
      onClick={() => {
        try {
          localStorage.setItem('chs_info_section', 'welcome');
        } catch {
          // Ignore localStorage errors
        }
      }}
    >
      <svg
        version="1.0"
        xmlns="http://www.w3.org/2000/svg"
        width="50px"
        height="50px"
        viewBox="0 0 14930 16000"
        preserveAspectRatio="xMidYMid meet"
        className={styles['logo-svg'] ?? ''}
        aria-hidden="true"
      >
        <g id="layer101" fill="currentColor" stroke="none">
          {LOGO_SVG_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>
    </Link>
  );
}

export default Logo;

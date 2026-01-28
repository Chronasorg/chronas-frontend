import React from 'react';
import styles from './Text.module.css';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'overline';

export type TextColor = 'primary' | 'secondary' | 'error' | 'inherit';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export interface TextProps {
  /** Text content */
  children: React.ReactNode;
  /** Typography variant */
  variant?: TextVariant;
  /** Text color */
  color?: TextColor;
  /** Text alignment */
  align?: TextAlign;
  /** Truncate with ellipsis */
  noWrap?: boolean;
  /** Override rendered element */
  component?: React.ElementType;
  /** Additional CSS class */
  className?: string | undefined;
}

/**
 * Maps text variants to their default HTML elements.
 * - h1-h6 → <h1> - <h6>
 * - body1, body2 → <p>
 * - caption, overline → <span>
 */
const variantElementMap: Record<TextVariant, React.ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

/**
 * Text component for consistent typography.
 * Supports semantic variants (h1-h6, body1, body2, caption, overline).
 * Theme-aware using CSS custom properties.
 */
export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body1',
  color = 'primary',
  align = 'left',
  noWrap = false,
  component,
  className,
}) => {
  // Use the component prop if provided, otherwise use the default element for the variant
  const Component = component ?? variantElementMap[variant];

  const classNames = [
    styles['text'],
    styles[`variant-${variant}`],
    styles[`color-${color}`],
    styles[`align-${align}`],
    noWrap && styles['noWrap'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Component className={classNames}>{children}</Component>;
};

export default Text;

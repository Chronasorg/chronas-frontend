import React from 'react';
import styles from './Container.module.css';

export type ContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ContainerProps {
  /** Container content */
  children: React.ReactNode;
  /** Maximum width preset */
  maxWidth?: ContainerMaxWidth;
  /** Fluid mode (full width with padding) */
  fluid?: boolean;
  /** Center content */
  center?: boolean;
  /** Additional CSS class */
  className?: string | undefined;
}

/**
 * Container component for constraining content width.
 * Centers content horizontally and supports max-width presets.
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth,
  fluid = false,
  center = true,
  className,
}) => {
  const containerClasses = [
    styles['container'],
    maxWidth && styles[`max-width-${maxWidth}`],
    fluid && styles['fluid'],
    center && styles['center'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={containerClasses}>{children}</div>;
};

export default Container;

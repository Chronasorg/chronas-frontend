import React from 'react';
import styles from './Grid.module.css';

export type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface GridProps {
  /** Grid content */
  children: React.ReactNode;
  /** Number of columns or template string */
  columns?: number | string;
  /** Row template */
  rows?: string;
  /** Gap between cells */
  gap?: GridGap;
  /** Column gap */
  columnGap?: GridGap;
  /** Row gap */
  rowGap?: GridGap;
  /** Additional CSS class */
  className?: string | undefined;
}

/**
 * Grid component for CSS Grid layouts.
 * Supports columns, rows, and gap configuration.
 */
export const Grid: React.FC<GridProps> = ({
  children,
  columns,
  rows,
  gap = 'none',
  columnGap,
  rowGap,
  className,
}) => {
  const containerClasses = [
    styles['grid'],
    !columnGap && !rowGap && styles[`gap-${gap}`],
    columnGap && styles[`column-gap-${columnGap}`],
    rowGap && styles[`row-gap-${rowGap}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Build inline styles for grid template
  const inlineStyles: React.CSSProperties = {};
  
  if (columns !== undefined) {
    if (typeof columns === 'number') {
      inlineStyles.gridTemplateColumns = `repeat(${String(columns)}, 1fr)`;
    } else {
      inlineStyles.gridTemplateColumns = columns;
    }
  }
  
  if (rows !== undefined) {
    inlineStyles.gridTemplateRows = rows;
  }

  const hasInlineStyles = Object.keys(inlineStyles).length > 0;

  return (
    <div
      className={containerClasses}
      style={hasInlineStyles ? inlineStyles : undefined}
    >
      {children}
    </div>
  );
};

export default Grid;

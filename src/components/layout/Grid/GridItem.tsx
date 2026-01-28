import React from 'react';
import styles from './Grid.module.css';

export interface GridItemProps {
  /** Grid item content */
  children: React.ReactNode;
  /** Column span */
  colSpan?: number;
  /** Row span */
  rowSpan?: number;
  /** Column start */
  colStart?: number;
  /** Column end */
  colEnd?: number;
  /** Row start */
  rowStart?: number;
  /** Row end */
  rowEnd?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * GridItem component for positioning items within a Grid.
 * Supports spanning and explicit positioning.
 */
export const GridItem: React.FC<GridItemProps> = ({
  children,
  colSpan,
  rowSpan,
  colStart,
  colEnd,
  rowStart,
  rowEnd,
  className,
}) => {
  const containerClasses = [styles['grid-item'], className]
    .filter(Boolean)
    .join(' ');

  // Build inline styles for grid positioning
  const inlineStyles: React.CSSProperties = {};

  // Handle column positioning
  if (colStart !== undefined && colEnd !== undefined) {
    inlineStyles.gridColumn = `${String(colStart)} / ${String(colEnd)}`;
  } else if (colStart !== undefined) {
    inlineStyles.gridColumnStart = colStart;
  } else if (colEnd !== undefined) {
    inlineStyles.gridColumnEnd = colEnd;
  } else if (colSpan !== undefined) {
    inlineStyles.gridColumn = `span ${String(colSpan)}`;
  }

  // Handle row positioning
  if (rowStart !== undefined && rowEnd !== undefined) {
    inlineStyles.gridRow = `${String(rowStart)} / ${String(rowEnd)}`;
  } else if (rowStart !== undefined) {
    inlineStyles.gridRowStart = rowStart;
  } else if (rowEnd !== undefined) {
    inlineStyles.gridRowEnd = rowEnd;
  } else if (rowSpan !== undefined) {
    inlineStyles.gridRow = `span ${String(rowSpan)}`;
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

export default GridItem;

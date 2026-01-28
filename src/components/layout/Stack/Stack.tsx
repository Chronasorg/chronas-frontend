import React from 'react';
import styles from './Stack.module.css';

export type StackDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type StackAlign = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
export type StackJustify = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
export type StackSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface StackProps {
  /** Stack content */
  children: React.ReactNode;
  /** Stack direction */
  direction?: StackDirection;
  /** Spacing between items */
  spacing?: StackSpacing;
  /** Cross-axis alignment */
  align?: StackAlign;
  /** Main-axis justification */
  justify?: StackJustify;
  /** Allow wrapping */
  wrap?: boolean;
  /** Divider between items */
  divider?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Stack component for arranging children in a single direction with consistent spacing.
 * Defaults to column direction.
 */
export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'column',
  spacing = 'md',
  align,
  justify,
  wrap = false,
  divider,
  className,
}) => {
  const containerClasses = [
    styles['stack'],
    styles[`direction-${direction}`],
    styles[`spacing-${spacing}`],
    align && styles[`align-${align}`],
    justify && styles[`justify-${justify}`],
    wrap && styles['wrap'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // If divider is provided, insert it between children
  if (divider) {
    const childArray = React.Children.toArray(children);
    const childrenWithDividers: React.ReactNode[] = [];

    childArray.forEach((child, index) => {
      childrenWithDividers.push(child);
      if (index < childArray.length - 1) {
        childrenWithDividers.push(
          <div key={`divider-${String(index)}`} className={styles['divider']}>
            {divider}
          </div>
        );
      }
    });

    return <div className={containerClasses}>{childrenWithDividers}</div>;
  }

  return <div className={containerClasses}>{children}</div>;
};

export default Stack;

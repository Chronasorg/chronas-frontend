import React from 'react';
import styles from './Flex.module.css';

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type FlexAlign = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
export type FlexJustify = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
export type FlexGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FlexProps {
  /** Flex content */
  children: React.ReactNode;
  /** Display inline-flex */
  inline?: boolean;
  /** Flex direction */
  direction?: FlexDirection;
  /** Flex wrap */
  wrap?: FlexWrap;
  /** Justify content */
  justify?: FlexJustify;
  /** Align items */
  align?: FlexAlign;
  /** Gap between items */
  gap?: FlexGap;
  /** Flex grow */
  grow?: number;
  /** Flex shrink */
  shrink?: number;
  /** Flex basis */
  basis?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Flex component for flexible box layouts.
 * Supports all flexbox properties including direction, wrap, justify, align, and gap.
 */
export const Flex: React.FC<FlexProps> = ({
  children,
  inline = false,
  direction = 'row',
  wrap = 'nowrap',
  justify,
  align,
  gap = 'none',
  grow,
  shrink,
  basis,
  className,
}) => {
  const containerClasses = [
    styles['flex'],
    inline && styles['inline'],
    styles[`direction-${direction}`],
    styles[`wrap-${wrap}`],
    justify && styles[`justify-${justify}`],
    align && styles[`align-${align}`],
    styles[`gap-${gap}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Build inline styles for flex item properties
  const inlineStyles: React.CSSProperties = {};
  if (grow !== undefined) {
    inlineStyles.flexGrow = grow;
  }
  if (shrink !== undefined) {
    inlineStyles.flexShrink = shrink;
  }
  if (basis !== undefined) {
    inlineStyles.flexBasis = basis;
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

export default Flex;

import type React from 'react';
import styles from './EraBands.module.css';

/**
 * Historical era definitions with approximate year ranges.
 * Used as subtle background labels for orientation.
 */
const ERAS = [
  { name: 'Ancient', start: -2000, end: -500 },
  { name: 'Classical', start: -500, end: 500 },
  { name: 'Early Medieval', start: 500, end: 1000 },
  { name: 'High Medieval', start: 1000, end: 1300 },
  { name: 'Late Medieval', start: 1300, end: 1500 },
  { name: 'Renaissance', start: 1500, end: 1700 },
  { name: 'Modern', start: 1700, end: 2000 },
];

/** Full timeline range in years */
const TOTAL_RANGE_START = -2500;
const TOTAL_RANGE_END = 2500;
const TOTAL_SPAN = TOTAL_RANGE_END - TOTAL_RANGE_START;

interface EraBandsProps {
  className?: string;
}

export const EraBands: React.FC<EraBandsProps> = ({ className }) => {
  return (
    <div className={`${styles['eraBands'] ?? ''} ${className ?? ''}`} aria-hidden="true">
      {ERAS.map((era) => {
        const leftPct = ((era.start - TOTAL_RANGE_START) / TOTAL_SPAN) * 100;
        const widthPct = ((era.end - era.start) / TOTAL_SPAN) * 100;
        return (
          <div
            key={era.name}
            className={styles['eraBand']}
            style={{ left: `${String(leftPct)}%`, width: `${String(widthPct)}%` }}
          >
            <span className={styles['eraLabel']}>{era.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default EraBands;

import type React from 'react';
import { useCallback } from 'react';
import styles from './CenturyNav.module.css';

const CENTURIES = [
  { label: '500 BCE', year: -500 },
  { label: '0', year: 0 },
  { label: '500', year: 500 },
  { label: '1000', year: 1000 },
  { label: '1500', year: 1500 },
  { label: '2000', year: 2000 },
];

interface CenturyNavProps {
  selectedYear: number;
  onJumpToYear: (year: number) => void;
}

export const CenturyNav: React.FC<CenturyNavProps> = ({ selectedYear, onJumpToYear }) => {
  const getActiveIndex = useCallback(() => {
    let closest = 0;
    let minDist = Infinity;
    CENTURIES.forEach((c, i) => {
      const dist = Math.abs(selectedYear - c.year);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    return closest;
  }, [selectedYear]);

  const activeIndex = getActiveIndex();

  return (
    <div className={styles['centuryNav']} role="toolbar" aria-label="Century quick navigation">
      {CENTURIES.map((c, i) => (
        <button
          key={c.year}
          type="button"
          className={`${styles['centuryBtn'] ?? ''} ${i === activeIndex ? styles['active'] ?? '' : ''}`}
          onClick={() => onJumpToYear(c.year)}
          aria-label={`Jump to year ${c.label}`}
          aria-current={i === activeIndex ? 'true' : undefined}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
};

export default CenturyNav;

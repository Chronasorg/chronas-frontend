/**
 * LayerToggle Component
 *
 * A table-based UI component with radio buttons for switching between color dimensions
 * (ruler, culture, religion, religionGeneral, population). Supports independent control
 * of Area (color) and Label dimensions with a lock/unlock toggle.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.16, 6.17
 */

import type React from 'react';
import styles from './LayerToggle.module.css';
import type { AreaColorDimension } from '@/stores/mapStore';

/**
 * LayerToggle component props
 *
 * Interface from design.md:
 * - activeColor: Currently active color dimension
 * - activeLabel: Currently active label dimension
 * - locked: Whether color and label are locked together
 * - onColorChange: Callback when color dimension changes
 * - onLabelChange: Callback when label dimension changes
 * - onLockChange: Callback when lock state changes
 */
export interface LayerToggleProps {
  /** Currently active color dimension */
  activeColor: AreaColorDimension;
  /** Currently active label dimension */
  activeLabel: AreaColorDimension;
  /** Whether color and label are locked together */
  locked: boolean;
  /** Callback when color dimension changes */
  onColorChange: (dimension: AreaColorDimension) => void;
  /** Callback when label dimension changes */
  onLabelChange: (dimension: AreaColorDimension) => void;
  /** Callback when lock state changes */
  onLockChange: (locked: boolean) => void;
}

/**
 * Dimension row configuration for rendering
 */
interface DimensionRowConfig {
  /** Dimension key */
  dimension: AreaColorDimension;
  /** Display label for the dimension */
  label: string;
  /** Whether this dimension has a label option (population does not) */
  hasLabelOption: boolean;
}

/**
 * Dimension row configurations for the layer toggle table
 * Requirement 6.1: Display radio buttons for each dimension: ruler, culture, religion, religionGeneral, and population
 * Requirement 6.15: Population row has no Label option
 */
const DIMENSION_ROWS: DimensionRowConfig[] = [
  {
    dimension: 'ruler',
    label: 'Ruler',
    hasLabelOption: true,
  },
  {
    dimension: 'culture',
    label: 'Culture',
    hasLabelOption: true,
  },
  {
    dimension: 'religion',
    label: 'Religion',
    hasLabelOption: true,
  },
  {
    dimension: 'religionGeneral',
    label: 'Religion Gen.',
    hasLabelOption: true,
  },
  {
    dimension: 'population',
    label: 'Population',
    hasLabelOption: false,
  },
];

/**
 * Lock icon component
 * Requirement 6.17: Lock icon displays as closed lock when enabled and open lock when disabled
 * Requirement 6.13, 10.3: Keyboard accessible with Enter/Space to toggle
 */
interface LockIconProps {
  /** Whether the lock is enabled */
  locked: boolean;
  /** Click handler */
  onClick: () => void;
}

const LockIcon: React.FC<LockIconProps> = ({ locked, onClick }) => {
  /**
   * Handle keyboard events for Enter and Space
   * Requirement 6.13: Enter/Space to select
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={styles['lockButton']}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={locked ? 'Unlock area and label selection' : 'Lock area and label selection'}
      aria-pressed={locked}
      data-testid="lock-toggle"
      tabIndex={0}
    >
      <span aria-hidden="true">{locked ? '🔒' : '🔓'}</span>
    </button>
  );
};

/**
 * Link indicator component
 * Requirement 6.18: Display link icon between Area and Label columns when locked
 */
interface LinkIndicatorProps {
  /** Whether to show the link indicator */
  visible: boolean;
}

const LinkIndicator: React.FC<LinkIndicatorProps> = ({ visible }) => {
  if (!visible) {
    return <span className={styles['linkPlaceholder']} aria-hidden="true" />;
  }

  return (
    <span className={styles['linkIndicator']} aria-hidden="true" data-testid="link-indicator">
      🔗
    </span>
  );
};

/**
 * Radio button component for dimension selection
 * 
 * Keyboard accessibility (Requirement 6.13, 10.3):
 * - Tab navigation: Buttons are focusable via Tab key
 * - Enter/Space: Native button behavior activates selection
 * - Descriptive aria-labels for screen readers
 */
interface RadioButtonProps {
  /** Whether this radio is selected */
  selected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Accessible label */
  ariaLabel: string;
  /** Test ID */
  testId: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Name for the radio group (for proper ARIA semantics) */
  groupName?: string;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onClick,
  ariaLabel,
  testId,
  disabled = false,
  groupName,
}) => {
  const buttonClasses = [
    styles['radioButton'],
    selected ? styles['selected'] : '',
    disabled ? styles['disabled'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * Handle keyboard events for Enter and Space
   * Note: Native button elements handle Enter/Space automatically,
   * but we add explicit handling for better accessibility compliance
   * Requirement 6.13: Enter/Space to select
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        onClick();
      }
    }
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      aria-describedby={groupName ? `${groupName}-description` : undefined}
      className={buttonClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      data-testid={testId}
      tabIndex={0}
    >
      <span className={styles['radioOuter']} aria-hidden="true">
        {selected && <span className={styles['radioInner']} />}
      </span>
    </button>
  );
};

/**
 * Dimension row component
 * Requirement 6.13: Tab navigation between rows
 * Requirement 10.3: Descriptive aria-labels
 */
interface DimensionRowProps {
  /** Row configuration */
  config: DimensionRowConfig;
  /** Whether this dimension is active for color */
  isActiveColor: boolean;
  /** Whether this dimension is active for label */
  isActiveLabel: boolean;
  /** Whether color and label are locked */
  locked: boolean;
  /** Callback when color is selected */
  onColorSelect: () => void;
  /** Callback when label is selected */
  onLabelSelect: () => void;
}

const DimensionRow: React.FC<DimensionRowProps> = ({
  config,
  isActiveColor,
  isActiveLabel,
  locked,
  onColorSelect,
  onLabelSelect,
}) => {
  const rowClasses = [
    styles['dimensionRow'],
    isActiveColor ? styles['activeColor'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <tr className={rowClasses} data-testid={`dimension-row-${config.dimension}`}>
      {/* Dimension label */}
      <td className={styles['labelCell']}>
        <span className={styles['dimensionLabel']} id={`dimension-label-${config.dimension}`}>
          {config.label}
        </span>
      </td>

      {/* Area (color) radio button - Requirement 10.3: Descriptive aria-labels */}
      <td className={styles['radioCell']}>
        <RadioButton
          selected={isActiveColor}
          onClick={onColorSelect}
          ariaLabel={`Set area color to ${config.label}${locked && config.hasLabelOption ? ' (also sets label when locked)' : ''}`}
          testId={`area-radio-${config.dimension}`}
          groupName="area-color"
        />
      </td>

      {/* Link indicator (only for rows with label option) */}
      <td className={styles['linkCell']}>
        {config.hasLabelOption && <LinkIndicator visible={locked} />}
      </td>

      {/* Label radio button (only for rows with label option) - Requirement 10.3: Descriptive aria-labels */}
      <td className={styles['radioCell']}>
        {config.hasLabelOption ? (
          <RadioButton
            selected={isActiveLabel}
            onClick={onLabelSelect}
            ariaLabel={`Set label to ${config.label}${locked ? ' (also sets area color when locked)' : ''}`}
            testId={`label-radio-${config.dimension}`}
            groupName="label"
          />
        ) : (
          <span className={styles['emptyCell']} aria-hidden="true" />
        )}
      </td>
    </tr>
  );
};

/**
 * LayerToggle Component
 *
 * A table-based UI component for switching between map visualization modes.
 *
 * Visual structure (from requirements.md):
 * ```
 * ┌─────────────────────────────────────────────────┐
 * │                    Area    🔒    Label          │
 * ├─────────────────────────────────────────────────┤
 * │ Ruler              (●)    ─🔗─    (●)          │
 * │ Culture            ( )    ─🔗─    ( )          │
 * │ Religion           ( )    ─🔗─    ( )          │
 * │ Religion Gen.      ( )    ─🔗─    ( )          │
 * │ Population         ( )                          │
 * └─────────────────────────────────────────────────┘
 * ```
 *
 * Requirements:
 * - 6.1: Display table with radio buttons for each dimension
 * - 6.2: Two columns: "Area" (color) and "Label" for independent control
 * - 6.3: Include lock/unlock toggle icon between columns
 * - 6.16: Header row with "Area" and "Label" column headers
 * - 6.17: Lock icon displays as closed/open lock based on state
 *
 * @param props - LayerToggle component props
 * @returns LayerToggle React component
 */
export const LayerToggle: React.FC<LayerToggleProps> = ({
  activeColor,
  activeLabel,
  locked,
  onColorChange,
  onLabelChange,
  onLockChange,
}) => {
  /**
   * Handle lock toggle click
   */
  const handleLockToggle = () => {
    onLockChange(!locked);
  };

  /**
   * Handle color selection for a dimension
   * When locked, also updates the label (except for population)
   */
  const handleColorSelect = (dimension: AreaColorDimension) => {
    onColorChange(dimension);
    // When locked and dimension has label option, also update label
    if (locked && dimension !== 'population') {
      onLabelChange(dimension);
    }
  };

  /**
   * Handle label selection for a dimension
   * When locked, also updates the color
   */
  const handleLabelSelect = (dimension: AreaColorDimension) => {
    onLabelChange(dimension);
    // When locked, also update color
    if (locked) {
      onColorChange(dimension);
    }
  };

  return (
    <div 
      className={styles['layerToggle']} 
      data-testid="layer-toggle"
      role="region"
      aria-label="Layer toggle controls for map visualization"
    >
      {/* Hidden descriptions for screen readers - Requirement 10.3 */}
      <div id="area-color-description" className={styles['srOnly']}>
        Select which dimension to use for coloring map areas
      </div>
      <div id="label-description" className={styles['srOnly']}>
        Select which dimension to use for map labels
      </div>
      
      <table 
        className={styles['toggleTable']} 
        role="grid"
        aria-label="Layer dimension selection"
      >
        {/* Header row - Requirement 6.16 */}
        <thead>
          <tr className={styles['headerRow']} role="row">
            <th className={styles['labelHeader']} scope="col" role="columnheader">
              {/* Empty header for dimension labels column */}
              <span className={styles['srOnly']}>Dimension</span>
            </th>
            <th className={styles['areaHeader']} scope="col" role="columnheader">
              Area
            </th>
            <th className={styles['lockHeader']} scope="col" role="columnheader">
              <LockIcon locked={locked} onClick={handleLockToggle} />
            </th>
            <th className={styles['labelColumnHeader']} scope="col" role="columnheader">
              Label
            </th>
          </tr>
        </thead>

        {/* Dimension rows - Requirement 6.13: Tab navigation between rows */}
        <tbody role="rowgroup">
          {DIMENSION_ROWS.map((config) => (
            <DimensionRow
              key={config.dimension}
              config={config}
              isActiveColor={activeColor === config.dimension}
              isActiveLabel={activeLabel === config.dimension}
              locked={locked}
              onColorSelect={() => handleColorSelect(config.dimension)}
              onLabelSelect={() => handleLabelSelect(config.dimension)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LayerToggle;

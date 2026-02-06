/**
 * LayerToggle Component Tests
 *
 * Tests for the layer toggle component that controls map visualization dimensions.
 *
 * Requirements tested:
 * - 6.1: Display table with radio buttons for each dimension
 * - 6.4: When locked, clicking row updates both color and label
 * - 6.5: When unlocked, clicking updates only selected column
 * - 6.13: Keyboard accessible (Tab navigation, Enter/Space to select)
 * - 6.15: Population row has no Label option
 * - 6.17: Lock icon displays as closed/open lock based on state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayerToggle } from './LayerToggle';
import type { AreaColorDimension } from '@/stores/mapStore';

describe('LayerToggle', () => {
  const mockOnColorChange = vi.fn();
  const mockOnLabelChange = vi.fn();
  const mockOnLockChange = vi.fn();

  const defaultProps = {
    activeColor: 'ruler' as AreaColorDimension,
    activeLabel: 'ruler' as AreaColorDimension,
    locked: true,
    onColorChange: mockOnColorChange,
    onLabelChange: mockOnLabelChange,
    onLockChange: mockOnLockChange,
  };

  beforeEach(() => {
    mockOnColorChange.mockClear();
    mockOnLabelChange.mockClear();
    mockOnLockChange.mockClear();
  });

  describe('Rendering (Requirement 6.1)', () => {
    it('should render the layer toggle component', () => {
      render(<LayerToggle {...defaultProps} />);

      expect(screen.getByTestId('layer-toggle')).toBeInTheDocument();
    });

    it('should render all dimension rows', () => {
      render(<LayerToggle {...defaultProps} />);

      expect(screen.getByTestId('dimension-row-ruler')).toBeInTheDocument();
      expect(screen.getByTestId('dimension-row-culture')).toBeInTheDocument();
      expect(screen.getByTestId('dimension-row-religion')).toBeInTheDocument();
      expect(screen.getByTestId('dimension-row-religionGeneral')).toBeInTheDocument();
      expect(screen.getByTestId('dimension-row-population')).toBeInTheDocument();
    });

    it('should display dimension labels correctly', () => {
      render(<LayerToggle {...defaultProps} />);

      expect(screen.getByText('Ruler')).toBeInTheDocument();
      expect(screen.getByText('Culture')).toBeInTheDocument();
      expect(screen.getByText('Religion')).toBeInTheDocument();
      expect(screen.getByText('Religion Gen.')).toBeInTheDocument();
      expect(screen.getByText('Population')).toBeInTheDocument();
    });

    it('should render Area and Label column headers', () => {
      render(<LayerToggle {...defaultProps} />);

      expect(screen.getByText('Area')).toBeInTheDocument();
      expect(screen.getByText('Label')).toBeInTheDocument();
    });

    it('should render area radio buttons for all dimensions', () => {
      render(<LayerToggle {...defaultProps} />);

      expect(screen.getByTestId('area-radio-ruler')).toBeInTheDocument();
      expect(screen.getByTestId('area-radio-culture')).toBeInTheDocument();
      expect(screen.getByTestId('area-radio-religion')).toBeInTheDocument();
      expect(screen.getByTestId('area-radio-religionGeneral')).toBeInTheDocument();
      expect(screen.getByTestId('area-radio-population')).toBeInTheDocument();
    });

    it('should render label radio buttons for non-population dimensions', () => {
      render(<LayerToggle {...defaultProps} />);

      expect(screen.getByTestId('label-radio-ruler')).toBeInTheDocument();
      expect(screen.getByTestId('label-radio-culture')).toBeInTheDocument();
      expect(screen.getByTestId('label-radio-religion')).toBeInTheDocument();
      expect(screen.getByTestId('label-radio-religionGeneral')).toBeInTheDocument();
    });

    it('should NOT render label radio button for population (Requirement 6.15)', () => {
      render(<LayerToggle {...defaultProps} />);

      expect(screen.queryByTestId('label-radio-population')).not.toBeInTheDocument();
    });
  });

  describe('Active Dimension Indication', () => {
    it('should indicate active color dimension with aria-checked', () => {
      render(<LayerToggle {...defaultProps} activeColor="culture" />);

      const cultureAreaRadio = screen.getByTestId('area-radio-culture');
      const rulerAreaRadio = screen.getByTestId('area-radio-ruler');

      expect(cultureAreaRadio).toHaveAttribute('aria-checked', 'true');
      expect(rulerAreaRadio).toHaveAttribute('aria-checked', 'false');
    });

    it('should indicate active label dimension with aria-checked', () => {
      render(<LayerToggle {...defaultProps} activeLabel="religion" />);

      const religionLabelRadio = screen.getByTestId('label-radio-religion');
      const rulerLabelRadio = screen.getByTestId('label-radio-ruler');

      expect(religionLabelRadio).toHaveAttribute('aria-checked', 'true');
      expect(rulerLabelRadio).toHaveAttribute('aria-checked', 'false');
    });

    it('should support different active color and label dimensions', () => {
      render(
        <LayerToggle
          {...defaultProps}
          activeColor="culture"
          activeLabel="religion"
          locked={false}
        />
      );

      expect(screen.getByTestId('area-radio-culture')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('label-radio-religion')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByTestId('area-radio-religion')).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByTestId('label-radio-culture')).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Lock/Unlock Toggle (Requirement 6.17)', () => {
    it('should render lock toggle button', () => {
      render(<LayerToggle {...defaultProps} />);

      expect(screen.getByTestId('lock-toggle')).toBeInTheDocument();
    });

    it('should display closed lock icon when locked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const lockButton = screen.getByTestId('lock-toggle');
      expect(lockButton).toHaveTextContent('🔒');
    });

    it('should display open lock icon when unlocked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const lockButton = screen.getByTestId('lock-toggle');
      expect(lockButton).toHaveTextContent('🔓');
    });

    it('should have correct aria-pressed attribute when locked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const lockButton = screen.getByTestId('lock-toggle');
      expect(lockButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have correct aria-pressed attribute when unlocked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const lockButton = screen.getByTestId('lock-toggle');
      expect(lockButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should call onLockChange when lock toggle is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const lockButton = screen.getByTestId('lock-toggle');
      fireEvent.click(lockButton);

      expect(mockOnLockChange).toHaveBeenCalledTimes(1);
      expect(mockOnLockChange).toHaveBeenCalledWith(false);
    });

    it('should call onLockChange with true when unlocked toggle is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const lockButton = screen.getByTestId('lock-toggle');
      fireEvent.click(lockButton);

      expect(mockOnLockChange).toHaveBeenCalledTimes(1);
      expect(mockOnLockChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Lock Behavior - Area Radio (Requirement 6.4)', () => {
    it('should update both color and label when locked and Area radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const cultureAreaRadio = screen.getByTestId('area-radio-culture');
      fireEvent.click(cultureAreaRadio);

      expect(mockOnColorChange).toHaveBeenCalledTimes(1);
      expect(mockOnColorChange).toHaveBeenCalledWith('culture');
      expect(mockOnLabelChange).toHaveBeenCalledTimes(1);
      expect(mockOnLabelChange).toHaveBeenCalledWith('culture');
    });

    it('should update both color and label when locked and religion Area radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const religionAreaRadio = screen.getByTestId('area-radio-religion');
      fireEvent.click(religionAreaRadio);

      expect(mockOnColorChange).toHaveBeenCalledWith('religion');
      expect(mockOnLabelChange).toHaveBeenCalledWith('religion');
    });

    it('should update both color and label when locked and religionGeneral Area radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const religionGenAreaRadio = screen.getByTestId('area-radio-religionGeneral');
      fireEvent.click(religionGenAreaRadio);

      expect(mockOnColorChange).toHaveBeenCalledWith('religionGeneral');
      expect(mockOnLabelChange).toHaveBeenCalledWith('religionGeneral');
    });

    it('should only update color (not label) when locked and population Area radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const populationAreaRadio = screen.getByTestId('area-radio-population');
      fireEvent.click(populationAreaRadio);

      expect(mockOnColorChange).toHaveBeenCalledTimes(1);
      expect(mockOnColorChange).toHaveBeenCalledWith('population');
      // Population has no label option, so onLabelChange should NOT be called
      expect(mockOnLabelChange).not.toHaveBeenCalled();
    });
  });

  describe('Lock Behavior - Label Radio (Requirement 6.4)', () => {
    it('should update both color and label when locked and Label radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const cultureLabelRadio = screen.getByTestId('label-radio-culture');
      fireEvent.click(cultureLabelRadio);

      expect(mockOnLabelChange).toHaveBeenCalledTimes(1);
      expect(mockOnLabelChange).toHaveBeenCalledWith('culture');
      expect(mockOnColorChange).toHaveBeenCalledTimes(1);
      expect(mockOnColorChange).toHaveBeenCalledWith('culture');
    });

    it('should update both color and label when locked and religion Label radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const religionLabelRadio = screen.getByTestId('label-radio-religion');
      fireEvent.click(religionLabelRadio);

      expect(mockOnLabelChange).toHaveBeenCalledWith('religion');
      expect(mockOnColorChange).toHaveBeenCalledWith('religion');
    });
  });

  describe('Unlock Behavior - Area Radio (Requirement 6.5)', () => {
    it('should only update color when unlocked and Area radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const cultureAreaRadio = screen.getByTestId('area-radio-culture');
      fireEvent.click(cultureAreaRadio);

      expect(mockOnColorChange).toHaveBeenCalledTimes(1);
      expect(mockOnColorChange).toHaveBeenCalledWith('culture');
      // When unlocked, clicking Area should NOT update label
      expect(mockOnLabelChange).not.toHaveBeenCalled();
    });

    it('should only update color when unlocked and religion Area radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const religionAreaRadio = screen.getByTestId('area-radio-religion');
      fireEvent.click(religionAreaRadio);

      expect(mockOnColorChange).toHaveBeenCalledWith('religion');
      expect(mockOnLabelChange).not.toHaveBeenCalled();
    });

    it('should only update color when unlocked and population Area radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const populationAreaRadio = screen.getByTestId('area-radio-population');
      fireEvent.click(populationAreaRadio);

      expect(mockOnColorChange).toHaveBeenCalledWith('population');
      expect(mockOnLabelChange).not.toHaveBeenCalled();
    });
  });

  describe('Unlock Behavior - Label Radio (Requirement 6.5)', () => {
    it('should only update label when unlocked and Label radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const cultureLabelRadio = screen.getByTestId('label-radio-culture');
      fireEvent.click(cultureLabelRadio);

      expect(mockOnLabelChange).toHaveBeenCalledTimes(1);
      expect(mockOnLabelChange).toHaveBeenCalledWith('culture');
      // When unlocked, clicking Label should NOT update color
      expect(mockOnColorChange).not.toHaveBeenCalled();
    });

    it('should only update label when unlocked and religion Label radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const religionLabelRadio = screen.getByTestId('label-radio-religion');
      fireEvent.click(religionLabelRadio);

      expect(mockOnLabelChange).toHaveBeenCalledWith('religion');
      expect(mockOnColorChange).not.toHaveBeenCalled();
    });

    it('should only update label when unlocked and religionGeneral Label radio is clicked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const religionGenLabelRadio = screen.getByTestId('label-radio-religionGeneral');
      fireEvent.click(religionGenLabelRadio);

      expect(mockOnLabelChange).toHaveBeenCalledWith('religionGeneral');
      expect(mockOnColorChange).not.toHaveBeenCalled();
    });
  });

  describe('Link Indicator Display', () => {
    it('should display link indicators when locked', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const linkIndicators = screen.getAllByTestId('link-indicator');
      // Should have 4 link indicators (ruler, culture, religion, religionGeneral - not population)
      expect(linkIndicators).toHaveLength(4);
    });

    it('should NOT display link indicators when unlocked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const linkIndicators = screen.queryAllByTestId('link-indicator');
      expect(linkIndicators).toHaveLength(0);
    });
  });

  describe('Keyboard Navigation (Requirement 6.13)', () => {
    it('should allow Tab navigation to Area radio buttons', () => {
      render(<LayerToggle {...defaultProps} />);

      const rulerAreaRadio = screen.getByTestId('area-radio-ruler');
      
      // Focus on the first radio button
      rulerAreaRadio.focus();
      expect(document.activeElement).toBe(rulerAreaRadio);

      // Verify the element is focusable (has tabIndex)
      expect(rulerAreaRadio).toHaveAttribute('tabIndex', '0');
    });

    it('should allow Tab navigation to Label radio buttons', () => {
      render(<LayerToggle {...defaultProps} />);

      const rulerLabelRadio = screen.getByTestId('label-radio-ruler');
      
      rulerLabelRadio.focus();
      expect(document.activeElement).toBe(rulerLabelRadio);
    });

    it('should allow Tab navigation to lock toggle', () => {
      render(<LayerToggle {...defaultProps} />);

      const lockToggle = screen.getByTestId('lock-toggle');
      
      lockToggle.focus();
      expect(document.activeElement).toBe(lockToggle);
    });

    it('should activate Area radio with Enter key', () => {
      render(<LayerToggle {...defaultProps} />);

      const cultureAreaRadio = screen.getByTestId('area-radio-culture');
      cultureAreaRadio.focus();
      
      fireEvent.keyDown(cultureAreaRadio, { key: 'Enter' });

      expect(mockOnColorChange).toHaveBeenCalledWith('culture');
    });

    it('should activate Area radio with Space key', () => {
      render(<LayerToggle {...defaultProps} />);

      const religionAreaRadio = screen.getByTestId('area-radio-religion');
      religionAreaRadio.focus();
      
      fireEvent.keyDown(religionAreaRadio, { key: ' ' });

      expect(mockOnColorChange).toHaveBeenCalledWith('religion');
    });

    it('should activate Label radio with Enter key', () => {
      render(<LayerToggle {...defaultProps} />);

      const cultureLabelRadio = screen.getByTestId('label-radio-culture');
      cultureLabelRadio.focus();
      
      fireEvent.keyDown(cultureLabelRadio, { key: 'Enter' });

      expect(mockOnLabelChange).toHaveBeenCalledWith('culture');
    });

    it('should activate Label radio with Space key', () => {
      render(<LayerToggle {...defaultProps} />);

      const religionLabelRadio = screen.getByTestId('label-radio-religion');
      religionLabelRadio.focus();
      
      fireEvent.keyDown(religionLabelRadio, { key: ' ' });

      expect(mockOnLabelChange).toHaveBeenCalledWith('religion');
    });

    it('should toggle lock with Enter key', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const lockToggle = screen.getByTestId('lock-toggle');
      lockToggle.focus();
      
      fireEvent.keyDown(lockToggle, { key: 'Enter' });

      expect(mockOnLockChange).toHaveBeenCalledWith(false);
    });

    it('should toggle lock with Space key', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const lockToggle = screen.getByTestId('lock-toggle');
      lockToggle.focus();
      
      fireEvent.keyDown(lockToggle, { key: ' ' });

      expect(mockOnLockChange).toHaveBeenCalledWith(true);
    });

    it('should not activate radio with other keys', () => {
      render(<LayerToggle {...defaultProps} />);

      const cultureAreaRadio = screen.getByTestId('area-radio-culture');
      cultureAreaRadio.focus();
      
      fireEvent.keyDown(cultureAreaRadio, { key: 'a' });
      fireEvent.keyDown(cultureAreaRadio, { key: 'Tab' });
      fireEvent.keyDown(cultureAreaRadio, { key: 'Escape' });

      expect(mockOnColorChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role on container', () => {
      render(<LayerToggle {...defaultProps} />);

      const container = screen.getByTestId('layer-toggle');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-label', 'Layer toggle controls for map visualization');
    });

    it('should have proper ARIA role on table', () => {
      render(<LayerToggle {...defaultProps} />);

      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'Layer dimension selection');
    });

    it('should have radio role on Area buttons', () => {
      render(<LayerToggle {...defaultProps} />);

      const rulerAreaRadio = screen.getByTestId('area-radio-ruler');
      expect(rulerAreaRadio).toHaveAttribute('role', 'radio');
    });

    it('should have radio role on Label buttons', () => {
      render(<LayerToggle {...defaultProps} />);

      const rulerLabelRadio = screen.getByTestId('label-radio-ruler');
      expect(rulerLabelRadio).toHaveAttribute('role', 'radio');
    });

    it('should have descriptive aria-label on Area radio buttons', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const cultureAreaRadio = screen.getByTestId('area-radio-culture');
      expect(cultureAreaRadio).toHaveAttribute(
        'aria-label',
        'Set area color to Culture (also sets label when locked)'
      );
    });

    it('should have descriptive aria-label on Label radio buttons', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const cultureLabelRadio = screen.getByTestId('label-radio-culture');
      expect(cultureLabelRadio).toHaveAttribute(
        'aria-label',
        'Set label to Culture (also sets area color when locked)'
      );
    });

    it('should have different aria-label when unlocked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const cultureAreaRadio = screen.getByTestId('area-radio-culture');
      expect(cultureAreaRadio).toHaveAttribute('aria-label', 'Set area color to Culture');

      const cultureLabelRadio = screen.getByTestId('label-radio-culture');
      expect(cultureLabelRadio).toHaveAttribute('aria-label', 'Set label to Culture');
    });

    it('should have descriptive aria-label on lock toggle', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const lockToggle = screen.getByTestId('lock-toggle');
      expect(lockToggle).toHaveAttribute('aria-label', 'Unlock area and label selection');
    });

    it('should have different aria-label on lock toggle when unlocked', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      const lockToggle = screen.getByTestId('lock-toggle');
      expect(lockToggle).toHaveAttribute('aria-label', 'Lock area and label selection');
    });

    it('should have tabIndex=0 on all interactive elements', () => {
      render(<LayerToggle {...defaultProps} />);

      const lockToggle = screen.getByTestId('lock-toggle');
      expect(lockToggle).toHaveAttribute('tabIndex', '0');

      const rulerAreaRadio = screen.getByTestId('area-radio-ruler');
      expect(rulerAreaRadio).toHaveAttribute('tabIndex', '0');

      const rulerLabelRadio = screen.getByTestId('label-radio-ruler');
      expect(rulerLabelRadio).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle clicking already active Area dimension', () => {
      render(<LayerToggle {...defaultProps} activeColor="ruler" locked={false} />);

      const rulerAreaRadio = screen.getByTestId('area-radio-ruler');
      fireEvent.click(rulerAreaRadio);

      // Should still call the callback even if already active
      expect(mockOnColorChange).toHaveBeenCalledWith('ruler');
    });

    it('should handle clicking already active Label dimension', () => {
      render(<LayerToggle {...defaultProps} activeLabel="ruler" locked={false} />);

      const rulerLabelRadio = screen.getByTestId('label-radio-ruler');
      fireEvent.click(rulerLabelRadio);

      // Should still call the callback even if already active
      expect(mockOnLabelChange).toHaveBeenCalledWith('ruler');
    });

    it('should handle rapid clicking on different dimensions', () => {
      render(<LayerToggle {...defaultProps} locked={false} />);

      fireEvent.click(screen.getByTestId('area-radio-culture'));
      fireEvent.click(screen.getByTestId('area-radio-religion'));
      fireEvent.click(screen.getByTestId('area-radio-population'));

      expect(mockOnColorChange).toHaveBeenCalledTimes(3);
      expect(mockOnColorChange).toHaveBeenNthCalledWith(1, 'culture');
      expect(mockOnColorChange).toHaveBeenNthCalledWith(2, 'religion');
      expect(mockOnColorChange).toHaveBeenNthCalledWith(3, 'population');
    });

    it('should handle toggling lock multiple times', () => {
      render(<LayerToggle {...defaultProps} locked={true} />);

      const lockToggle = screen.getByTestId('lock-toggle');
      
      fireEvent.click(lockToggle);
      fireEvent.click(lockToggle);
      fireEvent.click(lockToggle);

      expect(mockOnLockChange).toHaveBeenCalledTimes(3);
      // Since the component doesn't manage its own state, it always toggles based on current prop
      expect(mockOnLockChange).toHaveBeenNthCalledWith(1, false);
      expect(mockOnLockChange).toHaveBeenNthCalledWith(2, false);
      expect(mockOnLockChange).toHaveBeenNthCalledWith(3, false);
    });
  });
});

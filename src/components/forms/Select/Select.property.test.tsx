/**
 * Property-Based Tests for Select Component
 *
 * Feature: ui-primitives-migration, Property 8: Select single selection behavior
 * Validates: Requirements 7.4, 7.7, 7.8
 *
 * Tests that Select single selection works correctly.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { Select, type SelectOption } from './Select';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Generate valid options for testing
const generateOptions = (count: number): SelectOption[] => {
  return Array.from({ length: count }, (_, i) => ({
    value: `value-${String(i)}`,
    label: `Option ${String(i)}`,
  }));
};

describe('Select Property Tests', () => {
  /**
   * Property 8: Select single selection behavior
   * For any Select component with a list of options, selecting an option SHALL
   * update the displayed value to show that option's label.
   * Validates: Requirements 7.4, 7.7, 7.8
   */
  describe('Property 8: Select single selection behavior', () => {
    it('should display selected option label after selection', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (optionCount, selectedIndex) => {
            cleanup();
            const actualIndex = selectedIndex % optionCount;
            const options = generateOptions(optionCount);
            const selectedOption = options[actualIndex];
            if (!selectedOption) return;
            
            const handleChange = vi.fn();

            const { container } = render(
              <Select name="test" options={options} onChange={handleChange} />
            );

            // Open dropdown
            const trigger = container.querySelector('button');
            if (trigger) {
              fireEvent.click(trigger);
            }

            // Select an option
            const optionElements = container.querySelectorAll('[role="option"]');
            const optionEl = optionElements[actualIndex];
            if (optionEl) {
              fireEvent.click(optionEl);
            }

            // Verify the displayed value
            expect(trigger?.textContent).toContain(selectedOption.label);
            expect(handleChange).toHaveBeenCalledWith(selectedOption.value);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should only allow one option to be selected at a time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 9 }),
          (optionCount, firstIndex, secondIndex) => {
            cleanup();
            const actualSecond = secondIndex % optionCount;
            const options = generateOptions(optionCount);
            const secondOption = options[actualSecond];
            if (!secondOption) return;
            
            const handleChange = vi.fn();

            const { container } = render(
              <Select name="test" options={options} onChange={handleChange} />
            );

            const trigger = container.querySelector('button');

            // Select first option
            if (trigger) {
              fireEvent.click(trigger);
            }
            let optionElements = container.querySelectorAll('[role="option"]');
            const firstEl = optionElements[firstIndex % optionCount];
            if (firstEl) {
              fireEvent.click(firstEl);
            }

            // Select second option
            if (trigger) {
              fireEvent.click(trigger);
            }
            optionElements = container.querySelectorAll('[role="option"]');
            const secondEl = optionElements[actualSecond];
            if (secondEl) {
              fireEvent.click(secondEl);
            }

            // Only the second option should be displayed
            expect(trigger?.textContent).toContain(secondOption.label);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should show all options when dropdown is opened', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (optionCount) => {
          cleanup();
          const options = generateOptions(optionCount);

          const { container } = render(
            <Select name="test" options={options} />
          );

          // Open dropdown
          const trigger = container.querySelector('button');
          if (trigger) {
            fireEvent.click(trigger);
          }

          // All options should be visible
          const optionElements = container.querySelectorAll('[role="option"]');
          expect(optionElements.length).toBe(optionCount);

          // Each option should have correct label
          options.forEach((option, index) => {
            const el = optionElements[index];
            if (el) {
              expect(el.textContent).toBe(option.label);
            }
          });
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 2: Disabled state prevents interaction (Select portion)
   * For any Select with disabled=true, the select SHALL be disabled.
   * Validates: Requirements 7.6
   */
  describe('Property 2: Disabled state prevents interaction', () => {
    it('should not open dropdown when disabled', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (optionCount) => {
          cleanup();
          const options = generateOptions(optionCount);

          const { container } = render(
            <Select name="test" options={options} disabled />
          );

          // Try to open dropdown
          const trigger = container.querySelector('button');
          if (trigger) {
            fireEvent.click(trigger);
          }

          // Dropdown should not be visible
          const dropdown = container.querySelector('[role="listbox"]');
          expect(dropdown).toBeNull();
        }),
        { numRuns: 50 }
      );
    });

    it('should have disabled attribute on trigger when disabled', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (optionCount) => {
          cleanup();
          const options = generateOptions(optionCount);

          const { container } = render(
            <Select name="test" options={options} disabled />
          );

          const trigger = container.querySelector('button');
          expect(trigger).toBeDisabled();
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Error state tests
   * Validates: Requirements 7.5
   */
  describe('Error state', () => {
    it('should apply error class when error prop is true', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (optionCount) => {
          cleanup();
          const options = generateOptions(optionCount);

          const { container } = render(
            <Select name="test" options={options} error errorMessage="Error!" />
          );

          const wrapper = container.firstChild as HTMLElement;
          expect(wrapper.className).toContain('error');
        }),
        { numRuns: 50 }
      );
    });

    it('should display error message when error is true', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.stringMatching(/^[a-zA-Z0-9]+$/).filter((s) => s.length >= 1 && s.length <= 50),
          (optionCount, errorMessage) => {
            cleanup();
            const options = generateOptions(optionCount);

            render(
              <Select name="test" options={options} error errorMessage={errorMessage} />
            );

            expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Keyboard navigation tests
   * Validates: Requirements 7.10
   */
  describe('Keyboard navigation', () => {
    it('should open dropdown on Enter key', () => {
      const options = generateOptions(3);
      const { container } = render(<Select name="test" options={options} />);

      const trigger = container.querySelector('button');
      if (trigger) {
        fireEvent.keyDown(trigger, { key: 'Enter' });
      }

      const dropdown = container.querySelector('[role="listbox"]');
      expect(dropdown).toBeInTheDocument();
    });

    it('should close dropdown on Escape key', () => {
      const options = generateOptions(3);
      const { container } = render(<Select name="test" options={options} />);

      const trigger = container.querySelector('button');
      if (trigger) {
        // Open
        fireEvent.click(trigger);
        expect(container.querySelector('[role="listbox"]')).toBeInTheDocument();

        // Close with Escape
        fireEvent.keyDown(trigger, { key: 'Escape' });
        expect(container.querySelector('[role="listbox"]')).not.toBeInTheDocument();
      }
    });

    it('should navigate with arrow keys', () => {
      const options = generateOptions(3);
      const { container } = render(<Select name="test" options={options} />);

      const trigger = container.querySelector('button');
      if (trigger) {
        // Open dropdown
        fireEvent.click(trigger);

        // Navigate down once (from index 0 to index 1)
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });

        // Select with Enter
        fireEvent.keyDown(trigger, { key: 'Enter' });

        // Should have selected the second option (index 1)
        expect(trigger.textContent).toContain('Option 1');
      }
    });
  });

  /**
   * Default value tests
   */
  describe('Default values', () => {
    it('should display placeholder when no value selected', () => {
      const options = generateOptions(3);
      const { container } = render(
        <Select name="test" options={options} placeholder="Choose one" />
      );

      const trigger = container.querySelector('button');
      expect(trigger?.textContent).toContain('Choose one');
    });

    it('should display defaultValue when provided', () => {
      const options = generateOptions(3);
      const { container } = render(
        <Select name="test" options={options} defaultValue="value-1" />
      );

      const trigger = container.querySelector('button');
      expect(trigger?.textContent).toContain('Option 1');
    });
  });
});

/**
 * Property-Based Tests for Radio Component
 *
 * Feature: ui-primitives-migration, Property 10: Radio selection and group exclusivity
 * Validates: Requirements 9.2, 9.4, 9.7
 *
 * Tests that Radio selection and RadioGroup mutual exclusivity work correctly.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

describe('Radio Property Tests', () => {
  /**
   * Property 10: Radio selection and group exclusivity
   * For any Radio component, clicking SHALL set its checked state to true.
   * Validates: Requirements 9.2, 9.4
   */
  describe('Property 10: Radio selection', () => {
    it('should select radio on click', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z]+$/).filter((s) => s.length >= 1 && s.length <= 20),
          fc.stringMatching(/^[a-zA-Z0-9]+$/).filter((s) => s.length >= 1 && s.length <= 20),
          (name, value) => {
            cleanup();
            const handleChange = vi.fn();
            const { container } = render(
              <Radio name={name} value={value} onChange={handleChange} />
            );

            const input = container.querySelector('input');
            expect(input).not.toBeChecked();

            // Click to select
            if (input) {
              fireEvent.click(input);
            }

            expect(handleChange).toHaveBeenCalledTimes(1);
            expect(input).toBeChecked();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reflect checked state visually', () => {
      fc.assert(
        fc.property(fc.boolean(), (initialChecked) => {
          cleanup();
          const { container } = render(
            <Radio name="test" value="test" checked={initialChecked} onChange={() => { /* noop */ }} />
          );

          const input = container.querySelector('input');
          if (initialChecked) {
            expect(input).toBeChecked();
          } else {
            expect(input).not.toBeChecked();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * RadioGroup mutual exclusivity
   * For any RadioGroup, selecting one Radio SHALL deselect all others.
   * Validates: Requirements 9.7
   */
  describe('RadioGroup mutual exclusivity', () => {
    it('should only allow one radio to be selected in a group', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          fc.integer({ min: 0, max: 4 }),
          (optionCount, firstIndex, secondIndex) => {
            cleanup();
            const actualFirst = firstIndex % optionCount;
            const actualSecond = secondIndex % optionCount;
            const handleChange = vi.fn();

            const { container } = render(
              <RadioGroup name="test" onChange={handleChange}>
                {Array.from({ length: optionCount }, (_, i) => (
                  <Radio key={i} name="test" value={`option-${String(i)}`} label={`Option ${String(i)}`} />
                ))}
              </RadioGroup>
            );

            const inputs = container.querySelectorAll('input');

            // Select first option
            const firstInput = inputs[actualFirst];
            if (firstInput) {
              fireEvent.click(firstInput);
            }

            // Select second option
            const secondInput = inputs[actualSecond];
            if (secondInput) {
              fireEvent.click(secondInput);
            }

            // Only the second option should be checked
            inputs.forEach((input, index) => {
              if (index === actualSecond) {
                expect(input).toBeChecked();
              } else {
                expect(input).not.toBeChecked();
              }
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should call onChange with selected value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          (optionCount, selectedIndex) => {
            cleanup();
            const actualIndex = selectedIndex % optionCount;
            const handleChange = vi.fn();

            const { container } = render(
              <RadioGroup name="test" onChange={handleChange}>
                {Array.from({ length: optionCount }, (_, i) => (
                  <Radio key={i} name="test" value={`option-${String(i)}`} label={`Option ${String(i)}`} />
                ))}
              </RadioGroup>
            );

            const inputs = container.querySelectorAll('input');
            const selectedInput = inputs[actualIndex];
            if (selectedInput) {
              fireEvent.click(selectedInput);
            }

            expect(handleChange).toHaveBeenCalledWith(`option-${String(actualIndex)}`);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 2: Disabled state prevents interaction (Radio portion)
   * For any Radio with disabled=true, clicking SHALL NOT select it.
   * Validates: Requirements 9.5
   */
  describe('Property 2: Disabled state prevents interaction', () => {
    it('should have disabled attribute when disabled', () => {
      fc.assert(
        fc.property(fc.boolean(), (initialChecked) => {
          cleanup();
          const { container } = render(
            <Radio
              name="test"
              value="test"
              checked={initialChecked}
              disabled
              onChange={() => { /* noop */ }}
            />
          );

          const input = container.querySelector('input');
          expect(input).toBeDisabled();
        }),
        { numRuns: 100 }
      );
    });

    it('should apply disabled class when disabled', () => {
      fc.assert(
        fc.property(fc.boolean(), (initialChecked) => {
          cleanup();
          const { container } = render(
            <Radio
              name="test"
              value="test"
              checked={initialChecked}
              disabled
              onChange={() => { /* noop */ }}
            />
          );

          const wrapper = container.firstChild as HTMLElement;
          expect(wrapper.className).toContain('disabled');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Label rendering tests
   * Validates: Requirements 9.2
   */
  describe('Label rendering', () => {
    it('should render label when provided', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9]+$/).filter((s) => s.length >= 1 && s.length <= 30),
          (label) => {
            cleanup();
            const { container } = render(
              <Radio name="test" value="test" label={label} />
            );

            const labelEl = container.querySelector('[class*="label"]');
            expect(labelEl).not.toBeNull();
            expect(labelEl?.textContent).toBe(label);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not render label when not provided', () => {
      const { container } = render(<Radio name="test" value="test" />);

      const labelEl = container.querySelector('[class*="label"]');
      expect(labelEl).toBeNull();
    });
  });

  /**
   * RadioGroup direction tests
   */
  describe('RadioGroup direction', () => {
    it('should apply row direction class', () => {
      const { container } = render(
        <RadioGroup name="test" direction="row">
          <Radio name="test" value="1" label="Option 1" />
          <Radio name="test" value="2" label="Option 2" />
        </RadioGroup>
      );

      const group = container.querySelector('[role="radiogroup"]');
      expect(group?.className).toContain('direction-row');
    });

    it('should apply column direction class by default', () => {
      const { container } = render(
        <RadioGroup name="test">
          <Radio name="test" value="1" label="Option 1" />
          <Radio name="test" value="2" label="Option 2" />
        </RadioGroup>
      );

      const group = container.querySelector('[role="radiogroup"]');
      expect(group?.className).toContain('direction-column');
    });
  });
});

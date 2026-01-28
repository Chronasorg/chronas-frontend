/**
 * Property-Based Tests for Input Component
 *
 * Feature: ui-primitives-migration, Property 7: Input type and floating label
 * Validates: Requirements 6.1, 6.2
 *
 * Tests that Input types are correctly applied and floating label behavior works.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Input, type InputType } from './Input';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Input types for property testing
const inputTypes: InputType[] = ['text', 'email', 'password', 'number', 'url'];

// No-op handler for controlled inputs
const noop = () => {
  // intentionally empty
};

describe('Input Property Tests', () => {
  /**
   * Property 7: Input type and floating label
   * For any Input with type ∈ {text, email, password, number, url}, the rendered
   * input element SHALL have the correct type attribute.
   * Validates: Requirements 6.1, 6.2
   */
  describe('Property 7: Input type and floating label', () => {
    it('should render correct input type for all types', () => {
      fc.assert(
        fc.property(fc.constantFrom(...inputTypes), (type) => {
          cleanup();
          const { container } = render(<Input name="test" type={type} />);
          const input = container.querySelector('input');

          expect(input).toHaveAttribute('type', type);
        }),
        { numRuns: 100 }
      );
    });

    it('should float label when input is focused', () => {
      fc.assert(
        fc.property(fc.constantFrom(...inputTypes), (type) => {
          cleanup();
          const { container } = render(
            <Input name="test" type={type} label="Test Label" />
          );
          const input = container.querySelector('input');
          const label = container.querySelector('label');

          // Initially not floating (no value, not focused)
          expect(label?.className).not.toContain('floating');

          // Focus the input
          if (input) {
            fireEvent.focus(input);
          }

          // Label should now be floating
          expect(label?.className).toContain('floating');
        }),
        { numRuns: 100 }
      );
    });

    it('should float label when input has value', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...inputTypes),
          fc.stringMatching(/^[a-zA-Z0-9]+$/).filter((s) => s.length >= 1 && s.length <= 20),
          (type, value) => {
            cleanup();
            const { container } = render(
              <Input name="test" type={type} label="Test Label" value={value} onChange={noop} />
            );
            const label = container.querySelector('label');

            // Label should be floating when there's a value
            expect(label?.className).toContain('floating');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should float label when input has defaultValue', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...inputTypes),
          fc.stringMatching(/^[a-zA-Z0-9]+$/).filter((s) => s.length >= 1 && s.length <= 20),
          (type, defaultValue) => {
            cleanup();
            const { container } = render(
              <Input name="test" type={type} label="Test Label" defaultValue={defaultValue} />
            );
            const label = container.querySelector('label');

            // Label should be floating when there's a default value
            expect(label?.className).toContain('floating');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should unfloat label when input loses focus and has no value', () => {
      fc.assert(
        fc.property(fc.constantFrom(...inputTypes), (type) => {
          cleanup();
          const { container } = render(
            <Input name="test" type={type} label="Test Label" />
          );
          const input = container.querySelector('input');
          const label = container.querySelector('label');

          // Focus then blur
          if (input) {
            fireEvent.focus(input);
            expect(label?.className).toContain('floating');

            fireEvent.blur(input);
            expect(label?.className).not.toContain('floating');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Disabled state prevents interaction (Input portion)
   * For any Input with disabled=true, the input SHALL be disabled.
   * Validates: Requirements 6.5
   */
  describe('Property 2: Disabled state prevents interaction', () => {
    it('should be disabled when disabled prop is true', () => {
      fc.assert(
        fc.property(fc.constantFrom(...inputTypes), (type) => {
          cleanup();
          const handleChange = vi.fn();
          const { container } = render(
            <Input name="test" type={type} disabled onChange={handleChange} />
          );
          const input = container.querySelector('input');

          expect(input).toBeDisabled();
        }),
        { numRuns: 100 }
      );
    });

    it('should apply disabled class when disabled', () => {
      fc.assert(
        fc.property(fc.constantFrom(...inputTypes), (type) => {
          cleanup();
          const { container } = render(
            <Input name="test" type={type} disabled />
          );
          const wrapper = container.firstChild as HTMLElement;

          expect(wrapper.className).toContain('disabled');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Error state tests
   * Validates: Requirements 6.4
   */
  describe('Error state', () => {
    it('should apply error class when error prop is true', () => {
      fc.assert(
        fc.property(fc.constantFrom(...inputTypes), (type) => {
          cleanup();
          const { container } = render(
            <Input name="test" type={type} error errorMessage="Error!" />
          );
          const wrapper = container.firstChild as HTMLElement;

          expect(wrapper.className).toContain('error');
        }),
        { numRuns: 100 }
      );
    });

    it('should display error message when error is true', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...inputTypes),
          fc.stringMatching(/^[a-zA-Z0-9 ]+$/).filter((s) => s.length >= 1 && s.length <= 50),
          (type, errorMessage) => {
            cleanup();
            const { container } = render(
              <Input name="test" type={type} error errorMessage={errorMessage} />
            );
            const errorEl = container.querySelector('[class*="errorMessage"]');

            expect(errorEl).not.toBeNull();
            expect(errorEl?.textContent).toBe(errorMessage);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should have aria-invalid when error is true', () => {
      fc.assert(
        fc.property(fc.constantFrom(...inputTypes), (type) => {
          cleanup();
          const { container } = render(
            <Input name="test" type={type} error />
          );
          const input = container.querySelector('input');

          expect(input).toHaveAttribute('aria-invalid', 'true');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Full width tests
   * Validates: Requirements 6.8
   */
  describe('Full width', () => {
    it('should apply fullWidth class when fullWidth prop is true', () => {
      fc.assert(
        fc.property(fc.constantFrom(...inputTypes), (type) => {
          cleanup();
          const { container } = render(
            <Input name="test" type={type} fullWidth />
          );
          const wrapper = container.firstChild as HTMLElement;

          expect(wrapper.className).toContain('fullWidth');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Default type test
   */
  describe('Default values', () => {
    it('should default to text type when not specified', () => {
      const { container } = render(<Input name="test" />);
      const input = container.querySelector('input');

      expect(input).toHaveAttribute('type', 'text');
    });
  });
});

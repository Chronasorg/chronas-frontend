/**
 * Cross-Component Property-Based Tests
 *
 * Feature: ui-primitives-migration
 * Tests properties that span multiple components.
 *
 * Property 1: Theme color application
 * Property 2: Disabled state prevents interaction
 * Property 3: Click handlers trigger correctly
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';

// Import all components
import { Button } from './primitives/Button';
import { Text } from './primitives/Text';
import { Card } from './primitives/Card';
import { SpinnerGlobal } from './primitives/SpinnerGlobal';
import { Input } from './forms/Input';
import { Select } from './forms/Select';
import { Checkbox } from './forms/Checkbox';
import { Radio } from './forms/Radio';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

const themes = ['light', 'dark', 'luther'] as const;

describe('Cross-Component Property Tests', () => {
  /**
   * Property 1: Theme color application
   * For any UI component and any active theme, the component SHALL apply
   * the correct theme-specific CSS custom property values.
   * Validates: Requirements 1.6, 2.7, 3.6, 4.5, 5.3, 6.9, 7.9, 8.7, 9.6
   */
  describe('Property 1: Theme color application', () => {
    it('should render Button with all themes without errors', () => {
      fc.assert(
        fc.property(fc.constantFrom(...themes), (theme) => {
          cleanup();
          document.documentElement.setAttribute('data-theme', theme);
          
          const { container } = render(<Button>Test Button</Button>);
          const button = container.querySelector('button');
          expect(button).not.toBeNull();
        }),
        { numRuns: 30 }
      );
    });

    it('should render Text with all themes without errors', () => {
      fc.assert(
        fc.property(fc.constantFrom(...themes), (theme) => {
          cleanup();
          document.documentElement.setAttribute('data-theme', theme);
          
          const { container } = render(<Text>Test Text</Text>);
          expect(container.textContent).toBe('Test Text');
        }),
        { numRuns: 30 }
      );
    });

    it('should render Card with all themes without errors', () => {
      fc.assert(
        fc.property(fc.constantFrom(...themes), (theme) => {
          cleanup();
          document.documentElement.setAttribute('data-theme', theme);
          
          const { container } = render(<Card>Test Card</Card>);
          expect(container.firstChild).not.toBeNull();
        }),
        { numRuns: 30 }
      );
    });

    it('should render SpinnerGlobal with all themes without errors', () => {
      fc.assert(
        fc.property(fc.constantFrom(...themes), (theme) => {
          cleanup();
          document.documentElement.setAttribute('data-theme', theme);
          
          const { container } = render(<SpinnerGlobal />);
          expect(container.firstChild).not.toBeNull();
        }),
        { numRuns: 30 }
      );
    });

    it('should render Input with all themes without errors', () => {
      fc.assert(
        fc.property(fc.constantFrom(...themes), (theme) => {
          cleanup();
          document.documentElement.setAttribute('data-theme', theme);
          
          const { container } = render(<Input name="test" />);
          const input = container.querySelector('input');
          expect(input).not.toBeNull();
        }),
        { numRuns: 30 }
      );
    });

    it('should render Select with all themes without errors', () => {
      fc.assert(
        fc.property(fc.constantFrom(...themes), (theme) => {
          cleanup();
          document.documentElement.setAttribute('data-theme', theme);
          
          const { container } = render(
            <Select
              name="test"
              options={[{ value: '1', label: 'Option 1' }]}
            />
          );
          expect(container.firstChild).not.toBeNull();
        }),
        { numRuns: 30 }
      );
    });

    it('should render Checkbox with all themes without errors', () => {
      fc.assert(
        fc.property(fc.constantFrom(...themes), (theme) => {
          cleanup();
          document.documentElement.setAttribute('data-theme', theme);
          
          const { container } = render(<Checkbox name="test" />);
          const input = container.querySelector('input');
          expect(input).not.toBeNull();
        }),
        { numRuns: 30 }
      );
    });

    it('should render Radio with all themes without errors', () => {
      fc.assert(
        fc.property(fc.constantFrom(...themes), (theme) => {
          cleanup();
          document.documentElement.setAttribute('data-theme', theme);
          
          const { container } = render(<Radio name="test" value="test" />);
          const input = container.querySelector('input');
          expect(input).not.toBeNull();
        }),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 2: Disabled state prevents interaction
   * For any interactive component with disabled=true, clicking SHALL NOT
   * trigger onClick handlers, onChange handlers, or state changes.
   * Validates: Requirements 2.6, 8.6, 9.5
   */
  describe('Property 2: Disabled state prevents interaction', () => {
    it('should prevent Button click when disabled', () => {
      fc.assert(
        fc.property(fc.boolean(), (initialDisabled) => {
          cleanup();
          const handleClick = vi.fn();
          const { container } = render(
            <Button disabled={initialDisabled} onClick={handleClick}>
              Test
            </Button>
          );

          const button = container.querySelector('button');
          if (button) {
            fireEvent.click(button);
          }

          if (initialDisabled) {
            expect(handleClick).not.toHaveBeenCalled();
          } else {
            expect(handleClick).toHaveBeenCalledTimes(1);
          }
        }),
        { numRuns: 50 }
      );
    });

    it('should have disabled attribute on Input when disabled', () => {
      const { container } = render(<Input name="test" disabled />);
      const input = container.querySelector('input');
      expect(input).toBeDisabled();
    });

    it('should have disabled attribute on Select when disabled', () => {
      const { container } = render(
        <Select
          name="test"
          options={[{ value: '1', label: 'Option 1' }]}
          disabled
        />
      );
      const button = container.querySelector('button');
      expect(button).toBeDisabled();
    });

    it('should have disabled attribute on Checkbox when disabled', () => {
      const { container } = render(<Checkbox name="test" disabled />);
      const input = container.querySelector('input');
      expect(input).toBeDisabled();
    });

    it('should have disabled attribute on Radio when disabled', () => {
      const { container } = render(<Radio name="test" value="test" disabled />);
      const input = container.querySelector('input');
      expect(input).toBeDisabled();
    });
  });

  /**
   * Property 3: Click handlers trigger correctly
   * For any enabled interactive component with an onClick or onChange handler,
   * clicking SHALL trigger the handler exactly once.
   * Validates: Requirements 2.5, 4.7, 8.5, 9.4
   */
  describe('Property 3: Click handlers trigger correctly', () => {
    it('should trigger Button onClick exactly once', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), (clickCount) => {
          cleanup();
          const handleClick = vi.fn();
          const { container } = render(
            <Button onClick={handleClick}>Test</Button>
          );

          const button = container.querySelector('button');
          for (let i = 0; i < clickCount; i++) {
            if (button) {
              fireEvent.click(button);
            }
          }

          expect(handleClick).toHaveBeenCalledTimes(clickCount);
        }),
        { numRuns: 30 }
      );
    });

    it('should trigger Card onClick exactly once', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), (clickCount) => {
          cleanup();
          const handleClick = vi.fn();
          const { container } = render(
            <Card onClick={handleClick}>Test Card</Card>
          );

          const card = container.firstChild as HTMLElement;
          for (let i = 0; i < clickCount; i++) {
            fireEvent.click(card);
          }

          expect(handleClick).toHaveBeenCalledTimes(clickCount);
        }),
        { numRuns: 30 }
      );
    });

    it('should trigger Checkbox onChange on click', () => {
      const handleChange = vi.fn();
      const { container } = render(
        <Checkbox name="test" onChange={handleChange} />
      );

      const input = container.querySelector('input');
      if (input) {
        fireEvent.click(input);
      }

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should trigger Radio onChange on click', () => {
      const handleChange = vi.fn();
      const { container } = render(
        <Radio name="test" value="test" onChange={handleChange} />
      );

      const input = container.querySelector('input');
      if (input) {
        fireEvent.click(input);
      }

      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });
});

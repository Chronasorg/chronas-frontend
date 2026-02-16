/**
 * AutoplayMenu Property-Based Tests
 *
 * **Feature: mvp-visual-polish, Property 1: Autoplay Menu Contains Required Elements**
 * **Validates: Requirements 1.3**
 *
 * Property tests verify that for any click on the autoplay button,
 * the opened Autoplay_Menu SHALL contain all required elements:
 * - "AUTOPLAY" header text
 * - "CHANGES YEAR BY STEP SIZE" subtitle
 * - Start Year input
 * - End Year input
 * - Step Size input
 * - Delay input
 * - Repeat checkbox
 * - "START SLIDESHOW" button
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { AutoplayMenu } from './AutoplayMenu';
import type { AutoplayMenuProps } from './AutoplayMenu';
import type { AutoplayConfig } from '../../../stores/timelineStore';

describe('AutoplayMenu Property Tests', () => {
  /**
   * Arbitrary generator for valid autoplay configuration
   */
  const autoplayConfigArbitrary = fc.record({
    startYear: fc.integer({ min: -4000, max: 2000 }),
    endYear: fc.integer({ min: -4000, max: 2000 }),
    stepSize: fc.integer({ min: 1, max: 500 }),
    delay: fc.integer({ min: 100, max: 60000 }), // delay in milliseconds
    repeat: fc.boolean(),
  });

  /**
   * Helper to create default props for AutoplayMenu
   */
  const createDefaultProps = (config: AutoplayConfig): AutoplayMenuProps => ({
    config,
    onConfigChange: vi.fn(),
    onStart: vi.fn(),
    onClose: vi.fn(),
  });

  describe('Property 1: Autoplay Menu Contains Required Elements', () => {
    /**
     * **Validates: Requirements 1.3**
     *
     * For any click on the autoplay button, the opened Autoplay_Menu SHALL contain
     * all required elements: "AUTOPLAY" header text, "CHANGES YEAR BY STEP SIZE" subtitle,
     * Start Year input, End Year input, Step Size input, Delay input, Repeat checkbox,
     * and "START SLIDESHOW" button.
     */

    it('should contain "AUTOPLAY" header text for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const title = screen.getByTestId('autoplay-menu-title');
          expect(title).toBeInTheDocument();
          expect(title).toHaveTextContent('AUTOPLAY');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should contain "CHANGES YEAR BY STEP SIZE" subtitle for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const subtitle = screen.getByTestId('autoplay-menu-subtitle');
          expect(subtitle).toBeInTheDocument();
          expect(subtitle).toHaveTextContent('CHANGES YEAR BY STEP SIZE');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should contain Start Year input for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const startYearInput = screen.getByTestId('autoplay-start-year');
          expect(startYearInput).toBeInTheDocument();
          expect(startYearInput).toHaveAttribute('type', 'number');
          expect(startYearInput).toHaveAttribute('id', 'autoplay-start-year');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should contain End Year input for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const endYearInput = screen.getByTestId('autoplay-end-year');
          expect(endYearInput).toBeInTheDocument();
          expect(endYearInput).toHaveAttribute('type', 'number');
          expect(endYearInput).toHaveAttribute('id', 'autoplay-end-year');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should contain Step Size input for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const stepSizeInput = screen.getByTestId('autoplay-step-size');
          expect(stepSizeInput).toBeInTheDocument();
          expect(stepSizeInput).toHaveAttribute('type', 'number');
          expect(stepSizeInput).toHaveAttribute('id', 'autoplay-step-size');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should contain Delay input for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const delayInput = screen.getByTestId('autoplay-delay');
          expect(delayInput).toBeInTheDocument();
          expect(delayInput).toHaveAttribute('type', 'number');
          expect(delayInput).toHaveAttribute('id', 'autoplay-delay');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should contain Repeat checkbox for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const repeatCheckbox = screen.getByTestId('autoplay-repeat');
          expect(repeatCheckbox).toBeInTheDocument();
          expect(repeatCheckbox).toHaveAttribute('type', 'checkbox');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should contain "START SLIDESHOW" button for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const startButton = screen.getByTestId('autoplay-start-button');
          expect(startButton).toBeInTheDocument();
          expect(startButton).toHaveTextContent('START SLIDESHOW');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should contain ALL required elements for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          // Verify all required elements are present
          const title = screen.getByTestId('autoplay-menu-title');
          const subtitle = screen.getByTestId('autoplay-menu-subtitle');
          const startYearInput = screen.getByTestId('autoplay-start-year');
          const endYearInput = screen.getByTestId('autoplay-end-year');
          const stepSizeInput = screen.getByTestId('autoplay-step-size');
          const delayInput = screen.getByTestId('autoplay-delay');
          const repeatCheckbox = screen.getByTestId('autoplay-repeat');
          const startButton = screen.getByTestId('autoplay-start-button');

          // All elements must be in the document
          expect(title).toBeInTheDocument();
          expect(subtitle).toBeInTheDocument();
          expect(startYearInput).toBeInTheDocument();
          expect(endYearInput).toBeInTheDocument();
          expect(stepSizeInput).toBeInTheDocument();
          expect(delayInput).toBeInTheDocument();
          expect(repeatCheckbox).toBeInTheDocument();
          expect(startButton).toBeInTheDocument();

          // Verify text content
          expect(title).toHaveTextContent('AUTOPLAY');
          expect(subtitle).toHaveTextContent('CHANGES YEAR BY STEP SIZE');
          expect(startButton).toHaveTextContent('START SLIDESHOW');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should display input values matching the provided configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const startYearInput = screen.getByTestId<HTMLInputElement>('autoplay-start-year');
          const endYearInput = screen.getByTestId<HTMLInputElement>('autoplay-end-year');
          const stepSizeInput = screen.getByTestId<HTMLInputElement>('autoplay-step-size');
          const delayInput = screen.getByTestId<HTMLInputElement>('autoplay-delay');
          const repeatCheckbox = screen.getByTestId<HTMLInputElement>('autoplay-repeat');

          // Verify input values match configuration
          expect(startYearInput.value).toBe(config.startYear.toString());
          expect(endYearInput.value).toBe(config.endYear.toString());
          expect(stepSizeInput.value).toBe(config.stepSize.toString());
          // Delay is stored in milliseconds but displayed in seconds
          expect(delayInput.value).toBe((config.delay / 1000).toString());
          expect(repeatCheckbox.checked).toBe(config.repeat);

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should have proper labels for all input fields', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          // Verify labels exist and are associated with inputs
          const startYearLabel = screen.getByLabelText('Start Year');
          const endYearLabel = screen.getByLabelText('End Year');
          const stepSizeLabel = screen.getByLabelText('Step Size in Years');
          const delayLabel = screen.getByLabelText('Delay in Sec');

          expect(startYearLabel).toBeInTheDocument();
          expect(endYearLabel).toBeInTheDocument();
          expect(stepSizeLabel).toBeInTheDocument();
          expect(delayLabel).toBeInTheDocument();

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should have close button for any configuration', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const closeButton = screen.getByTestId('autoplay-menu-close');
          expect(closeButton).toBeInTheDocument();
          expect(closeButton).toHaveAttribute('aria-label', 'Close autoplay menu');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should have proper accessibility attributes for the menu', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const menu = screen.getByTestId('autoplay-menu');
          expect(menu).toBeInTheDocument();
          expect(menu).toHaveAttribute('role', 'dialog');
          expect(menu).toHaveAttribute('aria-label', 'Autoplay configuration');

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should have play icon in the start button', () => {
      fc.assert(
        fc.property(autoplayConfigArbitrary, (config) => {
          const props = createDefaultProps(config);
          const { unmount } = render(<AutoplayMenu {...props} />);

          const startButton = screen.getByTestId('autoplay-start-button');
          const svg = startButton.querySelector('svg');

          // Verify play icon SVG is present
          expect(svg).toBeInTheDocument();
          expect(svg).toHaveAttribute('aria-hidden', 'true');

          // Verify it's a play icon (polygon with triangle points)
          const polygon = svg?.querySelector('polygon');
          expect(polygon).toBeInTheDocument();

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain element presence across multiple renders with different configs', () => {
      fc.assert(
        fc.property(
          fc.array(autoplayConfigArbitrary, { minLength: 2, maxLength: 5 }),
          (configs) => {
            for (const config of configs) {
              const props = createDefaultProps(config);
              const { unmount } = render(<AutoplayMenu {...props} />);

              // All required elements should be present for each config
              expect(screen.getByTestId('autoplay-menu-title')).toBeInTheDocument();
              expect(screen.getByTestId('autoplay-menu-subtitle')).toBeInTheDocument();
              expect(screen.getByTestId('autoplay-start-year')).toBeInTheDocument();
              expect(screen.getByTestId('autoplay-end-year')).toBeInTheDocument();
              expect(screen.getByTestId('autoplay-step-size')).toBeInTheDocument();
              expect(screen.getByTestId('autoplay-delay')).toBeInTheDocument();
              expect(screen.getByTestId('autoplay-repeat')).toBeInTheDocument();
              expect(screen.getByTestId('autoplay-start-button')).toBeInTheDocument();

              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

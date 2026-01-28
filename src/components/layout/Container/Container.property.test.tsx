/**
 * Property-Based Tests for Container Component
 *
 * Feature: ui-primitives-migration, Property 14: Container max-width presets
 * Validates: Requirements 13.2
 *
 * Tests that Container max-width presets are correctly applied.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Container, type ContainerMaxWidth } from './Container';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

const maxWidths: ContainerMaxWidth[] = ['sm', 'md', 'lg', 'xl', 'full'];

describe('Container Property Tests', () => {
  /**
   * Property 14: Container max-width presets
   * For any Container with maxWidth, the max-width CSS property SHALL match the preset value.
   * Validates: Requirements 13.2
   */
  describe('Property 14: Container max-width presets', () => {
    it('should apply correct max-width class for all presets', () => {
      fc.assert(
        fc.property(fc.constantFrom(...maxWidths), (maxWidth) => {
          cleanup();
          const { container } = render(
            <Container maxWidth={maxWidth}>
              <div>Content</div>
            </Container>
          );

          const containerEl = container.firstChild as HTMLElement;
          expect(containerEl.className).toContain(`max-width-${maxWidth}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Container base class
   */
  describe('Container base class', () => {
    it('should always have container base class', () => {
      fc.assert(
        fc.property(
          fc.option(fc.constantFrom(...maxWidths), { nil: undefined }),
          (maxWidth) => {
            cleanup();
            const { container } = render(
              maxWidth ? (
                <Container maxWidth={maxWidth}>
                  <div>Content</div>
                </Container>
              ) : (
                <Container>
                  <div>Content</div>
                </Container>
              )
            );

            const containerEl = container.firstChild as HTMLElement;
            expect(containerEl.className).toContain('container');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Container centering
   */
  describe('Container centering', () => {
    it('should apply center class by default', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl.className).toContain('center');
    });

    it('should apply center class when center is true', () => {
      const { container } = render(
        <Container center>
          <div>Content</div>
        </Container>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl.className).toContain('center');
    });

    it('should not apply center class when center is false', () => {
      const { container } = render(
        <Container center={false}>
          <div>Content</div>
        </Container>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl.className).not.toContain('center');
    });
  });

  /**
   * Container fluid mode
   */
  describe('Container fluid mode', () => {
    it('should apply fluid class when fluid is true', () => {
      const { container } = render(
        <Container fluid>
          <div>Content</div>
        </Container>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl.className).toContain('fluid');
    });

    it('should not apply fluid class by default', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      );

      const containerEl = container.firstChild as HTMLElement;
      expect(containerEl.className).not.toContain('fluid');
    });
  });

  /**
   * Combined property test
   */
  describe('Combined properties', () => {
    it('should apply all properties correctly', () => {
      fc.assert(
        fc.property(
          fc.option(fc.constantFrom(...maxWidths), { nil: undefined }),
          fc.boolean(),
          fc.boolean(),
          (maxWidth, fluid, center) => {
            cleanup();
            const { container } = render(
              maxWidth ? (
                <Container maxWidth={maxWidth} fluid={fluid} center={center}>
                  <div>Content</div>
                </Container>
              ) : (
                <Container fluid={fluid} center={center}>
                  <div>Content</div>
                </Container>
              )
            );

            const containerEl = container.firstChild as HTMLElement;
            expect(containerEl.className).toContain('container');
            
            if (maxWidth) {
              expect(containerEl.className).toContain(`max-width-${maxWidth}`);
            }
            
            if (fluid) {
              expect(containerEl.className).toContain('fluid');
            }
            
            if (center) {
              expect(containerEl.className).toContain('center');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Custom className support
   */
  describe('Custom className', () => {
    it('should apply custom className', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-]*$/).filter((s) => s.length >= 1 && s.length <= 20),
          (customClass) => {
            cleanup();
            const { container } = render(
              <Container className={customClass}>
                <div>Content</div>
              </Container>
            );

            const containerEl = container.firstChild as HTMLElement;
            expect(containerEl.className).toContain(customClass);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

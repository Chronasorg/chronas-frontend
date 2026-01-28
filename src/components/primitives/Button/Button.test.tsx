/**
 * Button Component Unit Tests
 *
 * Tests for the Button component covering:
 * - Rendering with different variants and sizes
 * - Disabled and loading states
 * - Click handler invocation
 * - Icon rendering
 * - Full width prop
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('should render as a button element', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have default type of button', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should support submit type', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should support reset type', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('variants', () => {
    it('should render with primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/variant-primary/);
    });

    it('should render with primary variant when specified', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/variant-primary/);
    });

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/variant-secondary/);
    });

    it('should render with text variant', () => {
      render(<Button variant="text">Text</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/variant-text/);
    });
  });

  describe('sizes', () => {
    it('should render with medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/size-medium/);
    });

    it('should render with small size', () => {
      render(<Button size="small">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/size-small/);
    });

    it('should render with medium size when specified', () => {
      render(<Button size="medium">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/size-medium/);
    });

    it('should render with large size', () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/size-large/);
    });
  });

  describe('disabled state', () => {
    it('should apply disabled class when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/disabled/);
    });

    it('should have disabled attribute when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should have aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not trigger onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should apply loading class when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/loading/);
    });

    it('should have disabled attribute when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should have aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not trigger onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('click handler', () => {
    it('should trigger onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should pass event to onClick handler', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should trigger onClick multiple times on multiple clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should work without onClick handler', () => {
      render(<Button>No handler</Button>);
      expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
    });
  });

  describe('icons', () => {
    it('should render startIcon when provided', () => {
      render(
        <Button startIcon={<span data-testid="start-icon">→</span>}>
          With Start Icon
        </Button>
      );
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });

    it('should render endIcon when provided', () => {
      render(
        <Button endIcon={<span data-testid="end-icon">←</span>}>
          With End Icon
        </Button>
      );
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });

    it('should render both startIcon and endIcon when provided', () => {
      render(
        <Button
          startIcon={<span data-testid="start-icon">→</span>}
          endIcon={<span data-testid="end-icon">←</span>}
        >
          With Both Icons
        </Button>
      );
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });

    it('should render startIcon before label', () => {
      render(
        <Button startIcon={<span data-testid="start-icon">→</span>}>
          Label
        </Button>
      );
      const button = screen.getByRole('button');
      const startIcon = screen.getByTestId('start-icon');
      
      // Check that startIcon comes before label in DOM order
      const children = Array.from(button.querySelectorAll('span'));
      const startIconIndex = children.findIndex(el => el.contains(startIcon));
      const labelIndex = children.findIndex(el => el.textContent === 'Label');
      expect(startIconIndex).toBeLessThan(labelIndex);
    });

    it('should render endIcon after label', () => {
      render(
        <Button endIcon={<span data-testid="end-icon">←</span>}>
          Label
        </Button>
      );
      const button = screen.getByRole('button');
      const endIcon = screen.getByTestId('end-icon');
      
      // Check that endIcon comes after label in DOM order
      const children = Array.from(button.querySelectorAll('span'));
      const endIconIndex = children.findIndex(el => el.contains(endIcon));
      const labelIndex = children.findIndex(el => el.textContent === 'Label');
      expect(endIconIndex).toBeGreaterThan(labelIndex);
    });
  });

  describe('fullWidth', () => {
    it('should apply fullWidth class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/fullWidth/);
    });

    it('should not apply fullWidth class when fullWidth is false', () => {
      render(<Button fullWidth={false}>Not Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).not.toMatch(/fullWidth/);
    });

    it('should not apply fullWidth class by default', () => {
      render(<Button>Default Width</Button>);
      const button = screen.getByRole('button');
      expect(button.className).not.toMatch(/fullWidth/);
    });
  });

  describe('combined states', () => {
    it('should apply both variant and size classes', () => {
      render(
        <Button variant="secondary" size="large">
          Secondary Large
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/variant-secondary/);
      expect(button.className).toMatch(/size-large/);
    });

    it('should apply disabled and variant classes together', () => {
      render(
        <Button variant="primary" disabled>
          Disabled Primary
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/variant-primary/);
      expect(button.className).toMatch(/disabled/);
    });

    it('should apply loading and fullWidth classes together', () => {
      render(
        <Button loading fullWidth>
          Loading Full Width
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/loading/);
      expect(button.className).toMatch(/fullWidth/);
    });

    it('should apply all props together', () => {
      const handleClick = vi.fn();
      render(
        <Button
          variant="text"
          size="small"
          fullWidth
          startIcon={<span data-testid="icon">★</span>}
          onClick={handleClick}
          className="custom"
        >
          All Props
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/variant-text/);
      expect(button.className).toMatch(/size-small/);
      expect(button.className).toMatch(/fullWidth/);
      expect(button).toHaveClass('custom');
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });
  });
});

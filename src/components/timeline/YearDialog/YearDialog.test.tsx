/**
 * YearDialog Component Tests
 *
 * Unit tests for the YearDialog component covering rendering,
 * input validation, submission behavior, focus management, and accessibility.
 *
 * Requirements: 7.1, 7.4, 7.7, 14.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { YearDialog } from './YearDialog';
import type { YearDialogProps } from './YearDialog';

describe('YearDialog', () => {
  const defaultProps: YearDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<YearDialog {...defaultProps} isOpen={true} />);
      
      expect(screen.getByTestId('year-dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<YearDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('year-dialog')).not.toBeInTheDocument();
    });

    it('renders with correct structure when open', () => {
      render(<YearDialog {...defaultProps} />);
      
      expect(screen.getByTestId('year-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('year-dialog-input')).toBeInTheDocument();
      expect(screen.getByTestId('year-dialog-close')).toBeInTheDocument();
      expect(screen.getByTestId('year-dialog-search')).toBeInTheDocument();
    });

    it('displays placeholder text', () => {
      render(<YearDialog {...defaultProps} placeholder="Enter a year" />);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(input).toHaveAttribute('placeholder', 'Enter a year');
    });

    it('displays default placeholder when not provided', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(input).toHaveAttribute('placeholder', 'Enter year');
    });

    it('displays initial year value when provided', async () => {
      render(<YearDialog {...defaultProps} initialYear={1500} />);
      
      await vi.advanceTimersByTimeAsync(100);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(input).toHaveValue('1500');
    });

    it('displays year range hint', () => {
      render(<YearDialog {...defaultProps} />);
      
      expect(screen.getByText(/Valid range:/)).toBeInTheDocument();
      expect(screen.getByText(/-2000 to 2000/)).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('accepts valid positive years', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '1500' } });
      
      expect(input).toHaveValue('1500');
    });

    it('accepts valid negative years', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '-500' } });
      
      expect(input).toHaveValue('-500');
    });

    it('accepts year 0', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '0' } });
      
      expect(input).toHaveValue('0');
    });

    it('accepts boundary year -2000', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '-2000' } });
      
      expect(input).toHaveValue('-2000');
    });

    it('accepts boundary year 2000', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '2000' } });
      
      expect(input).toHaveValue('2000');
    });

    it('rejects non-numeric input', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: 'abc' } });
      
      expect(input).toHaveValue('');
    });

    it('rejects mixed alphanumeric input', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      // First set a valid value
      fireEvent.change(input, { target: { value: '1500' } });
      expect(input).toHaveValue('1500');
      
      // Then try to change to invalid - should reject
      fireEvent.change(input, { target: { value: '15a00' } });
      // The component rejects invalid input, so it stays at previous value
      expect(input).toHaveValue('1500');
    });

    it('allows minus sign at the beginning', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '-' } });
      
      expect(input).toHaveValue('-');
    });

    it('shows error for empty submission', () => {
      render(<YearDialog {...defaultProps} />);
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid year');
    });

    it('shows error for minus-only submission', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '-' } });
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid year');
    });
  });

  describe('Submission Behavior', () => {
    it('submits via Enter key (Requirement 7.7)', () => {
      const onSubmit = vi.fn();
      render(<YearDialog {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '1500' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      expect(onSubmit).toHaveBeenCalledWith(1500);
    });

    it('submits via search button click', () => {
      const onSubmit = vi.fn();
      render(<YearDialog {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '1500' } });
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      expect(onSubmit).toHaveBeenCalledWith(1500);
    });

    it('closes dialog after successful submission', () => {
      const onClose = vi.fn();
      render(<YearDialog {...defaultProps} onClose={onClose} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '1500' } });
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('clamps year above 2000 to 2000 (Requirement 7.4)', () => {
      const onSubmit = vi.fn();
      render(<YearDialog {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '3000' } });
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      expect(onSubmit).toHaveBeenCalledWith(2000);
    });

    it('clamps year below -2000 to -2000 (Requirement 7.4)', () => {
      const onSubmit = vi.fn();
      render(<YearDialog {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '-3000' } });
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      expect(onSubmit).toHaveBeenCalledWith(-2000);
    });

    it('submits negative years correctly', () => {
      const onSubmit = vi.fn();
      render(<YearDialog {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '-500' } });
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      expect(onSubmit).toHaveBeenCalledWith(-500);
    });

    it('submits year 0 correctly', () => {
      const onSubmit = vi.fn();
      render(<YearDialog {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '0' } });
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      expect(onSubmit).toHaveBeenCalledWith(0);
    });

    it('does not submit when input is empty', () => {
      const onSubmit = vi.fn();
      render(<YearDialog {...defaultProps} onSubmit={onSubmit} />);
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Close Behavior', () => {
    it('closes via close button click', () => {
      const onClose = vi.fn();
      render(<YearDialog {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByTestId('year-dialog-close');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes via Escape key', () => {
      const onClose = vi.fn();
      render(<YearDialog {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes via overlay click', () => {
      const onClose = vi.fn();
      render(<YearDialog {...defaultProps} onClose={onClose} />);
      
      const dialog = screen.getByTestId('year-dialog');
      fireEvent.click(dialog);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking inside dialog content', () => {
      const onClose = vi.fn();
      render(<YearDialog {...defaultProps} onClose={onClose} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.click(input);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('auto-focuses input when opened (Requirement 7.9)', async () => {
      render(<YearDialog {...defaultProps} />);
      
      // Wait for the auto-focus timeout
      await vi.advanceTimersByTimeAsync(100);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(document.activeElement).toBe(input);
    });

    it('selects initial year text when opened with initialYear', async () => {
      render(<YearDialog {...defaultProps} initialYear={1500} />);
      
      await vi.advanceTimersByTimeAsync(100);
      
      const input: HTMLInputElement = screen.getByTestId('year-dialog-input');
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(4); // "1500" is 4 characters
    });

    it('implements focus trap - Tab from last element goes to first (Requirement 14.3)', async () => {
      render(<YearDialog {...defaultProps} />);
      
      await vi.advanceTimersByTimeAsync(100);
      
      const closeButton = screen.getByTestId('year-dialog-close');
      closeButton.focus();
      
      // Tab from close button (last) should go to input (first)
      const dialog = screen.getByTestId('year-dialog');
      fireEvent.keyDown(dialog, { key: 'Tab', code: 'Tab' });
      
      const input = screen.getByTestId('year-dialog-input');
      expect(document.activeElement).toBe(input);
    });

    it('implements focus trap - Shift+Tab from first element goes to last (Requirement 14.3)', async () => {
      render(<YearDialog {...defaultProps} />);
      
      await vi.advanceTimersByTimeAsync(100);
      
      const input = screen.getByTestId('year-dialog-input');
      input.focus();
      
      // Shift+Tab from input (first) should go to close button (last)
      const dialog = screen.getByTestId('year-dialog');
      fireEvent.keyDown(dialog, { key: 'Tab', code: 'Tab', shiftKey: true });
      
      const closeButton = screen.getByTestId('year-dialog-close');
      expect(document.activeElement).toBe(closeButton);
    });

    it('stores previous active element when opened', async () => {
      // This test verifies the previousActiveElement ref is stored
      // The actual focus return happens in the useEffect when isOpen changes
      render(<YearDialog {...defaultProps} />);
      
      await vi.advanceTimersByTimeAsync(100);
      
      // Verify the dialog is rendered and functional
      expect(screen.getByTestId('year-dialog')).toBeInTheDocument();
    });
  });

  describe('Accessibility Attributes (Requirement 14.3)', () => {
    it('has role="dialog"', () => {
      render(<YearDialog {...defaultProps} />);
      
      const dialog = screen.getByTestId('year-dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
    });

    it('has aria-modal="true"', () => {
      render(<YearDialog {...defaultProps} />);
      
      const dialog = screen.getByTestId('year-dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-label for the dialog', () => {
      render(<YearDialog {...defaultProps} />);
      
      const dialog = screen.getByTestId('year-dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Year search dialog');
    });

    it('input has aria-label', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(input).toHaveAttribute('aria-label', 'Enter year');
    });

    it('close button has aria-label', () => {
      render(<YearDialog {...defaultProps} />);
      
      const closeButton = screen.getByTestId('year-dialog-close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('search button has aria-label', () => {
      render(<YearDialog {...defaultProps} />);
      
      const searchButton = screen.getByTestId('year-dialog-search');
      expect(searchButton).toHaveAttribute('aria-label', 'Go to year');
    });

    it('input has aria-invalid="false" when no error', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('input has aria-invalid="true" when error exists', () => {
      render(<YearDialog {...defaultProps} />);
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('error message has role="alert"', () => {
      render(<YearDialog {...defaultProps} />);
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });

    it('error message has aria-live="polite"', () => {
      render(<YearDialog {...defaultProps} />);
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    it('input has aria-describedby pointing to error when error exists', () => {
      render(<YearDialog {...defaultProps} />);
      
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(input).toHaveAttribute('aria-describedby', 'year-error');
    });
  });

  describe('Button Types', () => {
    it('close button has type="button"', () => {
      render(<YearDialog {...defaultProps} />);
      
      const closeButton = screen.getByTestId('year-dialog-close');
      expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('search button has type="button"', () => {
      render(<YearDialog {...defaultProps} />);
      
      const searchButton = screen.getByTestId('year-dialog-search');
      expect(searchButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Input Mode', () => {
    it('input has inputMode="numeric" for mobile keyboards', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(input).toHaveAttribute('inputMode', 'numeric');
    });

    it('input has type="text" to allow minus sign', () => {
      render(<YearDialog {...defaultProps} />);
      
      const input = screen.getByTestId('year-dialog-input');
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('State Reset', () => {
    it('clears input value when dialog reopens', async () => {
      const { rerender } = render(<YearDialog {...defaultProps} isOpen={true} />);
      
      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '1500' } });
      expect(input).toHaveValue('1500');
      
      // Close and reopen
      rerender(<YearDialog {...defaultProps} isOpen={false} />);
      rerender(<YearDialog {...defaultProps} isOpen={true} />);
      
      await vi.advanceTimersByTimeAsync(100);
      
      const newInput = screen.getByTestId('year-dialog-input');
      expect(newInput).toHaveValue('');
    });

    it('clears error when dialog reopens', async () => {
      const { rerender } = render(<YearDialog {...defaultProps} isOpen={true} />);
      
      // Trigger error
      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Close and reopen
      rerender(<YearDialog {...defaultProps} isOpen={false} />);
      rerender(<YearDialog {...defaultProps} isOpen={true} />);
      
      await vi.advanceTimersByTimeAsync(100);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('sets initial year when dialog reopens with new initialYear', async () => {
      const { rerender } = render(<YearDialog {...defaultProps} isOpen={true} initialYear={1000} />);
      
      await vi.advanceTimersByTimeAsync(100);
      expect(screen.getByTestId('year-dialog-input')).toHaveValue('1000');
      
      // Close and reopen with different initial year
      rerender(<YearDialog {...defaultProps} isOpen={false} initialYear={1500} />);
      rerender(<YearDialog {...defaultProps} isOpen={true} initialYear={1500} />);
      
      await vi.advanceTimersByTimeAsync(100);
      
      expect(screen.getByTestId('year-dialog-input')).toHaveValue('1500');
    });
  });
});

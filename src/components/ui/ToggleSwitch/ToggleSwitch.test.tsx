/**
 * ToggleSwitch Component Tests
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleSwitch } from './ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders in unchecked state', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} label="Test toggle" />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('renders in checked state', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={true} onChange={onChange} label="Test toggle" />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} label="Test toggle" />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checked and clicked', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={true} onChange={onChange} label="Test toggle" />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} label="Test toggle" disabled />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has correct aria-label', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} label="Enable feature" />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-label', 'Enable feature');
  });

  it('has correct aria-disabled when disabled', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} label="Test" disabled />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
  });

  it('responds to keyboard Enter key', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} label="Test toggle" />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.keyDown(toggle, { key: 'Enter' });
    
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('responds to keyboard Space key', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} label="Test toggle" />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.keyDown(toggle, { key: ' ' });
    
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('uses custom testId', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} testId="custom-toggle" />);
    
    expect(screen.getByTestId('custom-toggle')).toBeInTheDocument();
  });
});

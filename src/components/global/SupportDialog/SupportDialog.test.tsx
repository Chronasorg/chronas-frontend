import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@/i18n/i18n';
import { SupportDialog, PATREON_URL, GITHUB_ISSUES_URL } from './SupportDialog';

describe('SupportDialog', () => {
  const onClose = vi.fn();
  const onRequestContact = vi.fn();

  const renderDialog = (isOpen = true) =>
    render(<SupportDialog isOpen={isOpen} onClose={onClose} onRequestContact={onRequestContact} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    renderDialog(false);
    expect(screen.queryByTestId('support-dialog')).not.toBeInTheDocument();
  });

  it('renders as a modal dialog portalled to body', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Support Chronas' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.parentElement).toBe(document.body);
  });

  it('shows the Patreon pledge call to action', () => {
    renderDialog();
    const pledge = screen.getByTestId('support-pledge');
    expect(pledge).toHaveTextContent('Head over to');
    expect(pledge).toHaveTextContent('and pledge an amount of your choice!');
    expect(pledge).toHaveTextContent('Whatever Chronas is worth to you!');
  });

  it('links to Patreon in a new tab', () => {
    renderDialog();
    for (const id of ['support-patreon-link', 'support-patreon-button']) {
      const link = screen.getByTestId(id);
      expect(link).toHaveAttribute('href', PATREON_URL);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveTextContent('(opens in a new tab)');
    }
  });

  it('focuses the main call to action on open', () => {
    renderDialog();
    expect(screen.getByTestId('support-patreon-button')).toHaveFocus();
  });

  it('does not list PRO benefits or an activation code', () => {
    renderDialog();
    expect(screen.queryByText(/no ads/i)).toBeNull();
    expect(screen.queryByText(/full features/i)).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('links to GitHub issues', () => {
    renderDialog();
    expect(screen.getByTestId('support-github-link')).toHaveAttribute('href', GITHUB_ISSUES_URL);
  });

  it('calls onRequestContact from Contact Us', () => {
    renderDialog();
    fireEvent.click(screen.getByTestId('support-contact-link'));
    expect(onRequestContact).toHaveBeenCalledTimes(1);
  });

  it('closes via the close button, Escape and overlay click', () => {
    renderDialog();
    fireEvent.click(screen.getByTestId('support-dialog-close'));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('support-dialog'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('does not close when clicking inside the dialog', () => {
    renderDialog();
    fireEvent.click(screen.getByText('Support Chronas', { selector: 'h2' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows no supporter note: the site has no login to know who supports', () => {
    renderDialog();
    expect(screen.queryByTestId('support-supporter-note')).toBeNull();
  });
});

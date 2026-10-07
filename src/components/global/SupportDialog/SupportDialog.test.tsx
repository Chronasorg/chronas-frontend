import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@/i18n/i18n';
import { useAuthStore } from '@/stores/authStore';
import { SupportDialog, PATREON_URL, GITHUB_ISSUES_URL } from './SupportDialog';

function makeToken(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ iat: 0, exp, ...payload })}.sig`;
}

describe('SupportDialog', () => {
  const onClose = vi.fn();
  const onRequestContact = vi.fn();

  const renderDialog = (isOpen = true) =>
    render(<SupportDialog isOpen={isOpen} onClose={onClose} onRequestContact={onRequestContact} />);

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearUser();
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

  it('thanks existing supporters', () => {
    useAuthStore
      .getState()
      .setUser(makeToken({ id: 'u@example.com', username: 'u', subscription: 'pro_v1' }));
    renderDialog();
    expect(screen.getByTestId('support-supporter-note')).toBeInTheDocument();
  });

  it('hides the supporter note for non-supporters', () => {
    useAuthStore
      .getState()
      .setUser(makeToken({ id: 'u@example.com', username: 'u', subscription: '-1' }));
    renderDialog();
    expect(screen.queryByTestId('support-supporter-note')).toBeNull();
  });
});

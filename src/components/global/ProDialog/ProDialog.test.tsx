import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import '@/i18n/i18n';
import { useAuthStore } from '@/stores/authStore';
import { ProDialog, PATREON_URL } from './ProDialog';

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock('@/api/client', () => ({
  apiClient: { post: mockPost },
}));

function makeToken(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ iat: 0, exp, ...payload })}.sig`;
}

function axiosError(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', { headers }, null, {
    status,
    statusText: '',
    data,
    headers: {},
    config: { headers },
  });
}

describe('ProDialog', () => {
  const onClose = vi.fn();
  const onRequestLogin = vi.fn();
  const onRequestContact = vi.fn();

  const renderDialog = (isOpen = true) =>
    render(
      <ProDialog
        isOpen={isOpen}
        onClose={onClose}
        onRequestLogin={onRequestLogin}
        onRequestContact={onRequestContact}
      />
    );

  const logIn = (subscription = '-1') => {
    useAuthStore
      .getState()
      .setUser(makeToken({ id: 'user@example.com', username: 'user', subscription }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearUser();
  });

  it('renders nothing when closed', () => {
    renderDialog(false);
    expect(screen.queryByTestId('pro-dialog')).not.toBeInTheDocument();
  });

  it('shows the benefits and the three steps for non-supporters', () => {
    renderDialog();
    expect(screen.getByRole('dialog', { name: 'Upgrade Chronas' })).toBeInTheDocument();
    expect(screen.getByText('Full Features')).toBeInTheDocument();
    expect(screen.getByText('No Ads')).toBeInTheDocument();
    expect(screen.getByText('Check your inbox')).toBeInTheDocument();
    expect(screen.getByLabelText('Paste the Activation Code')).toBeInTheDocument();
  });

  it('links to Patreon in a new tab', () => {
    renderDialog();
    const link = screen.getByTestId('pro-patreon-link');
    expect(link).toHaveAttribute('href', PATREON_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('disables submit until a code is entered', () => {
    renderDialog();
    const submit = screen.getByTestId('pro-code-submit');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByTestId('pro-code-input'), { target: { value: 'ABC' } });
    expect(submit).toBeEnabled();
  });

  it('asks logged-out users to log in instead of calling the API', () => {
    renderDialog();
    expect(screen.getByTestId('pro-login-note')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('pro-code-input'), { target: { value: 'ABC' } });
    fireEvent.click(screen.getByTestId('pro-code-submit'));
    expect(onRequestLogin).toHaveBeenCalledTimes(1);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('redeems a valid code and switches to the thank-you view', async () => {
    logIn();
    mockPost.mockResolvedValueOnce({
      token: makeToken({ id: 'user@example.com', username: 'user', subscription: 'pro_v1' }),
    });
    renderDialog();

    fireEvent.change(screen.getByTestId('pro-code-input'), { target: { value: '  ABC123 ' } });
    fireEvent.click(screen.getByTestId('pro-code-submit'));

    await waitFor(() =>
      expect(
        screen.getByRole('dialog', { name: 'Thank you for your support!' })
      ).toBeInTheDocument()
    );
    expect(mockPost).toHaveBeenCalledWith('/users/user@example.com/subscription/redeem', {
      code: 'ABC123',
    });
    expect(useAuthStore.getState().subscription).toBe('pro_v1');
    expect(screen.getByTestId('pro-manage')).toBeInTheDocument();
  });

  it('shows the API error for an invalid code', async () => {
    logIn();
    mockPost.mockRejectedValueOnce(axiosError(400, { message: 'Invalid activation code' }));
    renderDialog();

    fireEvent.change(screen.getByTestId('pro-code-input'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByTestId('pro-code-submit'));

    expect(await screen.findByTestId('pro-code-error')).toHaveTextContent(
      'Invalid activation code'
    );
    expect(screen.getByTestId('pro-code-input')).toHaveAttribute('aria-invalid', 'true');
  });

  it('explains when the redeem endpoint is not available', async () => {
    logIn();
    mockPost.mockRejectedValueOnce(axiosError(404, { message: 'API not found' }));
    renderDialog();

    fireEvent.change(screen.getByTestId('pro-code-input'), { target: { value: 'ABC' } });
    fireEvent.click(screen.getByTestId('pro-code-submit'));

    expect(await screen.findByTestId('pro-code-error')).toHaveTextContent(
      /not available right now/i
    );
  });

  it('shows the thank-you view for existing supporters', () => {
    logIn('pro_v1');
    renderDialog();
    expect(screen.getByRole('dialog', { name: 'Thank you for your support!' })).toBeInTheDocument();
    expect(screen.queryByTestId('pro-code-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('pro-patreon-link')).toHaveAttribute('href', PATREON_URL);
  });

  it('closes on Escape, overlay click and the close button', () => {
    renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('pro-dialog'));
    fireEvent.click(screen.getByTestId('pro-dialog-close'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('opens the contact page from the help link', () => {
    renderDialog();
    fireEvent.click(screen.getByTestId('pro-contact-link'));
    expect(onRequestContact).toHaveBeenCalledTimes(1);
  });
});

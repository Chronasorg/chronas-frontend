import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InfoDialog } from './InfoDialog';

describe('InfoDialog', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<InfoDialog isOpen={false} onClose={onClose} />);
    expect(screen.queryByTestId('info-dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when open', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('info-dialog')).toBeInTheDocument();
  });

  it('shows Welcome tab by default', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('info-panel-welcome')).toBeInTheDocument();
    expect(screen.queryByTestId('info-panel-howto')).not.toBeInTheDocument();
    expect(screen.queryByTestId('info-panel-contact')).not.toBeInTheDocument();
  });

  it('renders all three tab buttons', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('info-tab-welcome')).toBeInTheDocument();
    expect(screen.getByTestId('info-tab-howto')).toBeInTheDocument();
    expect(screen.getByTestId('info-tab-contact')).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('info-tab-welcome')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('info-tab-howto')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('info-tab-contact')).toHaveAttribute('aria-selected', 'false');
  });

  it('switches to How To tab when clicked', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('info-tab-howto'));
    expect(screen.getByTestId('info-panel-howto')).toBeInTheDocument();
    expect(screen.queryByTestId('info-panel-welcome')).not.toBeInTheDocument();
  });

  it('switches to Contact tab when clicked', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('info-tab-contact'));
    expect(screen.getByTestId('info-panel-contact')).toBeInTheDocument();
    expect(screen.queryByTestId('info-panel-welcome')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('info-dialog-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay backdrop is clicked', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('info-dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when dialog content is clicked', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    const dialog = screen.getByTestId('info-dialog').firstElementChild;
    if (dialog) fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when "Sic Infit!" button is clicked', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('welcome-begin-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has proper dialog role and aria attributes', () => {
    render(<InfoDialog isOpen={true} onClose={onClose} />);
    const dialog = screen.getByTestId('info-dialog');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  describe('Welcome tab', () => {
    it('displays welcome title', () => {
      render(<InfoDialog isOpen={true} onClose={onClose} />);
      expect(screen.getByText(/Welcome to Chr/)).toBeInTheDocument();
    });

    it('has link to switch to How To tab', () => {
      render(<InfoDialog isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('welcome-howto-link'));
      expect(screen.getByTestId('info-panel-howto')).toBeInTheDocument();
    });

    it('has link to switch to Contact tab', () => {
      render(<InfoDialog isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('welcome-contact-link'));
      expect(screen.getByTestId('info-panel-contact')).toBeInTheDocument();
    });

    it('shows Twitter social link', () => {
      render(<InfoDialog isOpen={true} onClose={onClose} />);
      const twitterLink = screen.getByTestId('social-twitter');
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/Chronasorg');
      expect(twitterLink).toHaveTextContent('Follow us on Twitter');
    });

    it('shows Facebook social link', () => {
      render(<InfoDialog isOpen={true} onClose={onClose} />);
      const facebookLink = screen.getByTestId('social-facebook');
      expect(facebookLink).toHaveAttribute('href', 'https://www.facebook.com/chronasorg');
      expect(facebookLink).toHaveTextContent('Follow us on Facebook');
    });
  });

  describe('Contact tab', () => {
    beforeEach(() => {
      render(<InfoDialog isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('info-tab-contact'));
    });

    it('shows GitHub feedback section prominently', () => {
      expect(screen.getByTestId('contact-github-link')).toBeInTheDocument();
      expect(screen.getByText('Share Feedback on GitHub')).toBeInTheDocument();
    });

    it('shows developer entries with email buttons', () => {
      expect(screen.getByTestId('developer-da')).toBeInTheDocument();
      expect(screen.getByTestId('developer-ja')).toBeInTheDocument();
      expect(screen.getByTestId('email-button-da')).toBeInTheDocument();
      expect(screen.getByTestId('email-button-ja')).toBeInTheDocument();
    });

    it('has email tooltip for developers', () => {
      const emailButton = screen.getByTestId('email-button-da');
      expect(emailButton).toHaveAttribute('aria-label', 'Email Dietmar Aumann');
    });

    it('does not have a contact form', () => {
      expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument();
    });
  });

  it('resets to Welcome tab when reopened', () => {
    const { rerender } = render(<InfoDialog isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('info-tab-contact'));
    expect(screen.getByTestId('info-panel-contact')).toBeInTheDocument();

    rerender(<InfoDialog isOpen={false} onClose={onClose} />);
    rerender(<InfoDialog isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('info-panel-welcome')).toBeInTheDocument();
  });
});

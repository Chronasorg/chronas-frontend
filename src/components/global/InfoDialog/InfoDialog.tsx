import { useState, useCallback, useEffect, useRef } from 'react';
import styles from './InfoDialog.module.css';

type InfoTab = 'welcome' | 'howto' | 'contact';

const TABS: { id: InfoTab; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'howto', label: 'How To' },
  { id: 'contact', label: 'Contact' },
];

const DEVELOPERS = [
  {
    name: 'Dietmar Aumann',
    role: 'Founder and Front and Backend Development',
    initials: 'DA',
    avatar: '/images/dev_da.jpg',
    email: 'dietmar.aumann@gmail.com',
  },
  {
    name: 'Joachim Aumann',
    role: 'Co-Founder and Technical Lead',
    initials: 'JA',
    avatar: '/images/dev_ja.jpeg',
    email: 'aumannjoachim@gmail.com',
  },
];

export interface InfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoDialog({ isOpen, onClose }: InfoDialogProps) {
  if (!isOpen) return null;

  return <InfoDialogContent onClose={onClose} />;
}

function InfoDialogContent({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<InfoTab>('welcome');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const switchToTab = useCallback((tab: InfoTab) => {
    setActiveTab(tab);
  }, []);

  return (
    <div
      ref={overlayRef}
      className={styles['overlay']}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Information"
      data-testid="info-dialog"
    >
      <div className={styles['dialog']}>
        <div className={styles['header']}>
          <div className={styles['tabs']} role="tablist" aria-label="Information tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className={styles['tab']}
                data-active={activeTab === tab.id}
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => switchToTab(tab.id)}
                data-testid={`info-tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={styles['headerActions']}>
            <button
              type="button"
              className={styles['headerButton']}
              onClick={onClose}
              aria-label="Close"
              data-testid="info-dialog-close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#6a6a6a">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles['content']}>
          {activeTab === 'welcome' && (
            <div role="tabpanel" id="tabpanel-welcome" data-testid="info-panel-welcome">
              <WelcomeTab onClose={onClose} onSwitchTab={switchToTab} />
            </div>
          )}
          {activeTab === 'howto' && (
            <div role="tabpanel" id="tabpanel-howto" data-testid="info-panel-howto">
              <HowToTab />
            </div>
          )}
          {activeTab === 'contact' && (
            <div role="tabpanel" id="tabpanel-contact" data-testid="info-panel-contact">
              <ContactTab />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeTab({ onClose, onSwitchTab }: { onClose: () => void; onSwitchTab: (tab: InfoTab) => void }) {
  return (
    <div className={styles['welcomeWrapper']}>
      <br />
      <h2 className={styles['welcomeTitle']}>
        Welcome to Chronas
      </h2>
      <br />

      <p className={styles['welcomeText']}>
        Chronas is a history map application with over{' '}
        <span className={styles['welcomeHighlight']}>50 million data points</span>{' '}
        which users can curate and contribute to (similar to Wikipedia).
      </p>

      <p className={styles['welcomeText']}>
        Before you dive in, make sure to watch the short{' '}
        <button
          type="button"
          className={styles['welcomeLink']}
          onClick={() => onSwitchTab('howto')}
          data-testid="welcome-howto-link"
        >
          Tutorial Video
        </button>{' '}
        in the How To section.
      </p>

      <p className={styles['welcomeText']}>
        If you have any inquiries, comments or questions, please use the{' '}
        <button
          type="button"
          className={styles['welcomeLink']}
          onClick={() => onSwitchTab('contact')}
          data-testid="welcome-contact-link"
        >
          Contact
        </button>{' '}
        page.
      </p>

      <br />
      <br />

      <button
        type="button"
        className={styles['beginButton']}
        onClick={onClose}
        data-testid="welcome-begin-button"
      >
        <i>Sic infit!</i>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
        </svg>
      </button>

      <div className={styles['welcomeFooter']}>
        <div className={styles['buildInfo']}>
          Chronas v2.0
        </div>
        <div className={styles['socialLinks']}>
          <a
            className={styles['socialLinkTwitter']}
            href="https://twitter.com/Chronasorg"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="social-twitter"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
            Follow us on Twitter
          </a>
          <a
            className={styles['socialLinkFacebook']}
            href="https://www.facebook.com/chronasorg"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="social-facebook"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Follow us on Facebook
          </a>
        </div>
      </div>
    </div>
  );
}

function HowToTab() {
  return (
    <div className={styles['howtoWrapper']}>
      <h3 className={styles['sectionTitle']}>How to use in about 5 minutes</h3>
      <div className={styles['videoWrapper']}>
        <iframe
          src="https://www.youtube.com/embed/Ah3qSNJpj4Q"
          title="Chronas - How to use"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <h3 className={styles['sectionTitle']}>How to edit data in about 6 minutes (with English commentary)</h3>
      <div className={styles['videoWrapper']}>
        <iframe
          src="https://www.youtube.com/embed/r4x4aYfQNp4"
          title="Chronas - How to edit data"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function ContactTab() {
  return (
    <div className={styles['contactWrapper']}>
      <div className={styles['githubSection']}>
        <svg className={styles['githubIcon']} width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <div className={styles['githubContent']}>
          <p className={styles['githubTitle']}>Share Feedback on GitHub</p>
          <p className={styles['githubText']}>
            Report bugs, request features, or contribute to Chronas development.
          </p>
        </div>
        <a
          className={styles['githubButton']}
          href="https://github.com/Chronasorg/chronas-frontend/issues"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="contact-github-link"
        >
          Open GitHub
        </a>
      </div>

      <h3 className={styles['contactSectionTitle']}>Developers</h3>
      {DEVELOPERS.map((dev) => (
        <div key={dev.name} className={styles['developerCard']} data-testid={`developer-${dev.initials.toLowerCase()}`}>
          <img
            className={styles['developerAvatar']}
            src={dev.avatar}
            alt={dev.name}
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling;
              if (fallback) (fallback as HTMLElement).style.display = 'flex';
            }}
          />
          <div className={styles['developerAvatarFallback']} style={{ display: 'none' }}>{dev.initials}</div>
          <div className={styles['developerInfo']}>
            <p className={styles['developerRole']}>{dev.role}</p>
            <p className={styles['developerName']}>{dev.name}</p>
          </div>
          <button
            type="button"
            className={styles['emailButton']}
            aria-label={`Email ${dev.name}`}
            data-testid={`email-button-${dev.initials.toLowerCase()}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span className={styles['emailTooltip']}>{dev.email}</span>
          </button>
        </div>
      ))}

      <p className={styles['translationsText']}>
        Translations by{' '}
        <a
          className={styles['translatorLink']}
          href="https://twitter.com/vorontsovie"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ilya Vorontsov
        </a>{' '}
        (Russian), Michel Gansmann (French), Y&aacute;ser I. Mej&iacute;as (Spanish), Dietmar Aumann (German) and Peiqi Shen (Chinese)
      </p>

      <hr className={styles['separator']} />

      <p className={styles['contactDescription']}>
        Send us an email directly — hover over the email icon next to each developer to reveal their email address.
      </p>
    </div>
  );
}

export default InfoDialog;

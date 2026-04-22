import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSubdomainLocale, SUPPORTED_LANGUAGES } from './i18n';

describe('getSubdomainLocale', () => {
  const originalHostname = window.location.hostname;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hostname: originalHostname },
      writable: true,
    });
  });

  function setHostname(hostname: string) {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hostname },
      writable: true,
    });
  }

  it('should return the locale code for a supported subdomain', () => {
    setHostname('de.chronas.org');
    expect(getSubdomainLocale()).toBe('de');
  });

  it('should return the locale for all supported language subdomains', () => {
    const expectedCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
    for (const code of expectedCodes) {
      setHostname(`${code}.chronas.org`);
      expect(getSubdomainLocale()).toBe(code);
    }
  });

  it('should return undefined for unsupported subdomains', () => {
    setHostname('xyz.chronas.org');
    expect(getSubdomainLocale()).toBeUndefined();
  });

  it('should return undefined for non-language subdomains', () => {
    setHostname('www.chronas.org');
    expect(getSubdomainLocale()).toBeUndefined();
  });

  it('should return undefined for the bare domain', () => {
    setHostname('chronas.org');
    expect(getSubdomainLocale()).toBeUndefined();
  });

  it('should return undefined for localhost', () => {
    setHostname('localhost');
    expect(getSubdomainLocale()).toBeUndefined();
  });

  it('should return undefined for special subdomains like old, play, edu', () => {
    for (const sub of ['old', 'play', 'edu', 'adtest', 'light', 'us']) {
      setHostname(`${sub}.chronas.org`);
      expect(getSubdomainLocale()).toBeUndefined();
    }
  });
});

describe('SUPPORTED_LANGUAGES', () => {
  it('should have a translation file for every supported locale', async () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const file = await import(`./locales/${lang.code}.json`);
      expect(file).toBeDefined();
      expect(file.default ?? file).toHaveProperty('nav');
    }
  });
});

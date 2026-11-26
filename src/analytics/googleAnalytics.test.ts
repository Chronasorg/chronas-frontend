import { describe, it, expect, beforeEach } from 'vitest';
import { initGoogleAnalytics, GTAG_SCRIPT_URL } from './googleAnalytics';

describe('initGoogleAnalytics', () => {
  beforeEach(() => {
    document.head.querySelectorAll(`script[src^="${GTAG_SCRIPT_URL}"]`).forEach((s) => s.remove());
    delete window.dataLayer;
    delete window.gtag;
  });

  it('loads gtag.js and queues the js and config calls as arguments objects', () => {
    initGoogleAnalytics('G-TEST123');

    const script = document.head.querySelector<HTMLScriptElement>(
      `script[src^="${GTAG_SCRIPT_URL}"]`
    );
    expect(script?.src).toBe(`${GTAG_SCRIPT_URL}?id=G-TEST123`);
    expect(script?.async).toBe(true);
    expect(typeof window.gtag).toBe('function');
    const calls = (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
    expect(calls[0]?.[0]).toBe('js');
    expect(calls[1]).toEqual(['config', 'G-TEST123', { send_page_view: false }]);
    // gtag.js needs the arguments object, not a plain array
    expect(Array.isArray(window.dataLayer?.[0])).toBe(false);
  });

  it('does nothing without a measurement id', () => {
    for (const id of [undefined, '', '   ', 42]) initGoogleAnalytics(id);
    expect(document.head.querySelector(`script[src^="${GTAG_SCRIPT_URL}"]`)).toBeNull();
    expect(window.gtag).toBeUndefined();
  });
});

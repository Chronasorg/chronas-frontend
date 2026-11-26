import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('escapes the characters that start markup or end an attribute', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    );
    expect(escapeHtml("Tom & Jerry's")).toBe('Tom &amp; Jerry&#39;s');
  });

  it('leaves ordinary names alone', () => {
    expect(escapeHtml('Kievan Rus')).toBe('Kievan Rus');
    expect(escapeHtml('Ōtomo clan – 大友氏')).toBe('Ōtomo clan – 大友氏');
  });

  it('never throws for values that are not strings (malformed API data)', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml({ toString: () => '<script>' })).toBe('');
    expect(escapeHtml(['<b>'])).toBe('');
    expect(escapeHtml(Number.NaN)).toBe('');
  });
});

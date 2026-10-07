import { describe, it, expect } from 'vitest';
import { isProSubscription } from './subscriptionUtils';

describe('isProSubscription', () => {
  it('treats the legacy supporter id as PRO', () => {
    expect(isProSubscription('pro_v1')).toBe(true);
  });

  it('treats any other non-empty value as PRO (matches the API)', () => {
    expect(isProSubscription('pro')).toBe(true);
    expect(isProSubscription('I-ABC123')).toBe(true);
  });

  it.each([null, undefined, '', '   ', '-1'])('treats %p as not PRO', (value) => {
    expect(isProSubscription(value)).toBe(false);
  });
});

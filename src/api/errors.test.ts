/**
 * API Error Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { AxiosError, type AxiosResponse } from 'axios';
import { getApiErrorMessage } from './errors';

function makeAxiosError(
  status: number,
  data: unknown,
  message = `Request failed with status code ${String(status)}`
): AxiosError {
  const error = new AxiosError(message, 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: { headers: {} },
  } as AxiosResponse);
  return error;
}

function makeNetworkError(): AxiosError {
  return new AxiosError('Network Error', 'ERR_NETWORK');
}

describe('getApiErrorMessage', () => {
  const fallback = 'Something went wrong.';

  it('extracts message from response.data.message (backend format)', () => {
    const err = makeAxiosError(401, { message: 'Authentication error' });
    expect(getApiErrorMessage(err, fallback)).toBe('Authentication error');
  });

  it('extracts message from response.data.error (alternative format)', () => {
    const err = makeAxiosError(400, { error: 'Invalid email format' });
    expect(getApiErrorMessage(err, fallback)).toBe('Invalid email format');
  });

  it('prefers data.message over data.error when both present', () => {
    const err = makeAxiosError(400, { message: 'Primary error', error: 'Secondary error' });
    expect(getApiErrorMessage(err, fallback)).toBe('Primary error');
  });

  it('returns plain string body when response.data is a short string', () => {
    const err = makeAxiosError(400, 'Bad request body');
    expect(getApiErrorMessage(err, fallback)).toBe('Bad request body');
  });

  it('ignores long string body (over 200 chars) and uses Axios message', () => {
    const longString = 'x'.repeat(201);
    const err = makeAxiosError(500, longString);
    // Falls through to the AxiosError.message (AxiosError extends Error)
    expect(getApiErrorMessage(err, fallback)).toBe('Request failed with status code 500');
  });

  it('returns network error message when no response', () => {
    const err = makeNetworkError();
    expect(getApiErrorMessage(err, fallback)).toBe(
      'Network error. Please check your connection and try again.'
    );
  });

  it('returns err.message for non-Axios Error instances', () => {
    const err = new Error('Custom error');
    expect(getApiErrorMessage(err, fallback)).toBe('Custom error');
  });

  it('returns fallback for non-Error unknown values', () => {
    expect(getApiErrorMessage('string error', fallback)).toBe(fallback);
    expect(getApiErrorMessage(42, fallback)).toBe(fallback);
    expect(getApiErrorMessage(null, fallback)).toBe(fallback);
    expect(getApiErrorMessage(undefined, fallback)).toBe(fallback);
  });

  it('returns fallback when response.data is an empty object', () => {
    const err = makeAxiosError(500, {});
    // AxiosError extends Error, so err.message is used
    expect(getApiErrorMessage(err, fallback)).toBe('Request failed with status code 500');
  });

  it('handles the exact Chronas API login error format', () => {
    const err = makeAxiosError(401, { message: 'Authentication error' });
    expect(getApiErrorMessage(err, 'Login failed.')).toBe('Authentication error');
  });

  it('handles the exact Chronas API signup duplicate error format', () => {
    const err = makeAxiosError(400, {
      message: 'This username/ email already exists!',
      stack: '...',
    });
    expect(getApiErrorMessage(err, 'Signup failed.')).toBe(
      'This username/ email already exists!'
    );
  });

  it('handles Chronas API validation error format', () => {
    const err = makeAxiosError(400, { message: '"email" is required' });
    expect(getApiErrorMessage(err, 'Validation failed.')).toBe('"email" is required');
  });
});

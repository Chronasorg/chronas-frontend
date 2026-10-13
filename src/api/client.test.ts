/**
 * API Client Tests: which requests carry the Authorization header
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { axiosInstance, needsAuthorization, TOKEN_STORAGE_KEY } from './client';

describe('needsAuthorization', () => {
  it('is true for every write', () => {
    for (const method of ['post', 'put', 'patch', 'delete', 'POST']) {
      expect(needsAuthorization(method, '/areas/1500')).toBe(true);
    }
  });

  it('is true for GETs of users, revisions and auth', () => {
    expect(needsAuthorization('get', '/users/someone@example.com')).toBe(true);
    expect(needsAuthorization('get', '/users')).toBe(true);
    expect(needsAuthorization('get', '/revisions?entity=x')).toBe(true);
    expect(needsAuthorization('get', '/auth/refresh')).toBe(true);
    expect(needsAuthorization('get', 'https://api.chronas.org/v1/users/x')).toBe(true);
  });

  it('is false for public GETs', () => {
    expect(needsAuthorization('get', '/areas/1500')).toBe(false);
    expect(needsAuthorization('get', '/markers?types=e&year=1500')).toBe(false);
    expect(needsAuthorization('get', '/metadata?type=g&f=ruler')).toBe(false);
    expect(needsAuthorization(undefined, '/version')).toBe(false);
    expect(needsAuthorization('head', '/health')).toBe(false);
    expect(needsAuthorization('get', 'https://d24mkpax7rmotx.cloudfront.net/v1/areas/1500')).toBe(
      false
    );
  });

  it('does not match prefixes that only start with the same letters', () => {
    expect(needsAuthorization('get', '/usersettings')).toBe(false);
    expect(needsAuthorization('get', '/authors')).toBe(false);
  });
});

describe('axiosInstance request headers', () => {
  let sent: InternalAxiosRequestConfig[];
  let savedAdapter: typeof axiosInstance.defaults.adapter;

  beforeEach(() => {
    sent = [];
    savedAdapter = axiosInstance.defaults.adapter;
    const adapter: AxiosAdapter = (config) => {
      sent.push(config);
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
    };
    axiosInstance.defaults.adapter = adapter;
    localStorage.setItem(TOKEN_STORAGE_KEY, 'token-123');
  });

  afterEach(() => {
    if (savedAdapter) axiosInstance.defaults.adapter = savedAdapter;
    else delete axiosInstance.defaults.adapter;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  });

  it('sends public map reads without Authorization, so they need no preflight', async () => {
    await axiosInstance.get('/areas/1500');
    expect(sent[0]?.headers.Authorization).toBeUndefined();
  });

  it('sends the token on writes and on authenticated reads', async () => {
    await axiosInstance.put('/areas/1500', { x: 1 });
    await axiosInstance.get('/users/someone@example.com');
    expect(sent[0]?.headers.Authorization).toBe('Bearer token-123');
    expect(sent[1]?.headers.Authorization).toBe('Bearer token-123');
  });

  it('sends no token when there is none', async () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    await axiosInstance.put('/areas/1500', { x: 1 });
    expect(sent[0]?.headers.Authorization).toBeUndefined();
  });
});

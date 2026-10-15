/**
 * API Client Tests: which requests carry the Authorization header
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  axiosInstance,
  isRetryable,
  MAX_RETRIES,
  needsAuthorization,
  retryDelayMs,
  TOKEN_STORAGE_KEY,
} from './client';

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

/**
 * Retries: GET and HEAD only, on 429, 503 and network errors, at most twice.
 * The adapter plays the API: each entry in `outcomes` answers one attempt.
 */
describe('axiosInstance retries', () => {
  type Outcome = number | 'network' | 'cancel';
  let calls: InternalAxiosRequestConfig[];
  let savedAdapter: typeof axiosInstance.defaults.adapter;

  function respond(outcomes: Outcome[], headers: Record<string, string> = {}): void {
    let attempt = 0;
    axiosInstance.defaults.adapter = ((config) => {
      calls.push(config);
      attempt += 1;
      const outcome = outcomes[Math.min(attempt - 1, outcomes.length - 1)];
      if (outcome === 'network') {
        return Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {}));
      }
      if (outcome === 'cancel') {
        return Promise.reject(new AxiosError('canceled', AxiosError.ERR_CANCELED, config, {}));
      }
      const response: AxiosResponse = {
        data: { attempt },
        status: outcome as number,
        statusText: String(outcome),
        headers: new AxiosHeaders(headers),
        config,
      };
      if ((outcome as number) < 400) return Promise.resolve(response);
      return Promise.reject(
        new AxiosError(
          `Request failed with status code ${String(outcome)}`,
          AxiosError.ERR_BAD_RESPONSE,
          config,
          {},
          response
        )
      );
    }) as AxiosAdapter;
  }

  beforeEach(() => {
    calls = [];
    savedAdapter = axiosInstance.defaults.adapter;
    // No real waiting: full jitter with random() = 0 is a 0 ms backoff.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (savedAdapter) axiosInstance.defaults.adapter = savedAdapter;
    else delete axiosInstance.defaults.adapter;
    vi.restoreAllMocks();
  });

  it('retries a GET that got 429, then resolves', async () => {
    respond([429, 200]);
    const res = await axiosInstance.get('/areas/1500');
    expect(res.data).toEqual({ attempt: 2 });
    expect(calls).toHaveLength(2);
  });

  it('retries a GET after a network error (a 429 without CORS headers looks like one)', async () => {
    respond(['network', 200]);
    const res = await axiosInstance.get('/markers?types=e&year=1500');
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(2);
  });

  it('retries a 503 and a HEAD', async () => {
    respond([503, 200]);
    await axiosInstance.head('/health');
    expect(calls).toHaveLength(2);
  });

  it('never retries a write', async () => {
    respond([429, 200]);
    await expect(axiosInstance.post('/metadata', { x: 1 })).rejects.toMatchObject({
      response: { status: 429 },
    });
    respond([429, 200]);
    await expect(axiosInstance.put('/areas', { x: 1 })).rejects.toThrow();
    expect(calls).toHaveLength(2);
  });

  it('gives up after 2 retries (3 attempts)', async () => {
    respond([429]);
    await expect(axiosInstance.get('/areas/1500')).rejects.toMatchObject({
      response: { status: 429 },
    });
    expect(calls).toHaveLength(MAX_RETRIES + 1);
  });

  it('does not retry other errors or cancelled requests', async () => {
    respond([500, 200]);
    await expect(axiosInstance.get('/areas/1500')).rejects.toMatchObject({
      response: { status: 500 },
    });
    respond([404, 200]);
    await expect(axiosInstance.get('/areas/1500')).rejects.toThrow();
    respond(['cancel', 200]);
    await expect(axiosInstance.get('/areas/1500')).rejects.toThrow('canceled');
    expect(calls).toHaveLength(3);
  });

  it('waits Retry-After when the response exposes it, capped at 5 s', () => {
    const withHeader = (value?: string): AxiosError => {
      const headers = new AxiosHeaders(value === undefined ? {} : { 'retry-after': value });
      const config = { headers: new AxiosHeaders(), method: 'get' } as InternalAxiosRequestConfig;
      return new AxiosError(
        'x',
        AxiosError.ERR_BAD_RESPONSE,
        config,
        {},
        {
          data: null,
          status: 503,
          statusText: '',
          headers,
          config,
        }
      );
    };
    expect(retryDelayMs(withHeader('2'), 0)).toBe(2000);
    expect(retryDelayMs(withHeader('120'), 0)).toBe(5000);
    expect(retryDelayMs(withHeader('Wed, 21 Oct 2026 07:28:00 GMT'), 1, () => 0.5)).toBe(300);
    expect(retryDelayMs(withHeader(), 0, () => 0.999)).toBe(299);
    expect(retryDelayMs(withHeader(), 1, () => 0.999)).toBe(599);
  });

  it('isRetryable ignores timeouts', () => {
    const config = { headers: new AxiosHeaders(), method: 'get' } as InternalAxiosRequestConfig;
    expect(isRetryable(new AxiosError('timeout', AxiosError.ECONNABORTED, config, {}))).toBe(false);
    expect(isRetryable(new AxiosError('net', AxiosError.ERR_NETWORK, config, {}))).toBe(true);
  });
});

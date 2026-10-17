import { describe, it, expect, afterEach } from 'vitest';
import { updateURLState, clearURLParams, parseURLState } from './urlStateUtils';
import { updateQueryStringParameter } from './mapUtils';

/**
 * Regression tests for a visit to `chronas.org/` with no hash: mapUtils writes
 * `year`/`pos` into the plain query string, and selecting an area must not
 * overwrite them.
 */
describe('urlStateUtils with a plain query string (no hash)', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('keeps year and pos when the drawer params are added', () => {
    window.history.replaceState({}, '', '/?year=1200&pos=37,37,2.5');

    updateURLState({ type: 'area', value: 'BYZ' });

    expect(window.location.hash).toBe('');
    expect(parseURLState()).toMatchObject({
      year: 1200,
      pos: '37,37,2.5',
      type: 'area',
      value: 'BYZ',
    });
  });

  it('keeps year when the drawer params are cleared', () => {
    window.history.replaceState({}, '', '/?year=1200&type=area&value=BYZ');

    clearURLParams(['type', 'value']);

    expect(window.location.search).toBe('?year=1200');
  });

  it('writes into the same query string as updateQueryStringParameter', () => {
    window.history.replaceState({}, '', '/');

    updateQueryStringParameter('year', '800');
    updateURLState({ type: 'marker', value: 'm1' });
    updateQueryStringParameter('pos', '1,2,3');

    expect(parseURLState()).toMatchObject({ year: 800, type: 'marker', value: 'm1', pos: '1,2,3' });
  });

  it('still writes into the hash under HashRouter', () => {
    window.history.replaceState({}, '', '/#/?year=1000');

    updateURLState({ type: 'area', value: 'Athens' });

    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('#/?year=1000&type=area&value=Athens');
  });
});

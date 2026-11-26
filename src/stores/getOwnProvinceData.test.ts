import { describe, it, expect } from 'vitest';
import { getOwnProvinceData, type AreaData } from './mapStore';

describe('getOwnProvinceData', () => {
  const areaData: AreaData = { Kiev: ['RUS', 'slavic', 'orthodox', 'Kiev', 1000] };

  it('returns the data of a province the area data has', () => {
    expect(getOwnProvinceData(areaData, 'Kiev')).toEqual([
      'RUS',
      'slavic',
      'orthodox',
      'Kiev',
      1000,
    ]);
  });

  it('returns undefined for names inherited from Object.prototype (pentest V2)', () => {
    for (const id of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf']) {
      expect(getOwnProvinceData(areaData, id), id).toBeUndefined();
    }
  });

  it('returns undefined without area data or for a missing province', () => {
    expect(getOwnProvinceData(null, 'Kiev')).toBeUndefined();
    expect(getOwnProvinceData(undefined, 'Kiev')).toBeUndefined();
    expect(getOwnProvinceData(areaData, 'Atlantis')).toBeUndefined();
  });
});

/**
 * DeckGLOverlay Component Tests
 *
 * Unit tests for the DeckGLOverlay component and utility functions.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9
 */

import { describe, it, expect } from 'vitest';
import {
  getMarkerSizeScale,
  rgbaToArray,
  getClusterIconName,
  getClusterIconSize,
  MarkerSpatialIndex,
  calculateClusters,
  iconSize,
  DEFAULT_MARKER_SIZE,
  themedIconMapping,
  clusterIconMapping,
  getCityLabelWeight,
  getCityLabelFontSize,
  isCityMarker,
  isNonCapitalCity,
  CITY_LABEL_MIN_FONT_SIZE,
  CITY_LABEL_MAX_FONT_SIZE,
  CITY_WEIGHT_CAPITAL,
  CITY_WEIGHT_CAPITAL_HISTORY,
  CITY_WEIGHT_REGULAR,
  CITY_DOT_RADIUS,
  CITY_DOT_HIGHLIGHT_RADIUS,
  type MarkerData,
} from './DeckGLOverlay';

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('getMarkerSizeScale', () => {
  /**
   * Requirements: 9.9
   * THE MapView SHALL scale marker size based on zoom level using formula:
   * Math.min(Math.pow(1.55, zoom - 10), 1)
   */
  it('should return 1 for zoom level 10 and above', () => {
    expect(getMarkerSizeScale(10)).toBeCloseTo(1, 5);
    expect(getMarkerSizeScale(11)).toBeCloseTo(1, 5);
    expect(getMarkerSizeScale(15)).toBeCloseTo(1, 5);
    expect(getMarkerSizeScale(20)).toBeCloseTo(1, 5);
  });

  it('should return scaled value for zoom levels below 10', () => {
    // At zoom 9: Math.pow(1.55, -1) ≈ 0.645
    expect(getMarkerSizeScale(9)).toBeCloseTo(Math.pow(1.55, -1), 5);

    // At zoom 8: Math.pow(1.55, -2) ≈ 0.416
    expect(getMarkerSizeScale(8)).toBeCloseTo(Math.pow(1.55, -2), 5);

    // At zoom 5: Math.pow(1.55, -5) ≈ 0.112
    expect(getMarkerSizeScale(5)).toBeCloseTo(Math.pow(1.55, -5), 5);
  });

  it('should return very small values for low zoom levels', () => {
    // At zoom 2: Math.pow(1.55, -8) ≈ 0.030
    const result = getMarkerSizeScale(2);
    expect(result).toBeLessThan(0.1);
    expect(result).toBeGreaterThan(0);
  });

  it('should handle fractional zoom levels', () => {
    const result = getMarkerSizeScale(9.5);
    expect(result).toBeCloseTo(Math.pow(1.55, -0.5), 5);
  });
});

describe('rgbaToArray', () => {
  it('should parse rgb() format correctly', () => {
    expect(rgbaToArray('rgb(173, 135, 27)')).toEqual([173, 135, 27, 255]);
    expect(rgbaToArray('rgb(0, 0, 0)')).toEqual([0, 0, 0, 255]);
    expect(rgbaToArray('rgb(255, 255, 255)')).toEqual([255, 255, 255, 255]);
  });

  it('should parse rgba() format correctly', () => {
    expect(rgbaToArray('rgba(173, 135, 27, 1)')).toEqual([173, 135, 27, 255]);
    expect(rgbaToArray('rgba(173, 135, 27, 0.5)')).toEqual([173, 135, 27, 128]);
    expect(rgbaToArray('rgba(0, 0, 0, 0)')).toEqual([0, 0, 0, 0]);
  });

  it('should return black for invalid formats', () => {
    expect(rgbaToArray('invalid')).toEqual([0, 0, 0, 255]);
    expect(rgbaToArray('#ffffff')).toEqual([0, 0, 0, 255]);
    expect(rgbaToArray('')).toEqual([0, 0, 0, 255]);
  });

  it('should handle spaces in format', () => {
    expect(rgbaToArray('rgb( 173 , 135 , 27 )')).toEqual([173, 135, 27, 255]);
    expect(rgbaToArray('rgba( 173 , 135 , 27 , 0.5 )')).toEqual([173, 135, 27, 128]);
  });
});

describe('getClusterIconName', () => {
  it('should return empty string for size 0', () => {
    expect(getClusterIconName(0)).toBe('');
  });

  it('should return exact number for sizes 1-9', () => {
    expect(getClusterIconName(1)).toBe('1');
    expect(getClusterIconName(5)).toBe('5');
    expect(getClusterIconName(9)).toBe('9');
  });

  it('should return rounded tens for sizes 10-99', () => {
    expect(getClusterIconName(10)).toBe('10');
    expect(getClusterIconName(15)).toBe('10');
    expect(getClusterIconName(25)).toBe('20');
    expect(getClusterIconName(99)).toBe('90');
  });

  it('should return 100 for sizes 100 and above', () => {
    expect(getClusterIconName(100)).toBe('100');
    expect(getClusterIconName(150)).toBe('100');
    expect(getClusterIconName(1000)).toBe('100');
  });
});

describe('getClusterIconSize', () => {
  it('should return 0.5 for size 0', () => {
    expect(getClusterIconSize(0)).toBe(0.5);
  });

  it('should return 1.0 for size 100 and above', () => {
    expect(getClusterIconSize(100)).toBe(1.0);
    expect(getClusterIconSize(150)).toBe(1.0);
  });

  it('should return scaled value for sizes between 0 and 100', () => {
    // Size 50: (50/100) * 0.5 + 0.5 = 0.75
    expect(getClusterIconSize(50)).toBe(0.75);

    // Size 25: (25/100) * 0.5 + 0.5 = 0.625
    expect(getClusterIconSize(25)).toBe(0.625);
  });
});

// ============================================================================
// MarkerSpatialIndex Tests
// ============================================================================

describe('MarkerSpatialIndex', () => {
  const createMarker = (id: string, x: number, y: number): MarkerData => ({
    _id: id,
    name: `Marker ${id}`,
    subtype: 'b',
    coo: [0, 0],
    x,
    y,
  });

  it('should load and search markers correctly', () => {
    const index = new MarkerSpatialIndex(50);
    const markers = [
      createMarker('1', 10, 10),
      createMarker('2', 20, 20),
      createMarker('3', 100, 100),
    ];

    index.load(markers);

    // Search should find markers 1 and 2
    const results = index.search(0, 0, 50, 50);
    expect(results).toHaveLength(2);
    expect(results.map((m) => m._id).sort()).toEqual(['1', '2']);
  });

  it('should clear markers correctly', () => {
    const index = new MarkerSpatialIndex(50);
    const markers = [createMarker('1', 10, 10)];

    index.load(markers);
    expect(index.search(0, 0, 50, 50)).toHaveLength(1);

    index.clear();
    expect(index.search(0, 0, 50, 50)).toHaveLength(0);
  });

  it('should handle empty marker arrays', () => {
    const index = new MarkerSpatialIndex(50);
    index.load([]);
    expect(index.search(0, 0, 100, 100)).toHaveLength(0);
  });

  it('should handle markers without coordinates', () => {
    const index = new MarkerSpatialIndex(50);
    const markers: MarkerData[] = [
      { _id: '1', name: 'No coords', subtype: 'b', coo: [0, 0] },
    ];

    index.load(markers);
    expect(index.search(0, 0, 100, 100)).toHaveLength(0);
  });
});

// ============================================================================
// calculateClusters Tests
// ============================================================================

describe('calculateClusters', () => {
  const createMarker = (id: string, x: number, y: number, subtype = 'b'): MarkerData => ({
    _id: id,
    name: `Marker ${id}`,
    subtype,
    coo: [0, 0],
    x,
    y,
  });

  it('should cluster nearby markers', () => {
    const markers = [
      createMarker('1', 10, 10),
      createMarker('2', 15, 15),
      createMarker('3', 12, 12),
    ];

    // Use a large size scale to ensure clustering
    const result = calculateClusters(markers, 5, 100);

    // At least one marker should be a cluster center
    const z = 5;
    const clusterCenters = result.filter((m) => {
      const zoomLevels = m.zoomLevels;
      if (!zoomLevels) return false;
      const zoomData = zoomLevels[z];
      return zoomData?.icon;
    });
    expect(clusterCenters.length).toBeGreaterThan(0);
  });

  it('should not cluster city markers', () => {
    const markers = [
      createMarker('1', 10, 10, 'c'),
      createMarker('2', 15, 15, 'c'),
    ];

    const result = calculateClusters(markers, 5, 100);

    // City markers should not have zoom levels set
    const z = 5;
    const citiesWithClusters = result.filter((m) => {
      const zoomLevels = m.zoomLevels;
      if (!zoomLevels) return false;
      return m.subtype === 'c' && zoomLevels[z] !== undefined;
    });
    expect(citiesWithClusters).toHaveLength(0);
  });

  it('should handle empty marker arrays', () => {
    const result = calculateClusters([], 5, 100);
    expect(result).toHaveLength(0);
  });

  it('should handle markers far apart', () => {
    const markers = [
      createMarker('1', 0, 0),
      createMarker('2', 1000, 1000),
    ];

    // Use a small size scale to prevent clustering
    const result = calculateClusters(markers, 10, 1);

    // Both markers should be cluster centers (not absorbed)
    const z = 10;
    const clusterCenters = result.filter((m) => {
      const zoomLevels = m.zoomLevels;
      if (!zoomLevels) return false;
      const zoomData = zoomLevels[z];
      return zoomData?.icon;
    });
    expect(clusterCenters).toHaveLength(2);
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('iconSize', () => {
  it('should have correct sizes for all marker types', () => {
    expect(iconSize['cp']).toBe(7); // Capital
    expect(iconSize['ca']).toBe(4); // Castle
    expect(iconSize['b']).toBe(5); // Battle
    expect(iconSize['si']).toBe(5); // Siege
    expect(iconSize['c0']).toBe(7); // Capital outline
    expect(iconSize['c']).toBe(4); // City
  });

  it('should have default size for unknown types', () => {
    // Unknown types should return undefined (handled by || 4 in component)
    expect(iconSize['unknown']).toBeUndefined();
  });
});

describe('DEFAULT_MARKER_SIZE', () => {
  it('should be 20 pixels', () => {
    expect(DEFAULT_MARKER_SIZE).toBe(20);
  });
});

describe('themedIconMapping', () => {
  it('should have entries for all marker types', () => {
    expect(themedIconMapping['cp']).toBeDefined();
    expect(themedIconMapping['c']).toBeDefined();
    expect(themedIconMapping['b']).toBeDefined();
    expect(themedIconMapping['si']).toBeDefined();
    expect(themedIconMapping['ca']).toBeDefined();
    expect(themedIconMapping['l']).toBeDefined();
  });

  it('should have correct structure for icon entries', () => {
    const cpEntry = themedIconMapping['cp'];
    expect(cpEntry).toHaveProperty('x');
    expect(cpEntry).toHaveProperty('y');
    expect(cpEntry).toHaveProperty('width');
    expect(cpEntry).toHaveProperty('height');
    expect(cpEntry).toHaveProperty('anchorY');
  });

  it('should have mask property for capital markers', () => {
    expect(themedIconMapping['cp']?.mask).toBe(true);
  });
});

describe('clusterIconMapping', () => {
  it('should have entries for cluster sizes', () => {
    expect(clusterIconMapping['1']).toBeDefined();
    expect(clusterIconMapping['5']).toBeDefined();
    expect(clusterIconMapping['10']).toBeDefined();
    expect(clusterIconMapping['50']).toBeDefined();
    expect(clusterIconMapping['100']).toBeDefined();
  });

  it('should have empty entry for size 0', () => {
    expect(clusterIconMapping['']).toBeDefined();
    expect(clusterIconMapping['']?.width).toBe(1);
    expect(clusterIconMapping['']?.height).toBe(1);
  });
});


// ============================================================================
// City Label Utility Function Tests
// ============================================================================

describe('City Label Constants', () => {
  /**
   * Requirements: 10.3, 10.4
   * Verify city label constants are correctly defined
   */
  it('should have correct font size bounds', () => {
    expect(CITY_LABEL_MIN_FONT_SIZE).toBe(18);
    expect(CITY_LABEL_MAX_FONT_SIZE).toBe(68);
  });

  it('should have correct weight values', () => {
    expect(CITY_WEIGHT_CAPITAL).toBe(4);
    expect(CITY_WEIGHT_CAPITAL_HISTORY).toBe(2);
    expect(CITY_WEIGHT_REGULAR).toBe(1);
  });

  it('should have correct dot radius values', () => {
    expect(CITY_DOT_RADIUS).toBe(4);
    expect(CITY_DOT_HIGHLIGHT_RADIUS).toBe(6);
  });
});

describe('getCityLabelWeight', () => {
  /**
   * Requirements: 10.3
   * THE MapView SHALL weight city labels based on type
   * (capitals: 4, cities with capital history: 2, regular cities: 1)
   */
  it('should return weight 4 for capital markers (cp)', () => {
    const capitalCity: MarkerData = {
      _id: 'capital-1',
      name: 'Rome',
      subtype: 'cp',
      coo: [12.4964, 41.9028],
    };
    expect(getCityLabelWeight(capitalCity, 100)).toBe(4);
  });

  it('should return weight 2 for cities with capital history in current year', () => {
    const cityWithHistory: MarkerData = {
      _id: 'city-1',
      name: 'Constantinople',
      subtype: 'c',
      coo: [28.9784, 41.0082],
      capital: [
        [330, 1453, 'byzantine'],
      ],
    };
    // Year 500 is within the capital history range [330, 1453]
    expect(getCityLabelWeight(cityWithHistory, 500)).toBe(2);
  });

  it('should return weight 1 for cities with capital history outside current year', () => {
    const cityWithHistory: MarkerData = {
      _id: 'city-1',
      name: 'Constantinople',
      subtype: 'c',
      coo: [28.9784, 41.0082],
      capital: [
        [330, 1453, 'byzantine'],
      ],
    };
    // Year 1500 is outside the capital history range [330, 1453]
    expect(getCityLabelWeight(cityWithHistory, 1500)).toBe(1);
  });

  it('should return weight 1 for regular cities without capital history', () => {
    const regularCity: MarkerData = {
      _id: 'city-2',
      name: 'Alexandria',
      subtype: 'c',
      coo: [29.9187, 31.2001],
    };
    expect(getCityLabelWeight(regularCity, 100)).toBe(1);
  });

  it('should return weight 1 for cities with empty capital array', () => {
    const cityWithEmptyHistory: MarkerData = {
      _id: 'city-3',
      name: 'Athens',
      subtype: 'c',
      coo: [23.7275, 37.9838],
      capital: [],
    };
    expect(getCityLabelWeight(cityWithEmptyHistory, 100)).toBe(1);
  });

  it('should handle multiple capital history entries', () => {
    const cityWithMultipleHistory: MarkerData = {
      _id: 'city-4',
      name: 'Multi-Capital',
      subtype: 'c',
      coo: [0, 0],
      capital: [
        [100, 200, 'ruler1'],
        [500, 600, 'ruler2'],
        [900, 1000, 'ruler3'],
      ],
    };
    // Year 150 is in first range
    expect(getCityLabelWeight(cityWithMultipleHistory, 150)).toBe(2);
    // Year 550 is in second range
    expect(getCityLabelWeight(cityWithMultipleHistory, 550)).toBe(2);
    // Year 950 is in third range
    expect(getCityLabelWeight(cityWithMultipleHistory, 950)).toBe(2);
    // Year 300 is not in any range
    expect(getCityLabelWeight(cityWithMultipleHistory, 300)).toBe(1);
  });

  it('should handle boundary years correctly', () => {
    const cityWithHistory: MarkerData = {
      _id: 'city-5',
      name: 'Boundary City',
      subtype: 'c',
      coo: [0, 0],
      capital: [
        [100, 200, 'ruler1'],
      ],
    };
    // Exact start year
    expect(getCityLabelWeight(cityWithHistory, 100)).toBe(2);
    // Exact end year
    expect(getCityLabelWeight(cityWithHistory, 200)).toBe(2);
    // One year before start
    expect(getCityLabelWeight(cityWithHistory, 99)).toBe(1);
    // One year after end
    expect(getCityLabelWeight(cityWithHistory, 201)).toBe(1);
  });
});

describe('getCityLabelFontSize', () => {
  /**
   * Requirements: 10.4
   * THE MapView SHALL use font sizes between 18px and 68px based on weight
   */
  it('should return minimum font size (18px) for weight 1', () => {
    expect(getCityLabelFontSize(1)).toBe(18);
  });

  it('should return maximum font size (68px) for weight 4', () => {
    expect(getCityLabelFontSize(4)).toBe(68);
  });

  it('should return interpolated font size for weight 2', () => {
    // Weight 2: (2-1)/(4-1) = 1/3 of the way from min to max
    // 18 + (1/3) * (68-18) = 18 + (1/3) * 50 = 18 + 16.67 ≈ 35
    const fontSize = getCityLabelFontSize(2);
    expect(fontSize).toBeGreaterThan(18);
    expect(fontSize).toBeLessThan(68);
    expect(fontSize).toBe(35); // Rounded
  });

  it('should return font size within bounds for any weight', () => {
    for (let weight = 1; weight <= 4; weight++) {
      const fontSize = getCityLabelFontSize(weight);
      expect(fontSize).toBeGreaterThanOrEqual(18);
      expect(fontSize).toBeLessThanOrEqual(68);
    }
  });
});

describe('isCityMarker', () => {
  it('should return true for capital markers (cp)', () => {
    const capital: MarkerData = {
      _id: '1',
      name: 'Capital',
      subtype: 'cp',
      coo: [0, 0],
    };
    expect(isCityMarker(capital)).toBe(true);
  });

  it('should return true for city markers (c)', () => {
    const city: MarkerData = {
      _id: '2',
      name: 'City',
      subtype: 'c',
      coo: [0, 0],
    };
    expect(isCityMarker(city)).toBe(true);
  });

  it('should return false for battle markers (b)', () => {
    const battle: MarkerData = {
      _id: '3',
      name: 'Battle',
      subtype: 'b',
      coo: [0, 0],
    };
    expect(isCityMarker(battle)).toBe(false);
  });

  it('should return false for siege markers (si)', () => {
    const siege: MarkerData = {
      _id: '4',
      name: 'Siege',
      subtype: 'si',
      coo: [0, 0],
    };
    expect(isCityMarker(siege)).toBe(false);
  });

  it('should return false for castle markers (ca)', () => {
    const castle: MarkerData = {
      _id: '5',
      name: 'Castle',
      subtype: 'ca',
      coo: [0, 0],
    };
    expect(isCityMarker(castle)).toBe(false);
  });
});

describe('isNonCapitalCity', () => {
  /**
   * Requirements: 10.5
   * THE MapView SHALL render dots for non-capital cities
   */
  it('should return true for city markers (c)', () => {
    const city: MarkerData = {
      _id: '1',
      name: 'City',
      subtype: 'c',
      coo: [0, 0],
    };
    expect(isNonCapitalCity(city)).toBe(true);
  });

  it('should return false for capital markers (cp)', () => {
    const capital: MarkerData = {
      _id: '2',
      name: 'Capital',
      subtype: 'cp',
      coo: [0, 0],
    };
    expect(isNonCapitalCity(capital)).toBe(false);
  });

  it('should return false for other marker types', () => {
    const otherTypes = ['b', 'si', 'ca', 'l', 'm', 'p', 'e', 's', 'a', 'r', 'at', 'op', 'o', 'ar'];
    for (const subtype of otherTypes) {
      const marker: MarkerData = {
        _id: subtype,
        name: `Marker ${subtype}`,
        subtype,
        coo: [0, 0],
      };
      expect(isNonCapitalCity(marker)).toBe(false);
    }
  });
});

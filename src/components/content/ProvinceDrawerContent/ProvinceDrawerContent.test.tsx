/**
 * ProvinceDrawerContent Component Tests
 *
 * Tests for the province drawer content component that displays detailed
 * province information in the right drawer panel.
 *
 * Requirements tested:
 * - 2.4: Province drawer displays province name as header
 * - 2.5: Province drawer displays entity details (ruler, culture, religion) with color chips
 * - 2.6: Province drawer embeds Wikipedia article iframe
 *
 * Component Features:
 * - Province name header display
 * - Entity rows with color chips (ruler, culture, religion, religionGeneral)
 * - Population formatting (M/k format)
 * - ArticleIframe embedding
 * - Missing metadata handling (fallback to "Unknown")
 *
 * Helper Functions:
 * - getEntityMetadata: Gets entity metadata entry for a given entity ID
 * - getReligionGeneralMetadata: Gets religionGeneral metadata from religion ID
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ProvinceDrawerContent,
  getEntityMetadata,
  getReligionGeneralMetadata,
} from './ProvinceDrawerContent';
import type { EntityMetadata, ProvinceData } from '@/api/types';

// Mock the ArticleIframe component to isolate ProvinceDrawerContent tests
vi.mock('@/components/content/ArticleIframe/ArticleIframe', () => ({
  ArticleIframe: ({ url, title }: { url?: string; title: string }) => (
    <div data-testid="mock-article-iframe" data-url={url} data-title={title}>
      Mock ArticleIframe
    </div>
  ),
}));

// ============================================================================
// Sample Test Data
// ============================================================================

/**
 * Sample province data tuple: [ruler, culture, religion, capital, population]
 * Based on real API response format from chronas.org
 */
const SAMPLE_PROVINCE_DATA: ProvinceData = ['ROM', 'latin', 'roman_paganism', 'Rome', 1500000];

/**
 * Sample province data with smaller population
 */
const SAMPLE_PROVINCE_DATA_SMALL_POP: ProvinceData = ['ROM', 'latin', 'roman_paganism', 'Rome', 500];

/**
 * Sample province data with thousands population
 */
const SAMPLE_PROVINCE_DATA_THOUSANDS_POP: ProvinceData = ['ROM', 'latin', 'roman_paganism', 'Rome', 45000];

/**
 * Sample province data with missing entities
 */
const SAMPLE_PROVINCE_DATA_MISSING: ProvinceData = ['', '', '', null, 0];

/**
 * Sample entity metadata matching real API response format
 */
const SAMPLE_METADATA: EntityMetadata = {
  ruler: {
    ROM: { name: 'Roman Empire', color: 'rgba(139, 0, 0, 1)' },
    PHC: { name: 'Phoenicia', color: 'rgba(128, 0, 128, 1)' },
  },
  culture: {
    latin: { name: 'Latin', color: 'rgba(255, 215, 0, 1)' },
    greek: { name: 'Greek', color: 'rgba(0, 128, 255, 1)' },
  },
  religion: {
    roman_paganism: { name: 'Roman Paganism', color: 'rgba(255, 0, 0, 1)', parent: 'paganism' },
    hellenism: { name: 'Hellenism', color: 'rgba(0, 255, 0, 1)', parent: 'paganism' },
  },
  religionGeneral: {
    paganism: { name: 'Paganism', color: 'rgba(128, 128, 0, 1)' },
    christianity: { name: 'Christianity', color: 'rgba(0, 0, 255, 1)' },
  },
};

/**
 * Metadata with missing entries for testing fallback behavior
 */
const PARTIAL_METADATA: EntityMetadata = {
  ruler: {
    ROM: { name: 'Roman Empire', color: 'rgba(139, 0, 0, 1)' },
  },
  culture: {},
  religion: {},
  religionGeneral: {},
};

/**
 * Metadata with missing name/color for testing fallback
 */
const INCOMPLETE_METADATA: EntityMetadata = {
  ruler: {
    ROM: { name: '', color: '' },
  },
  culture: {
    latin: { name: 'Latin', color: '' },
  },
  religion: {
    roman_paganism: { name: '', color: 'rgba(255, 0, 0, 1)', parent: 'paganism' },
  },
  religionGeneral: {
    paganism: { name: '', color: '' },
  },
};

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('getEntityMetadata', () => {
  describe('with valid metadata', () => {
    it('should return correct metadata entry for ruler', () => {
      const result = getEntityMetadata('ROM', 'ruler', SAMPLE_METADATA);
      expect(result.name).toBe('Roman Empire');
      expect(result.color).toBe('rgba(139, 0, 0, 1)');
    });

    it('should return correct metadata entry for culture', () => {
      const result = getEntityMetadata('latin', 'culture', SAMPLE_METADATA);
      expect(result.name).toBe('Latin');
      expect(result.color).toBe('rgba(255, 215, 0, 1)');
    });

    it('should return correct metadata entry for religion', () => {
      const result = getEntityMetadata('roman_paganism', 'religion', SAMPLE_METADATA);
      expect(result.name).toBe('Roman Paganism');
      expect(result.color).toBe('rgba(255, 0, 0, 1)');
    });
  });

  describe('with missing metadata', () => {
    it('should return fallback for null metadata', () => {
      const result = getEntityMetadata('ROM', 'ruler', null);
      expect(result.name).toBe('Unknown');
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });

    it('should return fallback for null entityId', () => {
      const result = getEntityMetadata(null, 'ruler', SAMPLE_METADATA);
      expect(result.name).toBe('Unknown');
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });

    it('should return fallback for empty entityId', () => {
      const result = getEntityMetadata('', 'ruler', SAMPLE_METADATA);
      expect(result.name).toBe('Unknown');
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });

    it('should return fallback for non-existent entityId', () => {
      const result = getEntityMetadata('UNKNOWN_ENTITY', 'ruler', SAMPLE_METADATA);
      expect(result.name).toBe('Unknown');
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });
  });

  describe('with incomplete metadata entries', () => {
    it('should return fallback name when entry name is empty', () => {
      const result = getEntityMetadata('ROM', 'ruler', INCOMPLETE_METADATA);
      expect(result.name).toBe('Unknown');
    });

    it('should return fallback color when entry color is empty', () => {
      const result = getEntityMetadata('ROM', 'ruler', INCOMPLETE_METADATA);
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });

    it('should return valid name with fallback color', () => {
      const result = getEntityMetadata('latin', 'culture', INCOMPLETE_METADATA);
      expect(result.name).toBe('Latin');
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });
  });
});

describe('getReligionGeneralMetadata', () => {
  describe('with valid metadata', () => {
    it('should return religionGeneral metadata from religion parent', () => {
      const result = getReligionGeneralMetadata('roman_paganism', SAMPLE_METADATA);
      expect(result.name).toBe('Paganism');
      expect(result.color).toBe('rgba(128, 128, 0, 1)');
    });

    it('should return correct religionGeneral for different religions', () => {
      const result = getReligionGeneralMetadata('hellenism', SAMPLE_METADATA);
      expect(result.name).toBe('Paganism');
    });
  });

  describe('with missing metadata', () => {
    it('should return fallback for null metadata', () => {
      const result = getReligionGeneralMetadata('roman_paganism', null);
      expect(result.name).toBe('Unknown');
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });

    it('should return fallback for null religionId', () => {
      const result = getReligionGeneralMetadata(null, SAMPLE_METADATA);
      expect(result.name).toBe('Unknown');
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });

    it('should return fallback for empty religionId', () => {
      const result = getReligionGeneralMetadata('', SAMPLE_METADATA);
      expect(result.name).toBe('Unknown');
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });

    it('should return fallback when religion has no parent', () => {
      const metadataNoParent: EntityMetadata = {
        ...SAMPLE_METADATA,
        religion: {
          roman_paganism: { name: 'Roman Paganism', color: 'rgba(255, 0, 0, 1)' },
        },
      };
      const result = getReligionGeneralMetadata('roman_paganism', metadataNoParent);
      expect(result.name).toBe('Unknown');
    });

    it('should return fallback when religionGeneral entry not found', () => {
      const metadataNoGeneral: EntityMetadata = {
        ...SAMPLE_METADATA,
        religionGeneral: {},
      };
      const result = getReligionGeneralMetadata('roman_paganism', metadataNoGeneral);
      expect(result.name).toBe('Unknown');
    });
  });

  describe('with incomplete metadata entries', () => {
    it('should return fallback name when religionGeneral name is empty', () => {
      const result = getReligionGeneralMetadata('roman_paganism', INCOMPLETE_METADATA);
      expect(result.name).toBe('Unknown');
    });

    it('should return fallback color when religionGeneral color is empty', () => {
      const result = getReligionGeneralMetadata('roman_paganism', INCOMPLETE_METADATA);
      expect(result.color).toBe('rgba(128, 128, 128, 0.5)');
    });
  });
});

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('ProvinceDrawerContent', () => {
  describe('Province Name Header (Requirement 2.4)', () => {
    it('should display province name as header', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const header = screen.getByTestId('province-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Italia');
    });

    it('should render province name in h2 element', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Gallia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Gallia');
    });

    it('should handle special characters in province name', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Köln-Bonn"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByText('Köln-Bonn')).toBeInTheDocument();
    });

    it('should handle long province names', () => {
      const longName = 'Very Long Province Name That Might Overflow';
      render(
        <ProvinceDrawerContent
          provinceId={longName}
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe('Entity Details with Color Chips (Requirement 2.5)', () => {
    it('should display all four entity rows', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const entityRows = screen.getAllByTestId('entity-row');
      expect(entityRows).toHaveLength(4); // ruler, culture, religion, religionGeneral
    });

    it('should display ruler with correct name and color chip', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByText('Ruler:')).toBeInTheDocument();
      expect(screen.getByText('Roman Empire')).toBeInTheDocument();
      
      // Check color chip exists
      const colorChips = screen.getAllByTestId('color-chip');
      expect(colorChips.length).toBeGreaterThan(0);
    });

    it('should display culture with correct name', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByText('Culture:')).toBeInTheDocument();
      expect(screen.getByText('Latin')).toBeInTheDocument();
    });

    it('should display religion with correct name', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByText('Religion:')).toBeInTheDocument();
      expect(screen.getByText('Roman Paganism')).toBeInTheDocument();
    });

    it('should display religionGeneral with correct name', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByText('Religion Gen.:')).toBeInTheDocument();
      expect(screen.getByText('Paganism')).toBeInTheDocument();
    });

    it('should display entity icons', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const icons = screen.getAllByTestId('entity-icon');
      expect(icons).toHaveLength(4);
      
      // Check for expected icons
      expect(screen.getByText('👑')).toBeInTheDocument(); // Ruler
      expect(screen.getByText('🎭')).toBeInTheDocument(); // Culture
      expect(screen.getByText('⛪')).toBeInTheDocument(); // Religion
      expect(screen.getByText('☯️')).toBeInTheDocument(); // Religion General
    });

    it('should apply correct background color to color chips', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const colorChips = screen.getAllByTestId('color-chip');
      
      // First chip should be ruler color
      expect(colorChips[0]).toHaveStyle({ backgroundColor: 'rgba(139, 0, 0, 1)' });
      // Second chip should be culture color
      expect(colorChips[1]).toHaveStyle({ backgroundColor: 'rgba(255, 215, 0, 1)' });
      // Third chip should be religion color
      expect(colorChips[2]).toHaveStyle({ backgroundColor: 'rgba(255, 0, 0, 1)' });
      // Fourth chip should be religionGeneral color
      expect(colorChips[3]).toHaveStyle({ backgroundColor: 'rgba(128, 128, 0, 1)' });
    });

    it('should have aria-hidden on color chips', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const colorChips = screen.getAllByTestId('color-chip');
      colorChips.forEach((chip) => {
        expect(chip).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Population Formatting', () => {
    it('should display population in millions format', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const populationValue = screen.getByTestId('population-value');
      expect(populationValue).toHaveTextContent('1.5M');
    });

    it('should display population in thousands format', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA_THOUSANDS_POP}
          metadata={SAMPLE_METADATA}
        />
      );

      const populationValue = screen.getByTestId('population-value');
      expect(populationValue).toHaveTextContent('45k');
    });

    it('should display small population as raw number', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA_SMALL_POP}
          metadata={SAMPLE_METADATA}
        />
      );

      const populationValue = screen.getByTestId('population-value');
      expect(populationValue).toHaveTextContent('500');
    });

    it('should display zero population', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA_MISSING}
          metadata={SAMPLE_METADATA}
        />
      );

      const populationValue = screen.getByTestId('population-value');
      expect(populationValue).toHaveTextContent('0');
    });

    it('should display population label', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByText('Population:')).toBeInTheDocument();
    });
  });

  describe('ArticleIframe Embedding (Requirement 2.6)', () => {
    it('should render ArticleIframe component', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
          wikiUrl="https://en.wikipedia.org/wiki/Italia"
        />
      );

      const iframe = screen.getByTestId('mock-article-iframe');
      expect(iframe).toBeInTheDocument();
    });

    it('should pass wikiUrl to ArticleIframe', () => {
      const wikiUrl = 'https://en.wikipedia.org/wiki/Italia';
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
          wikiUrl={wikiUrl}
        />
      );

      const iframe = screen.getByTestId('mock-article-iframe');
      expect(iframe).toHaveAttribute('data-url', wikiUrl);
    });

    it('should pass correct title to ArticleIframe', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
          wikiUrl="https://en.wikipedia.org/wiki/Italia"
        />
      );

      const iframe = screen.getByTestId('mock-article-iframe');
      expect(iframe).toHaveAttribute('data-title', 'Wikipedia article for Italia');
    });

    it('should render ArticleIframe without wikiUrl', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const iframe = screen.getByTestId('mock-article-iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).not.toHaveAttribute('data-url');
    });

    it('should have article section with aria-label', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const articleSection = screen.getByTestId('article-section');
      expect(articleSection).toHaveAttribute('aria-label', 'Wikipedia article');
    });
  });

  describe('Missing Metadata Handling (Fallback to "Unknown")', () => {
    it('should display "Unknown" for missing ruler metadata', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={['UNKNOWN_RULER', 'latin', 'roman_paganism', 'Rome', 1000]}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should display "Unknown" for all entities when metadata is null', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={null}
        />
      );

      const unknownTexts = screen.getAllByText('Unknown');
      expect(unknownTexts).toHaveLength(4); // ruler, culture, religion, religionGeneral
    });

    it('should display fallback gray color for missing metadata', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={null}
        />
      );

      const colorChips = screen.getAllByTestId('color-chip');
      colorChips.forEach((chip) => {
        expect(chip).toHaveStyle({ backgroundColor: 'rgba(128, 128, 128, 0.5)' });
      });
    });

    it('should handle partial metadata gracefully', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={PARTIAL_METADATA}
        />
      );

      // Ruler should be found
      expect(screen.getByText('Roman Empire')).toBeInTheDocument();
      // Others should be Unknown
      const unknownTexts = screen.getAllByText('Unknown');
      expect(unknownTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty entity IDs in province data', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA_MISSING}
          metadata={SAMPLE_METADATA}
        />
      );

      const unknownTexts = screen.getAllByText('Unknown');
      expect(unknownTexts).toHaveLength(4);
    });
  });

  describe('Accessibility', () => {
    it('should have entity section with aria-label', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const entitySection = screen.getByTestId('entity-section');
      expect(entitySection).toHaveAttribute('aria-label', 'Province entity details');
    });

    it('should have data-testid on main container', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByTestId('province-drawer-content')).toBeInTheDocument();
    });

    it('should have aria-hidden on entity icons', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const icons = screen.getAllByTestId('entity-icon');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Component Structure', () => {
    it('should render header, entity section, and article section', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByTestId('province-header')).toBeInTheDocument();
      expect(screen.getByTestId('entity-section')).toBeInTheDocument();
      expect(screen.getByTestId('article-section')).toBeInTheDocument();
    });

    it('should render population row', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      expect(screen.getByTestId('population-row')).toBeInTheDocument();
    });

    it('should render entity labels', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const labels = screen.getAllByTestId('entity-label');
      expect(labels).toHaveLength(4);
    });

    it('should render entity names', () => {
      render(
        <ProvinceDrawerContent
          provinceId="Italia"
          provinceData={SAMPLE_PROVINCE_DATA}
          metadata={SAMPLE_METADATA}
        />
      );

      const names = screen.getAllByTestId('entity-name');
      expect(names).toHaveLength(4);
    });
  });
});

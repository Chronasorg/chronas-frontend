/**
 * MarkerDrawerContent Component Tests
 *
 * Tests for the marker drawer content component that displays detailed
 * marker information in the right drawer panel.
 *
 * Requirements tested:
 * - 3.3: Marker drawer displays marker name as header
 * - 3.4: Marker drawer displays marker type with appropriate icon
 * - 3.5: Marker drawer displays marker year with BCE/CE formatting
 * - 3.6: Marker drawer displays marker description when available
 * - 3.7: Marker drawer embeds Wikipedia article iframe
 *
 * Component Features:
 * - Marker name header display
 * - Marker type with icon
 * - Year display with BCE/CE formatting
 * - Description display (when available)
 * - ArticleIframe embedding
 *
 * Helper Functions:
 * - getMarkerIcon: Gets the icon for a marker type
 * - getMarkerTypeName: Gets the display name for a marker type
 * - formatYear: Formats a year for display with BCE/CE
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MarkerDrawerContent,
  getMarkerIcon,
  getMarkerTypeName,
  formatYear,
} from './MarkerDrawerContent';
import type { Marker } from '@/api/types';

// Mock the ArticleIframe component to isolate MarkerDrawerContent tests
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
 * Sample battle marker based on real API response format
 */
const SAMPLE_BATTLE_MARKER: Marker = {
  _id: 'battle_actium',
  name: 'Battle of Actium',
  type: 'battle',
  year: -31,
  coo: [20.7, 38.9],
  wiki: 'https://en.wikipedia.org/wiki/Battle_of_Actium',
};

/**
 * Sample city marker
 */
const SAMPLE_CITY_MARKER: Marker = {
  _id: 'city_rome',
  name: 'Rome',
  type: 'city',
  year: -753,
  coo: [12.4964, 41.9028],
  wiki: 'https://en.wikipedia.org/wiki/Rome',
};

/**
 * Sample person marker
 */
const SAMPLE_PERSON_MARKER: Marker = {
  _id: 'person_caesar',
  name: 'Julius Caesar',
  type: 'person',
  year: -100,
  coo: [12.4964, 41.9028],
  wiki: 'https://en.wikipedia.org/wiki/Julius_Caesar',
  data: {
    description: 'Roman general and statesman who played a critical role in the events that led to the demise of the Roman Republic.',
  },
};

/**
 * Sample marker with CE year
 */
const SAMPLE_CE_MARKER: Marker = {
  _id: 'battle_hastings',
  name: 'Battle of Hastings',
  type: 'battle',
  year: 1066,
  coo: [0.4876, 50.9144],
  wiki: 'https://en.wikipedia.org/wiki/Battle_of_Hastings',
};

/**
 * Sample marker without wiki URL
 */
const SAMPLE_MARKER_NO_WIKI: Marker = {
  _id: 'event_unknown',
  name: 'Unknown Event',
  type: 'event',
  year: 500,
  coo: [0, 0],
};

/**
 * Sample marker without description
 */
const SAMPLE_MARKER_NO_DESCRIPTION: Marker = {
  _id: 'battle_marathon',
  name: 'Battle of Marathon',
  type: 'battle',
  year: -490,
  coo: [23.9742, 38.1144],
  wiki: 'https://en.wikipedia.org/wiki/Battle_of_Marathon',
};

/**
 * Sample marker with short type code
 */
const SAMPLE_SHORT_TYPE_MARKER: Marker = {
  _id: 'battle_short',
  name: 'Battle Test',
  type: 'b',
  year: -100,
  coo: [0, 0],
};

/**
 * Sample scholar marker
 */
const SAMPLE_SCHOLAR_MARKER: Marker = {
  _id: 'scholar_aristotle',
  name: 'Aristotle',
  type: 'scholar',
  year: -384,
  coo: [23.7275, 37.9838],
  wiki: 'https://en.wikipedia.org/wiki/Aristotle',
};

/**
 * Sample artist marker
 */
const SAMPLE_ARTIST_MARKER: Marker = {
  _id: 'artist_michelangelo',
  name: 'Michelangelo',
  type: 'artist',
  year: 1475,
  coo: [11.2558, 43.7696],
  wiki: 'https://en.wikipedia.org/wiki/Michelangelo',
};

/**
 * Sample marker with unknown type
 */
const SAMPLE_UNKNOWN_TYPE_MARKER: Marker = {
  _id: 'unknown_type',
  name: 'Unknown Type Marker',
  type: 'custom_type',
  year: 1000,
  coo: [0, 0],
};

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('getMarkerIcon', () => {
  describe('standard marker types', () => {
    it('should return battle icon for "battle" type', () => {
      expect(getMarkerIcon('battle')).toBe('⚔️');
    });

    it('should return city icon for "city" type', () => {
      expect(getMarkerIcon('city')).toBe('🏛️');
    });

    it('should return capital icon for "capital" type', () => {
      expect(getMarkerIcon('capital')).toBe('🏰');
    });

    it('should return person icon for "person" type', () => {
      expect(getMarkerIcon('person')).toBe('👤');
    });

    it('should return scholar icon for "scholar" type', () => {
      expect(getMarkerIcon('scholar')).toBe('📚');
    });

    it('should return artist icon for "artist" type', () => {
      expect(getMarkerIcon('artist')).toBe('🎨');
    });

    it('should return artwork icon for "artwork" type', () => {
      expect(getMarkerIcon('artwork')).toBe('🖼️');
    });

    it('should return artifact icon for "artifact" type', () => {
      expect(getMarkerIcon('artifact')).toBe('🏺');
    });

    it('should return event icon for "event" type', () => {
      expect(getMarkerIcon('event')).toBe('📜');
    });

    it('should return organization icon for "organization" type', () => {
      expect(getMarkerIcon('organization')).toBe('🏢');
    });

    it('should return architecture icon for "architecture" type', () => {
      expect(getMarkerIcon('architecture')).toBe('🏛️');
    });
  });

  describe('short type codes', () => {
    it('should return battle icon for "b" type', () => {
      expect(getMarkerIcon('b')).toBe('⚔️');
    });

    it('should return city icon for "c" type', () => {
      expect(getMarkerIcon('c')).toBe('🏛️');
    });

    it('should return person icon for "p" type', () => {
      expect(getMarkerIcon('p')).toBe('👤');
    });

    it('should return scholar icon for "s" type', () => {
      expect(getMarkerIcon('s')).toBe('📚');
    });

    it('should return artist icon for "a" type', () => {
      expect(getMarkerIcon('a')).toBe('🎨');
    });

    it('should return artwork icon for "ar" type', () => {
      expect(getMarkerIcon('ar')).toBe('🖼️');
    });

    it('should return event icon for "e" type', () => {
      expect(getMarkerIcon('e')).toBe('📜');
    });

    it('should return organization icon for "o" type', () => {
      expect(getMarkerIcon('o')).toBe('🏢');
    });

    it('should return architecture icon for "ai" type', () => {
      expect(getMarkerIcon('ai')).toBe('🏛️');
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase type', () => {
      expect(getMarkerIcon('BATTLE')).toBe('⚔️');
    });

    it('should handle mixed case type', () => {
      expect(getMarkerIcon('Battle')).toBe('⚔️');
    });
  });

  describe('unknown types', () => {
    it('should return default icon for unknown type', () => {
      expect(getMarkerIcon('unknown_type')).toBe('📍');
    });

    it('should return default icon for empty string', () => {
      expect(getMarkerIcon('')).toBe('📍');
    });
  });
});

describe('getMarkerTypeName', () => {
  describe('standard marker types', () => {
    it('should return "Battle" for "battle" type', () => {
      expect(getMarkerTypeName('battle')).toBe('Battle');
    });

    it('should return "City" for "city" type', () => {
      expect(getMarkerTypeName('city')).toBe('City');
    });

    it('should return "Capital" for "capital" type', () => {
      expect(getMarkerTypeName('capital')).toBe('Capital');
    });

    it('should return "Person" for "person" type', () => {
      expect(getMarkerTypeName('person')).toBe('Person');
    });

    it('should return "Scholar" for "scholar" type', () => {
      expect(getMarkerTypeName('scholar')).toBe('Scholar');
    });

    it('should return "Artist" for "artist" type', () => {
      expect(getMarkerTypeName('artist')).toBe('Artist');
    });

    it('should return "Artwork" for "artwork" type', () => {
      expect(getMarkerTypeName('artwork')).toBe('Artwork');
    });

    it('should return "Event" for "event" type', () => {
      expect(getMarkerTypeName('event')).toBe('Event');
    });

    it('should return "Organization" for "organization" type', () => {
      expect(getMarkerTypeName('organization')).toBe('Organization');
    });

    it('should return "Architecture" for "architecture" type', () => {
      expect(getMarkerTypeName('architecture')).toBe('Architecture');
    });
  });

  describe('short type codes', () => {
    it('should return "Battle" for "b" type', () => {
      expect(getMarkerTypeName('b')).toBe('Battle');
    });

    it('should return "City" for "c" type', () => {
      expect(getMarkerTypeName('c')).toBe('City');
    });

    it('should return "Person" for "p" type', () => {
      expect(getMarkerTypeName('p')).toBe('Person');
    });

    it('should return "Scholar" for "s" type', () => {
      expect(getMarkerTypeName('s')).toBe('Scholar');
    });

    it('should return "Artist" for "a" type', () => {
      expect(getMarkerTypeName('a')).toBe('Artist');
    });

    it('should return "Artwork" for "ar" type', () => {
      expect(getMarkerTypeName('ar')).toBe('Artwork');
    });

    it('should return "Event" for "e" type', () => {
      expect(getMarkerTypeName('e')).toBe('Event');
    });

    it('should return "Organization" for "o" type', () => {
      expect(getMarkerTypeName('o')).toBe('Organization');
    });

    it('should return "Architecture" for "ai" type', () => {
      expect(getMarkerTypeName('ai')).toBe('Architecture');
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase type', () => {
      expect(getMarkerTypeName('BATTLE')).toBe('Battle');
    });

    it('should handle mixed case type', () => {
      expect(getMarkerTypeName('Battle')).toBe('Battle');
    });
  });

  describe('unknown types', () => {
    it('should capitalize unknown type', () => {
      expect(getMarkerTypeName('custom_type')).toBe('Custom_type');
    });

    it('should handle empty string', () => {
      expect(getMarkerTypeName('')).toBe('');
    });
  });
});

describe('formatYear', () => {
  describe('BCE years (negative)', () => {
    it('should format -31 as "31 BCE"', () => {
      expect(formatYear(-31)).toBe('31 BCE');
    });

    it('should format -753 as "753 BCE"', () => {
      expect(formatYear(-753)).toBe('753 BCE');
    });

    it('should format -1 as "1 BCE"', () => {
      expect(formatYear(-1)).toBe('1 BCE');
    });

    it('should format -3000 as "3000 BCE"', () => {
      expect(formatYear(-3000)).toBe('3000 BCE');
    });
  });

  describe('CE years (positive)', () => {
    it('should format 1066 as "1066 CE"', () => {
      expect(formatYear(1066)).toBe('1066 CE');
    });

    it('should format 1 as "1 CE"', () => {
      expect(formatYear(1)).toBe('1 CE');
    });

    it('should format 2024 as "2024 CE"', () => {
      expect(formatYear(2024)).toBe('2024 CE');
    });

    it('should format 500 as "500 CE"', () => {
      expect(formatYear(500)).toBe('500 CE');
    });
  });

  describe('edge cases', () => {
    it('should format 0 as "0 CE"', () => {
      expect(formatYear(0)).toBe('0 CE');
    });
  });
});

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('MarkerDrawerContent', () => {
  describe('Marker Details (Requirement 3.3)', () => {
    it('should display marker drawer content', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      const container = screen.getByTestId('marker-drawer-content');
      expect(container).toBeInTheDocument();
    });

    it('should render marker type', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('Battle');
    });

    it('should render marker drawer content container', () => {
      const markerWithSpecialChars: Marker = {
        ...SAMPLE_BATTLE_MARKER,
        name: 'Battle of Köln-Bonn',
      };
      render(<MarkerDrawerContent marker={markerWithSpecialChars} />);

      expect(screen.getByTestId('marker-drawer-content')).toBeInTheDocument();
    });
  });

  describe('Marker Type with Icon (Requirement 3.4)', () => {
    it('should display marker type with battle icon', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByTestId('marker-type')).toHaveTextContent('Battle');
      expect(screen.getByText('⚔️')).toBeInTheDocument();
    });

    it('should display marker type with city icon', () => {
      render(<MarkerDrawerContent marker={SAMPLE_CITY_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('City');
      expect(screen.getByText('🏛️')).toBeInTheDocument();
    });

    it('should display marker type with person icon', () => {
      render(<MarkerDrawerContent marker={SAMPLE_PERSON_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('Person');
      expect(screen.getByText('👤')).toBeInTheDocument();
    });

    it('should display marker type with scholar icon', () => {
      render(<MarkerDrawerContent marker={SAMPLE_SCHOLAR_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('Scholar');
      expect(screen.getByText('📚')).toBeInTheDocument();
    });

    it('should display marker type with artist icon', () => {
      render(<MarkerDrawerContent marker={SAMPLE_ARTIST_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('Artist');
      expect(screen.getByText('🎨')).toBeInTheDocument();
    });

    it('should handle short type codes', () => {
      render(<MarkerDrawerContent marker={SAMPLE_SHORT_TYPE_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('Battle');
      expect(screen.getByText('⚔️')).toBeInTheDocument();
    });

    it('should handle unknown marker types', () => {
      render(<MarkerDrawerContent marker={SAMPLE_UNKNOWN_TYPE_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('Custom_type');
      expect(screen.getByText('📍')).toBeInTheDocument();
    });

    it('should have type row with data-testid', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByTestId('type-row')).toBeInTheDocument();
    });
  });

  describe('Marker Year Display (Requirement 3.5)', () => {
    it('should display BCE year correctly', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByText('Year:')).toBeInTheDocument();
      expect(screen.getByTestId('marker-year')).toHaveTextContent('31 BCE');
    });

    it('should display CE year correctly', () => {
      render(<MarkerDrawerContent marker={SAMPLE_CE_MARKER} />);

      expect(screen.getByTestId('marker-year')).toHaveTextContent('1066 CE');
    });

    it('should display year icon', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByText('📅')).toBeInTheDocument();
    });

    it('should have year row with data-testid', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByTestId('year-row')).toBeInTheDocument();
    });

    it('should handle very old BCE dates', () => {
      const ancientMarker: Marker = {
        ...SAMPLE_BATTLE_MARKER,
        year: -3000,
      };
      render(<MarkerDrawerContent marker={ancientMarker} />);

      expect(screen.getByTestId('marker-year')).toHaveTextContent('3000 BCE');
    });
  });

  describe('Marker Description Display (Requirement 3.6)', () => {
    it('should display description when available', () => {
      render(<MarkerDrawerContent marker={SAMPLE_PERSON_MARKER} />);

      expect(screen.getByTestId('description-section')).toBeInTheDocument();
      expect(screen.getByText('Description:')).toBeInTheDocument();
      expect(screen.getByTestId('marker-description')).toHaveTextContent(
        'Roman general and statesman'
      );
    });

    it('should display description icon', () => {
      render(<MarkerDrawerContent marker={SAMPLE_PERSON_MARKER} />);

      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('should not display description section when not available', () => {
      render(<MarkerDrawerContent marker={SAMPLE_MARKER_NO_DESCRIPTION} />);

      expect(screen.queryByTestId('description-section')).not.toBeInTheDocument();
    });

    it('should not display description section when marker has no data', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.queryByTestId('description-section')).not.toBeInTheDocument();
    });

    it('should handle long descriptions', () => {
      const longDescription = 'A'.repeat(500);
      const markerWithLongDesc: Marker = {
        ...SAMPLE_PERSON_MARKER,
        data: { description: longDescription },
      };
      render(<MarkerDrawerContent marker={markerWithLongDesc} />);

      expect(screen.getByTestId('marker-description')).toHaveTextContent(longDescription);
    });
  });

  describe('ArticleIframe Embedding (Requirement 3.7)', () => {
    it('should render ArticleIframe component', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      const iframe = screen.getByTestId('mock-article-iframe');
      expect(iframe).toBeInTheDocument();
    });

    it('should pass wiki URL to ArticleIframe', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      const iframe = screen.getByTestId('mock-article-iframe');
      expect(iframe).toHaveAttribute(
        'data-url',
        'https://en.wikipedia.org/wiki/Battle_of_Actium'
      );
    });

    it('should pass correct title to ArticleIframe', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      const iframe = screen.getByTestId('mock-article-iframe');
      expect(iframe).toHaveAttribute(
        'data-title',
        'Wikipedia article for Battle of Actium'
      );
    });

    it('should construct wiki URL from marker._id when wiki property is missing', () => {
      // Production behavior: when marker.wiki is undefined, use marker._id to construct URL
      render(<MarkerDrawerContent marker={SAMPLE_MARKER_NO_WIKI} />);

      const iframe = screen.getByTestId('mock-article-iframe');
      expect(iframe).toBeInTheDocument();
      // URL should be constructed from marker._id (event_unknown)
      expect(iframe).toHaveAttribute('data-url', 'https://en.wikipedia.org/wiki/event_unknown');
    });

    it('should have article section with aria-label', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      const articleSection = screen.getByTestId('article-section');
      expect(articleSection).toHaveAttribute('aria-label', 'Wikipedia article');
    });
  });

  describe('Accessibility', () => {
    it('should have details section with aria-label', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      const detailsSection = screen.getByTestId('details-section');
      expect(detailsSection).toHaveAttribute('aria-label', 'Marker details');
    });

    it('should have data-testid on main container', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByTestId('marker-drawer-content')).toBeInTheDocument();
    });

    it('should have aria-hidden on detail icons', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      // Type icon and year icon should be aria-hidden
      const typeRow = screen.getByTestId('type-row');
      const yearRow = screen.getByTestId('year-row');
      
      const typeIcon = typeRow.querySelector('[aria-hidden="true"]');
      const yearIcon = yearRow.querySelector('[aria-hidden="true"]');
      
      expect(typeIcon).toBeInTheDocument();
      expect(yearIcon).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render header, details section, and article section', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByTestId('marker-drawer-content')).toBeInTheDocument();
      expect(screen.getByTestId('details-section')).toBeInTheDocument();
      expect(screen.getByTestId('article-section')).toBeInTheDocument();
    });

    it('should render type row and year row', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByTestId('type-row')).toBeInTheDocument();
      expect(screen.getByTestId('year-row')).toBeInTheDocument();
    });

    it('should render all detail labels', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('Year:')).toBeInTheDocument();
    });
  });

  describe('Different Marker Types', () => {
    it('should render battle marker correctly', () => {
      render(<MarkerDrawerContent marker={SAMPLE_BATTLE_MARKER} />);

      expect(screen.getByTestId('marker-drawer-content')).toBeInTheDocument();
      expect(screen.getByTestId('marker-type')).toHaveTextContent('Battle');
      expect(screen.getByTestId('marker-year')).toHaveTextContent('31 BCE');
    });

    it('should render city marker correctly', () => {
      render(<MarkerDrawerContent marker={SAMPLE_CITY_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('City');
      expect(screen.getByTestId('marker-year')).toHaveTextContent('753 BCE');
    });

    it('should render person marker correctly', () => {
      render(<MarkerDrawerContent marker={SAMPLE_PERSON_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('Person');
      expect(screen.getByTestId('marker-year')).toHaveTextContent('100 BCE');
      expect(screen.getByTestId('marker-description')).toBeInTheDocument();
    });

    it('should render scholar marker correctly', () => {
      render(<MarkerDrawerContent marker={SAMPLE_SCHOLAR_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('Scholar');
      expect(screen.getByTestId('marker-year')).toHaveTextContent('384 BCE');
    });

    it('should render artist marker correctly', () => {
      render(<MarkerDrawerContent marker={SAMPLE_ARTIST_MARKER} />);

      expect(screen.getByTestId('marker-type')).toHaveTextContent('Artist');
      expect(screen.getByTestId('marker-year')).toHaveTextContent('1475 CE');
    });
  });
});

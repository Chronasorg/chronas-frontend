import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { SearchContent } from './SearchContent';
import { useMapStore } from '@/stores/mapStore';
import { useTimelineStore } from '@/stores/timelineStore';
import { useUIStore } from '@/stores/uiStore';

function provinceFeature(name: string, lng = 10, lat = 20): Feature<Polygon | MultiPolygon> {
  return {
    type: 'Feature',
    properties: { name },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lng, lat],
          [lng + 1, lat],
          [lng + 1, lat + 1],
          [lng, lat + 1],
          [lng, lat],
        ],
      ],
    },
  };
}

describe('SearchContent', () => {
  const flyTo = vi.fn();
  const selectProvince = vi.fn();
  const openRightDrawer = vi.fn();

  beforeEach(() => {
    flyTo.mockClear();
    selectProvince.mockClear();
    openRightDrawer.mockClear();

    useMapStore.setState({
      provincesGeoJSON: {
        type: 'FeatureCollection',
        features: [
          provinceFeature('Rome', 12, 41),
          provinceFeature('Roman Empire', 14, 42),
          provinceFeature('Athens', 23, 37),
        ],
      },
      currentAreaData: {
        Rome: ['r1', 'c1', 'rel1', null, 100],
        Athens: ['r2', 'c2', 'rel2', null, 50],
      },
      markers: [
        {
          _id: 'm1',
          name: 'Sack of Rome',
          type: 'b',
          year: 1452,
          coo: [12.5, 41.9],
        },
      ],
      flyTo,
      selectProvince,
    });

    useUIStore.setState({ openRightDrawer });

    useTimelineStore.setState({ selectedYear: 1453 });
  });

  it('renders the input with placeholder and a hint', () => {
    render(<SearchContent />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByText(/Type a placename/i)).toBeInTheDocument();
  });

  it('shows in-view province matches when typing', () => {
    render(<SearchContent />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'rom' } });
    expect(screen.getByTestId('search-province-Rome')).toBeInTheDocument();
    expect(screen.queryByTestId('search-province-Roman Empire')).not.toBeInTheDocument();
    expect(screen.getByTestId('search-province-other-Roman Empire')).toBeInTheDocument();
  });

  it('shows marker matches in the in-view group', () => {
    render(<SearchContent />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'sack' } });
    expect(screen.getByTestId('search-marker-m1')).toBeInTheDocument();
  });

  it('flies to a province and selects it WITHOUT opening the right drawer', () => {
    render(<SearchContent />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'rome' } });
    fireEvent.click(screen.getByTestId('search-province-Rome'));
    expect(selectProvince).toHaveBeenCalledWith('Rome');
    expect(flyTo).toHaveBeenCalled();
    expect(openRightDrawer).not.toHaveBeenCalled();
  });

  it('flies to a marker without opening the right drawer', () => {
    render(<SearchContent />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'sack' } });
    fireEvent.click(screen.getByTestId('search-marker-m1'));
    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ longitude: 12.5, latitude: 41.9 })
    );
    expect(openRightDrawer).not.toHaveBeenCalled();
  });

  it('shows an empty state when nothing matches', () => {
    render(<SearchContent />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'zzzzzz' } });
    expect(screen.getByTestId('search-empty')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', () => {
    render(<SearchContent />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'rome' } });
    fireEvent.click(screen.getByTestId('search-clear-button'));
    const input = screen.getByTestId('search-input');
    expect(input).toHaveProperty('value', '');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<SearchContent onClose={onClose} />);
    fireEvent.click(screen.getByTestId('search-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

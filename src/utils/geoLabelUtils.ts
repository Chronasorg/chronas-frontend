import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, FeatureCollection } from 'geojson';

export type AdjacencyGraph = Map<number, Set<number>>;

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function getBBox(feature: Feature<Polygon | MultiPolygon>): BBox {
  const bbox = turf.bbox(feature);
  return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3] };
}

function bboxOverlap(a: BBox, b: BBox, pad: number): boolean {
  return a.minX - pad <= b.maxX && a.maxX + pad >= b.minX &&
         a.minY - pad <= b.maxY && a.maxY + pad >= b.minY;
}

function coordKeys(feature: Feature<Polygon | MultiPolygon>, precision: number): Set<string> {
  const keys = new Set<string>();
  const geom = feature.geometry;
  const rings: number[][][] =
    geom.type === 'Polygon'
      ? geom.coordinates
      : geom.coordinates.flat();

  for (const ring of rings) {
    for (const coord of ring) {
      const x = Math.round((coord[0] ?? 0) / precision) * precision;
      const y = Math.round((coord[1] ?? 0) / precision) * precision;
      keys.add(`${String(x)},${String(y)}`);
    }
  }
  return keys;
}

/**
 * Computes an adjacency graph for all provinces in a GeoJSON FeatureCollection.
 * Uses bounding-box pre-filtering + shared-coordinate detection to find neighbors.
 */
export function computeAdjacencyGraph(
  geojson: FeatureCollection<Polygon | MultiPolygon>
): AdjacencyGraph {
  const features = geojson.features;
  const n = features.length;
  const graph: AdjacencyGraph = new Map();

  for (let i = 0; i < n; i++) {
    graph.set(i, new Set());
  }

  const bboxes: BBox[] = [];
  const coordSets: Set<string>[] = [];
  const PRECISION = 0.01;
  const BBOX_PAD = 0.05;

  for (let i = 0; i < n; i++) {
    const feat = features[i];
    if (!feat) continue;
    bboxes.push(getBBox(feat));
    coordSets.push(coordKeys(feat, PRECISION));
  }

  for (let i = 0; i < n; i++) {
    const bboxI = bboxes[i];
    const coordsI = coordSets[i];
    if (!bboxI || !coordsI) continue;

    for (let j = i + 1; j < n; j++) {
      const bboxJ = bboxes[j];
      const coordsJ = coordSets[j];
      if (!bboxJ || !coordsJ) continue;

      if (!bboxOverlap(bboxI, bboxJ, BBOX_PAD)) continue;

      const [smallerSet, largerSet] = coordsI.size < coordsJ.size
        ? [coordsI, coordsJ]
        : [coordsJ, coordsI];

      let shared = false;
      for (const key of smallerSet) {
        if (largerSet.has(key)) {
          shared = true;
          break;
        }
      }

      if (shared) {
        graph.get(i)?.add(j);
        graph.get(j)?.add(i);
      }
    }
  }

  return graph;
}

/**
 * Finds connected components of province indices using BFS.
 * Given province indices belonging to one entity, returns arrays
 * of indices grouped by geographic contiguity.
 */
export function findConnectedComponents(
  provinceIndices: number[],
  adjacency: AdjacencyGraph
): number[][] {
  const indexSet = new Set(provinceIndices);
  const visited = new Set<number>();
  const components: number[][] = [];

  for (const start of provinceIndices) {
    if (visited.has(start)) continue;

    const component: number[] = [];
    const queue: number[] = [start];
    visited.add(start);

    while (queue.length > 0) {
      const current = queue.pop();
      if (current === undefined) break;
      component.push(current);

      const neighbors = adjacency.get(current);
      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        if (indexSet.has(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  return components;
}

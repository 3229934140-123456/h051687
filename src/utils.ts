import { Point, DataPoint, Bounds } from './types';

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function extent(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}

export function unique(values: any[]): any[] {
  return Array.from(new Set(values));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function formatNumber(value: number, precision: number = 2): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(precision) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(precision) + 'K';
  }
  return value.toFixed(precision);
}

export function simplifyLine(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  const result: Point[] = [];
  result.push(points[0]);

  let lastKept = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    const d = distance(lastKept, points[i]);
    if (d >= tolerance) {
      result.push(points[i]);
      lastKept = points[i];
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

export function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDistance) {
      maxDistance = d;
      maxIndex = i;
    }
  }

  if (maxDistance > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIndex), epsilon);
    return left.slice(0, left.length - 1).concat(right);
  }

  return [first, last];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);

  if (mag === 0) return distance(point, lineStart);

  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  const xi = lineStart.x + u * dx;
  const yi = lineStart.y + u * dy;

  return distance(point, { x: xi, y: yi });
}

export function getDataBounds(data: DataPoint[], xField: string, yField: string): Bounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const d of data) {
    const x = d[xField];
    const y = d[yField];
    if (isNumber(x)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    if (isNumber(y)) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  return { minX, maxX, minY, maxY };
}

export function binarySearch<T>(arr: T[], target: T, accessor: (item: T) => number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midVal = accessor(arr[mid]);
    const targetVal = accessor(target);

    if (midVal === targetVal) return mid;
    if (midVal < targetVal) left = mid + 1;
    else right = mid - 1;
  }

  return left > 0 ? left - 1 : 0;
}

export function findNearestPoint(points: Point[], target: Point, radius: number = 20): { index: number; distance: number } | null {
  let nearestIndex = -1;
  let nearestDist = Infinity;

  for (let i = 0; i < points.length; i++) {
    const d = distance(points[i], target);
    if (d < nearestDist && d <= radius) {
      nearestDist = d;
      nearestIndex = i;
    }
  }

  return nearestIndex >= 0 ? { index: nearestIndex, distance: nearestDist } : null;
}

export function generateColors(count: number): string[] {
  const colors: string[] = [];
  const baseColors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#5b8ff9',
    '#5ad8a6', '#5d7092', '#f6bd16', '#e86452', '#6dc8ec'
  ];

  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
}

import { Scale, DataPoint, GeometryPrimitive, Point } from '../types';
import { Geometry } from './geometry';
import { isNumber } from '../utils';

export class ScatterGeometry extends Geometry {
  private radius: number = 4;

  constructor(
    data: DataPoint[],
    xField: string,
    yField: string,
    xScale: Scale,
    yScale: Scale,
    color: string = '#5470c6',
    name: string = ''
  ) {
    super(data, xField, yField, xScale, yScale, color, name);
  }

  setRadius(radius: number): void {
    this.radius = radius;
  }

  update(): GeometryPrimitive[] {
    this.transformedPoints = this.transformData();
    this.simplifiedPoints = this.transformedPoints;

    this.primitives = this.transformedPoints.map((point, index) => ({
      type: 'circle' as const,
      x: point.x,
      y: point.y,
      radius: this.radius,
      color: this.color,
      data: this.data[index]
    }));

    return this.primitives;
  }

  getPoints(): Point[] {
    return this.transformedPoints;
  }

  getSimplifiedPoints(): Point[] {
    return this.simplifiedPoints;
  }

  getCircleAt(x: number, y: number): { data: DataPoint; index: number; distance: number } | null {
    let nearestIndex = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < this.primitives.length; i++) {
      const circle = this.primitives[i];
      if (circle.type === 'circle' && circle.x !== undefined && circle.y !== undefined) {
        const dx = circle.x - x;
        const dy = circle.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.radius + 5 && dist < nearestDist) {
          nearestDist = dist;
          nearestIndex = i;
        }
      }
    }

    return nearestIndex >= 0
      ? { data: this.data[nearestIndex], index: nearestIndex, distance: nearestDist }
      : null;
  }

  getDensityGrid(cellSize: number = 10, bounds: { minX: number; maxX: number; minY: number; maxY: number }): number[][] {
    const width = Math.ceil((bounds.maxX - bounds.minX) / cellSize);
    const height = Math.ceil((bounds.maxY - bounds.minY) / cellSize);
    const grid: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));

    for (const point of this.transformedPoints) {
      const cellX = Math.min(Math.floor((point.x - bounds.minX) / cellSize), width - 1);
      const cellY = Math.min(Math.floor((point.y - bounds.minY) / cellSize), height - 1);

      if (cellX >= 0 && cellX < width && cellY >= 0 && cellY < height) {
        grid[cellY][cellX]++;
      }
    }

    return grid;
  }
}

export function createScatterGeometry(
  data: DataPoint[],
  xField: string,
  yField: string,
  xScale: Scale,
  yScale: Scale,
  color?: string,
  name?: string
): ScatterGeometry {
  return new ScatterGeometry(data, xField, yField, xScale, yScale, color, name);
}

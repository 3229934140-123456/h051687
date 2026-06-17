import { Scale, DataPoint, GeometryPrimitive, Point } from '../types';
import { rdpSimplify, isNumber } from '../utils';

export abstract class Geometry {
  protected data: DataPoint[];
  protected xField: string;
  protected yField: string;
  protected color: string;
  protected name: string;
  protected xScale: Scale;
  protected yScale: Scale;
  protected primitives: GeometryPrimitive[] = [];
  protected transformedPoints: Point[] = [];
  protected simplifiedPoints: Point[] = [];

  constructor(
    data: DataPoint[],
    xField: string,
    yField: string,
    xScale: Scale,
    yScale: Scale,
    color: string = '#5470c6',
    name: string = ''
  ) {
    this.data = data;
    this.xField = xField;
    this.yField = yField;
    this.xScale = xScale;
    this.yScale = yScale;
    this.color = color;
    this.name = name;
  }

  protected transformData(): Point[] {
    return this.data.map(d => {
      const xVal = d[this.xField];
      const yVal = d[this.yField];
      const x = isNumber(xVal)
        ? this.xScale(xVal as number)
        : this.xScale(xVal as string);
      const y = isNumber(yVal)
        ? this.yScale(yVal as number)
        : this.yScale(yVal as string);
      return { x, y };
    });
  }

  protected simplify(points: Point[], tolerance: number = 1): Point[] {
    if (points.length < 100) return points;
    return rdpSimplify(points, tolerance);
  }

  abstract update(): GeometryPrimitive[];
  abstract getPoints(): Point[];
  abstract getSimplifiedPoints(): Point[];

  getData(): DataPoint[] {
    return this.data;
  }

  setData(data: DataPoint[]): void {
    this.data = data;
  }

  setScales(xScale: Scale, yScale: Scale): void {
    this.xScale = xScale;
    this.yScale = yScale;
  }

  getColor(): string {
    return this.color;
  }

  setColor(color: string): void {
    this.color = color;
  }

  getName(): string {
    return this.name;
  }

  getNearestDataPoint(screenX: number, screenY: number, radius: number = 20): { data: DataPoint; distance: number; index: number } | null {
    const points = this.getPoints();
    let nearestIndex = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < points.length; i++) {
      const dx = points[i].x - screenX;
      const dy = points[i].y - screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist && dist <= radius) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    return nearestIndex >= 0
      ? { data: this.data[nearestIndex], distance: nearestDist, index: nearestIndex }
      : null;
  }

  getYValueAtX(x: number): { y: number; data: DataPoint; index: number } | null {
    const points = this.getPoints();
    if (points.length === 0) return null;

    let nearestIndex = 0;
    let minDiff = Math.abs(points[0].x - x);

    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(points[i].x - x);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIndex = i;
      }
    }

    return { y: points[nearestIndex].y, data: this.data[nearestIndex], index: nearestIndex };
  }

  getPrimitives(): GeometryPrimitive[] {
    return this.primitives;
  }
}

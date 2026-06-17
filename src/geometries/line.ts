import { Scale, DataPoint, GeometryPrimitive, Point } from '../types';
import { Geometry } from './geometry';
import { isNumber } from '../utils';

export class LineGeometry extends Geometry {
  private smooth: boolean = false;

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

  setSmooth(smooth: boolean): void {
    this.smooth = smooth;
  }

  update(): GeometryPrimitive[] {
    this.transformedPoints = this.transformData();
    this.simplifiedPoints = this.simplify(this.transformedPoints, 0.5);

    this.primitives = [{
      type: 'path',
      points: this.simplifiedPoints,
      color: this.color
    }];

    return this.primitives;
  }

  getPoints(): Point[] {
    return this.transformedPoints;
  }

  getSimplifiedPoints(): Point[] {
    return this.simplifiedPoints;
  }

  generatePath(): string {
    const points = this.simplifiedPoints;
    if (points.length < 2) return '';

    if (this.smooth) {
      return this.generateSmoothPath(points);
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  private generateSmoothPath(points: Point[]): string {
    if (points.length < 2) return '';

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return d;
  }

  getYAtX(x: number): number | null {
    const points = this.transformedPoints;
    if (points.length < 2) return null;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if ((x >= p1.x && x <= p2.x) || (x <= p1.x && x >= p2.x)) {
        if (p2.x === p1.x) return (p1.y + p2.y) / 2;
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + t * (p2.y - p1.y);
      }
    }

    return null;
  }
}

export function createLineGeometry(
  data: DataPoint[],
  xField: string,
  yField: string,
  xScale: Scale,
  yScale: Scale,
  color?: string,
  name?: string
): LineGeometry {
  return new LineGeometry(data, xField, yField, xScale, yScale, color, name);
}

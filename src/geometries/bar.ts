import { Scale, DataPoint, GeometryPrimitive, Point } from '../types';
import { Geometry } from './geometry';
import { isNumber } from '../utils';

export class BarGeometry extends Geometry {
  private barWidth: number = 0;
  private barPadding: number = 0.2;

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
    this.calculateBarWidth();
  }

  private calculateBarWidth(): void {
    const n = this.data.length;
    if (n <= 1) {
      this.barWidth = 30;
      return;
    }

    const firstX = this.data[0][this.xField];
    const secondX = this.data[1][this.xField];

    const x1 = isNumber(firstX)
      ? this.xScale(firstX as number)
      : this.xScale(firstX as string);
    const x2 = isNumber(secondX)
      ? this.xScale(secondX as number)
      : this.xScale(secondX as string);

    const interval = Math.abs(x2 - x1);
    this.barWidth = interval * (1 - this.barPadding);
  }

  setBarPadding(padding: number): void {
    this.barPadding = Math.max(0, Math.min(0.8, padding));
    this.calculateBarWidth();
  }

  getBarWidth(): number {
    return this.barWidth;
  }

  update(): GeometryPrimitive[] {
    this.calculateBarWidth();
    this.transformedPoints = this.transformData();
    this.simplifiedPoints = this.transformedPoints;

    const yZero = this.yScale(0);
    const halfWidth = this.barWidth / 2;

    this.primitives = this.transformedPoints.map((point, index) => {
      const x = point.x - halfWidth;
      const y = Math.min(point.y, yZero);
      const height = Math.abs(yZero - point.y);
      const width = this.barWidth;

      return {
        type: 'rect' as const,
        x,
        y,
        width,
        height,
        color: this.color,
        data: this.data[index]
      };
    });

    return this.primitives;
  }

  getPoints(): Point[] {
    return this.transformedPoints;
  }

  getSimplifiedPoints(): Point[] {
    return this.simplifiedPoints;
  }

  getBarAt(x: number, y: number): { data: DataPoint; index: number } | null {
    for (let i = 0; i < this.primitives.length; i++) {
      const rect = this.primitives[i];
      if (rect.type === 'rect' && rect.x !== undefined && rect.y !== undefined &&
          rect.width !== undefined && rect.height !== undefined) {
        if (x >= rect.x && x <= rect.x + rect.width &&
            y >= rect.y && y <= rect.y + rect.height) {
          return { data: this.data[i], index: i };
        }
      }
    }
    return null;
  }
}

export function createBarGeometry(
  data: DataPoint[],
  xField: string,
  yField: string,
  xScale: Scale,
  yScale: Scale,
  color?: string,
  name?: string
): BarGeometry {
  return new BarGeometry(data, xField, yField, xScale, yScale, color, name);
}

import { GeometryPrimitive, Point, Transform } from '../types';
import { LineGeometry } from '../geometries/line';
import { BarGeometry } from '../geometries/bar';
import { ScatterGeometry } from '../geometries/scatter';
import { AxisGeometry } from '../axes/axis-geometry';
import { LegendItem } from '../types';

export abstract class Renderer {
  protected container: HTMLElement;
  protected width: number;
  protected height: number;
  protected transform: Transform = { k: 1, tx: 0, ty: 0 };

  constructor(container: HTMLElement, width: number, height: number) {
    this.container = container;
    this.width = width;
    this.height = height;
  }

  abstract clear(): void;
  abstract resize(width: number, height: number): void;
  abstract drawLine(line: LineGeometry): void;
  abstract drawBar(bar: BarGeometry): void;
  abstract drawScatter(scatter: ScatterGeometry): void;
  abstract drawAxis(axis: AxisGeometry, offsetX: number, offsetY: number): void;
  abstract drawGrid(axis: AxisGeometry, isVertical: boolean, plotWidth: number, plotHeight: number): void;
  abstract drawLegend(items: LegendItem[], x: number, y: number): void;
  abstract drawTitle(title: string, x: number, y: number): void;
  abstract drawCrosshair(x: number, y: number, plotWidth: number, plotHeight: number): void;
  abstract drawTooltip(data: any, x: number, y: number): void;
  abstract hideTooltip(): void;

  setTransform(transform: Transform): void {
    this.transform = transform;
  }

  getTransform(): Transform {
    return this.transform;
  }

  applyTransform(point: Point): Point {
    return {
      x: point.x * this.transform.k + this.transform.tx,
      y: point.y * this.transform.k + this.transform.ty
    };
  }

  invertTransform(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.transform.tx) / this.transform.k,
      y: (screenY - this.transform.ty) / this.transform.k
    };
  }

  getElement(): HTMLElement {
    return this.container;
  }
}

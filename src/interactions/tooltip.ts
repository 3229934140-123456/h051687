import { Interaction } from './interaction';
import { Renderer } from '../renderers/renderer';
import { Geometry } from '../geometries/geometry';
import { DataPoint, Point } from '../types';

export interface TooltipData {
  data: DataPoint;
  geometry: Geometry;
  distance: number;
  point: Point;
}

export type TooltipFormatter = (data: TooltipData[]) => any;

export class TooltipInteraction extends Interaction {
  private container: HTMLElement | null = null;
  private geometries: Geometry[] = [];
  private formatter: TooltipFormatter | null = null;
  private searchRadius: number = 30;
  private enabled: boolean = true;
  private onHover?: (data: TooltipData | null) => void;
  private eventHandlers: Map<string, EventListener> = new Map();
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(renderer: Renderer) {
    super(renderer);
  }

  bind(container: HTMLElement): void {
    this.container = container;

    const mousemoveHandler = this.handleMouseMove.bind(this);
    const mouseleaveHandler = this.handleMouseLeave.bind(this);

    container.addEventListener('mousemove', mousemoveHandler);
    container.addEventListener('mouseleave', mouseleaveHandler);

    this.eventHandlers.set('mousemove', mousemoveHandler);
    this.eventHandlers.set('mouseleave', mouseleaveHandler);
  }

  unbind(): void {
    if (!this.container) return;

    this.eventHandlers.forEach((handler, type) => {
      this.container!.removeEventListener(type, handler);
    });

    this.eventHandlers.clear();
    this.container = null;
  }

  setGeometries(geometries: Geometry[]): void {
    this.geometries = geometries;
  }

  setFormatter(formatter: TooltipFormatter | null): void {
    this.formatter = formatter;
  }

  setSearchRadius(radius: number): void {
    this.searchRadius = radius;
  }

  setOnHover(callback: (data: TooltipData | null) => void): void {
    this.onHover = callback;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.enabled || !this.container) return;

    const rect = this.container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    this.lastMousePos = { x: screenX, y: screenY };

    const dataPoint = this.findNearestDataPoint(screenX, screenY);

    if (dataPoint) {
      this.showTooltip(dataPoint, screenX, screenY);

      if (this.onHover) {
        this.onHover(dataPoint);
      }
    } else {
      this.hideTooltip();

      if (this.onHover) {
        this.onHover(null);
      }
    }
  }

  private handleMouseLeave(e: MouseEvent): void {
    this.hideTooltip();

    if (this.onHover) {
      this.onHover(null);
    }
  }

  findNearestDataPoint(screenX: number, screenY: number): TooltipData | null {
    const dataPoint = this.screenToData(screenX, screenY);

    let nearest: TooltipData | null = null;
    let minDist = Infinity;

    for (const geometry of this.geometries) {
      const result = geometry.getNearestDataPoint(
        dataPoint.x,
        dataPoint.y,
        this.searchRadius
      );

      if (result) {
        const point = geometry.getPoints()[result.index];
        if (result.distance < minDist) {
          minDist = result.distance;
          nearest = {
            data: result.data,
            geometry,
            distance: result.distance,
            point
          };
        }
      }
    }

    return nearest;
  }

  findAllDataPointsAtX(screenX: number): TooltipData[] {
    const dataPoint = this.screenToData(screenX, 0);
    const results: TooltipData[] = [];

    for (const geometry of this.geometries) {
      const result = geometry.getYValueAtX(dataPoint.x);
      if (result) {
        const point = geometry.getPoints()[result.index];
        results.push({
          data: result.data,
          geometry,
          distance: 0,
          point
        });
      }
    }

    return results;
  }

  private showTooltip(data: TooltipData, screenX: number, screenY: number): void {
    let displayData: any;

    if (this.formatter) {
      displayData = this.formatter([data]);
    } else {
      displayData = {
        name: data.geometry.getName() || '数据',
        ...data.data
      };
    }

    this.renderer.drawTooltip(displayData, screenX, screenY);
  }

  private hideTooltip(): void {
    this.renderer.hideTooltip();
  }

  showAt(screenX: number, screenY: number): void {
    const data = this.findNearestDataPoint(screenX, screenY);
    if (data) {
      this.showTooltip(data, screenX, screenY);
    }
  }

  hide(): void {
    this.hideTooltip();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.hideTooltip();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export function createTooltipInteraction(renderer: Renderer): TooltipInteraction {
  return new TooltipInteraction(renderer);
}

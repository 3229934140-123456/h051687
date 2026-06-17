import { Renderer } from './renderer';
import { LineGeometry } from '../geometries/line';
import { BarGeometry } from '../geometries/bar';
import { ScatterGeometry } from '../geometries/scatter';
import { AxisGeometry } from '../axes/axis-geometry';
import { LegendItem, Point } from '../types';
import { getTickPoints } from '../axes/axis-geometry';

export class CanvasRenderer extends Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tooltip: HTMLDivElement;
  private devicePixelRatio: number;
  private crosshairVisible: boolean = false;
  private crosshairX: number = 0;
  private crosshairY: number = 0;

  constructor(container: HTMLElement, width: number, height: number) {
    super(container, width, height);

    this.devicePixelRatio = window.devicePixelRatio || 1;

    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';

    this.ctx = this.canvas.getContext('2d')!;

    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      font-family: Arial, sans-serif;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;

    this.resize(width, height);

    container.appendChild(this.canvas);
    container.style.position = 'relative';
    container.appendChild(this.tooltip);
  }

  private applyHiDPI(): void {
    this.ctx.setTransform(
      this.devicePixelRatio, 0,
      0, this.devicePixelRatio,
      0, 0
    );
  }

  clear(): void {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.applyHiDPI();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.applyHiDPI();
  }

  drawLine(line: LineGeometry): void {
    const points = line.getSimplifiedPoints();
    if (points.length < 2) return;

    this.ctx.save();
    this.ctx.strokeStyle = line.getColor();
    this.ctx.lineWidth = 2;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.stroke();

    if (points.length < 100) {
      this.ctx.fillStyle = line.getColor();
      for (const point of points) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  drawBar(bar: BarGeometry): void {
    const primitives = bar.getPrimitives();

    this.ctx.save();

    for (const prim of primitives) {
      if (prim.type === 'rect') {
        this.ctx.fillStyle = prim.color || bar.getColor();
        this.ctx.fillRect(prim.x!, prim.y!, prim.width!, prim.height!);
      }
    }

    this.ctx.restore();
  }

  drawScatter(scatter: ScatterGeometry): void {
    const primitives = scatter.getPrimitives();

    this.ctx.save();

    for (const prim of primitives) {
      if (prim.type === 'circle') {
        this.ctx.fillStyle = (prim.color || scatter.getColor()) + 'b3';
        this.ctx.beginPath();
        this.ctx.arc(prim.x!, prim.y!, prim.radius!, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  drawAxis(axis: AxisGeometry, offsetX: number, offsetY: number): void {
    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(axis.startPoint.x, axis.startPoint.y);
    this.ctx.lineTo(axis.endPoint.x, axis.endPoint.y);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = '#666';
    this.ctx.font = '11px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = axis.position === 'left' || axis.position === 'right' ? 'middle' : 'top';

    for (const tick of axis.ticks) {
      const { line, labelPosition } = getTickPoints(tick, axis);

      this.ctx.beginPath();
      this.ctx.moveTo(line[0].x, line[0].y);
      this.ctx.lineTo(line[1].x, line[1].y);
      this.ctx.stroke();

      this.ctx.fillText(tick.label, labelPosition.x, labelPosition.y);
    }

    if (axis.label) {
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 13px Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      if (axis.position === 'left') {
        this.ctx.save();
        this.ctx.translate(axis.labelPosition.x, axis.labelPosition.y);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText(axis.label, 0, 0);
        this.ctx.restore();
      } else if (axis.position === 'right') {
        this.ctx.save();
        this.ctx.translate(axis.labelPosition.x, axis.labelPosition.y);
        this.ctx.rotate(Math.PI / 2);
        this.ctx.fillText(axis.label, 0, 0);
        this.ctx.restore();
      } else {
        this.ctx.fillText(axis.label, axis.labelPosition.x, axis.labelPosition.y);
      }
    }

    this.ctx.restore();
  }

  drawGrid(axis: AxisGeometry, isVertical: boolean, plotWidth: number, plotHeight: number): void {
    this.ctx.save();
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 0.5;
    this.ctx.setLineDash([2, 2]);

    for (const tick of axis.ticks) {
      if (tick.value === 0 && !isVertical) continue;

      this.ctx.beginPath();
      if (isVertical) {
        this.ctx.moveTo(tick.position, 0);
        this.ctx.lineTo(tick.position, plotHeight);
      } else {
        this.ctx.moveTo(0, tick.position);
        this.ctx.lineTo(plotWidth, tick.position);
      }
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawLegend(items: LegendItem[], x: number, y: number): void {
    this.ctx.save();
    this.ctx.font = '12px Arial, sans-serif';
    this.ctx.textBaseline = 'middle';

    let offsetY = 0;
    for (const item of items) {
      this.ctx.fillStyle = item.color;
      this.ctx.fillRect(x, y + offsetY - 6, 16, 12);

      this.ctx.fillStyle = '#333';
      this.ctx.fillText(item.name, x + 22, y + offsetY);

      offsetY += 20;
    }

    this.ctx.restore();
  }

  drawTitle(title: string, x: number, y: number): void {
    this.ctx.save();
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillStyle = '#333';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(title, x, y);
    this.ctx.restore();
  }

  drawCrosshair(x: number, y: number, plotWidth: number, plotHeight: number): void {
    this.crosshairVisible = true;
    this.crosshairX = x;
    this.crosshairY = y;

    this.ctx.save();
    this.ctx.strokeStyle = '#999';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([3, 3]);

    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, plotHeight);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(plotWidth, y);
    this.ctx.stroke();

    this.ctx.restore();
  }

  hideCrosshair(): void {
    this.crosshairVisible = false;
  }

  drawTooltip(data: any, x: number, y: number): void {
    let html = '<div style="font-weight: bold; margin-bottom: 4px;">' + (data.name || '数据') + '</div>';
    html += '<div style="display: grid; gap: 2px;">';
    for (const key in data) {
      if (key !== 'name') {
        html += `<div><span style="color: #666;">${key}:</span> <span>${data[key]}</span></div>`;
      }
    }
    html += '</div>';

    this.tooltip.innerHTML = html;

    const rect = this.container.getBoundingClientRect();
    let left = x + 15;
    let top = y + 15;

    if (left + this.tooltip.offsetWidth > rect.width) {
      left = x - this.tooltip.offsetWidth - 15;
    }
    if (top + this.tooltip.offsetHeight > rect.height) {
      top = y - this.tooltip.offsetHeight - 15;
    }

    this.tooltip.style.left = left + 'px';
    this.tooltip.style.top = top + 'px';
    this.tooltip.style.opacity = '1';
  }

  hideTooltip(): void {
    this.tooltip.style.opacity = '0';
  }

  getCanvasElement(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  withTransform(callback: () => void): void {
    this.ctx.save();
    callback();
    this.ctx.restore();
  }
}

export function createCanvasRenderer(container: HTMLElement, width: number, height: number): CanvasRenderer {
  return new CanvasRenderer(container, width, height);
}

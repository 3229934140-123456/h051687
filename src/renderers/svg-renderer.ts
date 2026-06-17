import { Renderer } from './renderer';
import { LineGeometry } from '../geometries/line';
import { BarGeometry } from '../geometries/bar';
import { ScatterGeometry } from '../geometries/scatter';
import { AxisGeometry, Tick } from '../axes/axis-geometry';
import { LegendItem, Point } from '../types';
import { getTickPoints } from '../axes/axis-geometry';

export class SvgRenderer extends Renderer {
  private svg: SVGSVGElement;
  private rootGroup: SVGGElement;
  private plotGroup: SVGGElement;
  private axesGroup: SVGGElement;
  private gridGroup: SVGGElement;
  private tooltip: HTMLDivElement;
  private legendGroup: SVGGElement;
  private titleGroup: SVGGElement;
  private crosshairGroup: SVGGElement;

  constructor(container: HTMLElement, width: number, height: number) {
    super(container, width, height);

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', width.toString());
    this.svg.setAttribute('height', height.toString());
    this.svg.style.fontFamily = 'Arial, sans-serif';
    this.svg.style.fontSize = '12px';
    this.svg.style.display = 'block';

    this.rootGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svg.appendChild(this.rootGroup);

    this.gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.gridGroup.setAttribute('class', 'grid');
    this.rootGroup.appendChild(this.gridGroup);

    this.axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.axesGroup.setAttribute('class', 'axes');
    this.rootGroup.appendChild(this.axesGroup);

    this.plotGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.plotGroup.setAttribute('class', 'plots');
    this.rootGroup.appendChild(this.plotGroup);

    this.crosshairGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.crosshairGroup.setAttribute('class', 'crosshair');
    this.rootGroup.appendChild(this.crosshairGroup);

    this.legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.legendGroup.setAttribute('class', 'legend');
    this.rootGroup.appendChild(this.legendGroup);

    this.titleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.titleGroup.setAttribute('class', 'title');
    this.rootGroup.appendChild(this.titleGroup);

    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;

    container.appendChild(this.svg);
    container.style.position = 'relative';
    container.appendChild(this.tooltip);
  }

  clear(): void {
    while (this.plotGroup.firstChild) {
      this.plotGroup.removeChild(this.plotGroup.firstChild);
    }
    while (this.axesGroup.firstChild) {
      this.axesGroup.removeChild(this.axesGroup.firstChild);
    }
    while (this.gridGroup.firstChild) {
      this.gridGroup.removeChild(this.gridGroup.firstChild);
    }
    while (this.legendGroup.firstChild) {
      this.legendGroup.removeChild(this.legendGroup.firstChild);
    }
    while (this.titleGroup.firstChild) {
      this.titleGroup.removeChild(this.titleGroup.firstChild);
    }
    this.hideCrosshair();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.svg.setAttribute('width', width.toString());
    this.svg.setAttribute('height', height.toString());
  }

  drawLine(line: LineGeometry): void {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = line.generatePath();

    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', line.getColor());
    path.setAttribute('stroke-width', '2');
    path.setAttribute('vector-effect', 'non-scaling-stroke');

    this.plotGroup.appendChild(path);

    const points = line.getSimplifiedPoints();
    if (points.length < 50) {
      points.forEach((point, i) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x.toString());
        circle.setAttribute('cy', point.y.toString());
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', line.getColor());
        circle.setAttribute('data-index', i.toString());
        this.plotGroup.appendChild(circle);
      });
    }
  }

  drawBar(bar: BarGeometry): void {
    const primitives = bar.getPrimitives();

    primitives.forEach((prim, i) => {
      if (prim.type === 'rect') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', prim.x!.toString());
        rect.setAttribute('y', prim.y!.toString());
        rect.setAttribute('width', prim.width!.toString());
        rect.setAttribute('height', prim.height!.toString());
        rect.setAttribute('fill', prim.color || bar.getColor());
        rect.setAttribute('data-index', i.toString());
        this.plotGroup.appendChild(rect);
      }
    });
  }

  drawScatter(scatter: ScatterGeometry): void {
    const primitives = scatter.getPrimitives();

    primitives.forEach((prim, i) => {
      if (prim.type === 'circle') {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', prim.x!.toString());
        circle.setAttribute('cy', prim.y!.toString());
        circle.setAttribute('r', prim.radius!.toString());
        circle.setAttribute('fill', prim.color || scatter.getColor());
        circle.setAttribute('fill-opacity', '0.7');
        circle.setAttribute('data-index', i.toString());
        this.plotGroup.appendChild(circle);
      }
    });
  }

  drawAxis(axis: AxisGeometry, offsetX: number, offsetY: number): void {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${offsetX}, ${offsetY})`);

    const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${axis.startPoint.x} ${axis.startPoint.y} L ${axis.endPoint.x} ${axis.endPoint.y}`;
    axisLine.setAttribute('d', d);
    axisLine.setAttribute('stroke', '#333');
    axisLine.setAttribute('stroke-width', '1.5');
    g.appendChild(axisLine);

    axis.ticks.forEach(tick => {
      const { line, labelPosition } = getTickPoints(tick, axis);

      const tickLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const tickD = `M ${line[0].x} ${line[0].y} L ${line[1].x} ${line[1].y}`;
      tickLine.setAttribute('d', tickD);
      tickLine.setAttribute('stroke', '#333');
      tickLine.setAttribute('stroke-width', '1');
      g.appendChild(tickLine);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', labelPosition.x.toString());
      label.setAttribute('y', labelPosition.y.toString());
      label.setAttribute('text-anchor', axis.position === 'left' || axis.position === 'right' ? 'middle' : 'middle');
      label.setAttribute('dominant-baseline', axis.position === 'left' ? 'middle' : axis.position === 'right' ? 'middle' : 'hanging');
      label.setAttribute('fill', '#666');
      label.setAttribute('font-size', '11');
      label.textContent = tick.label;
      g.appendChild(label);
    });

    if (axis.label) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', axis.labelPosition.x.toString());
      label.setAttribute('y', axis.labelPosition.y.toString());
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('fill', '#333');
      label.setAttribute('font-size', '13');
      label.setAttribute('font-weight', 'bold');
      if (axis.position === 'left') {
        label.setAttribute('transform', `rotate(-90 ${axis.labelPosition.x} ${axis.labelPosition.y})`);
      } else if (axis.position === 'right') {
        label.setAttribute('transform', `rotate(90 ${axis.labelPosition.x} ${axis.labelPosition.y})`);
      }
      label.textContent = axis.label;
      g.appendChild(label);
    }

    this.axesGroup.appendChild(g);
  }

  drawGrid(axis: AxisGeometry, isVertical: boolean, plotWidth: number, plotHeight: number): void {
    axis.ticks.forEach(tick => {
      if (tick.value === 0 && !isVertical) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', '#e0e0e0');
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('stroke-dasharray', '2,2');

      if (isVertical) {
        line.setAttribute('x1', tick.position.toString());
        line.setAttribute('y1', '0');
        line.setAttribute('x2', tick.position.toString());
        line.setAttribute('y2', plotHeight.toString());
      } else {
        line.setAttribute('x1', '0');
        line.setAttribute('y1', tick.position.toString());
        line.setAttribute('x2', plotWidth.toString());
        line.setAttribute('y2', tick.position.toString());
      }

      this.gridGroup.appendChild(line);
    });
  }

  drawLegend(items: LegendItem[], x: number, y: number): void {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);

    let offsetY = 0;
    items.forEach((item, i) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', offsetY.toString());
      rect.setAttribute('width', '16');
      rect.setAttribute('height', '12');
      rect.setAttribute('fill', item.color);
      g.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '22');
      text.setAttribute('y', (offsetY + 10).toString());
      text.setAttribute('fill', '#333');
      text.setAttribute('font-size', '12');
      text.textContent = item.name;
      g.appendChild(text);

      offsetY += 20;
    });

    this.legendGroup.appendChild(g);
  }

  drawTitle(title: string, x: number, y: number): void {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x.toString());
    text.setAttribute('y', y.toString());
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#333');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', 'bold');
    text.textContent = title;
    this.titleGroup.appendChild(text);
  }

  drawCrosshair(x: number, y: number, plotWidth: number, plotHeight: number): void {
    this.hideCrosshair();

    const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    vLine.setAttribute('x1', x.toString());
    vLine.setAttribute('y1', '0');
    vLine.setAttribute('x2', x.toString());
    vLine.setAttribute('y2', plotHeight.toString());
    vLine.setAttribute('stroke', '#999');
    vLine.setAttribute('stroke-width', '1');
    vLine.setAttribute('stroke-dasharray', '3,3');
    this.crosshairGroup.appendChild(vLine);

    const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hLine.setAttribute('x1', '0');
    hLine.setAttribute('y1', y.toString());
    hLine.setAttribute('x2', plotWidth.toString());
    hLine.setAttribute('y2', y.toString());
    hLine.setAttribute('stroke', '#999');
    hLine.setAttribute('stroke-width', '1');
    hLine.setAttribute('stroke-dasharray', '3,3');
    this.crosshairGroup.appendChild(hLine);
  }

  hideCrosshair(): void {
    while (this.crosshairGroup.firstChild) {
      this.crosshairGroup.removeChild(this.crosshairGroup.firstChild);
    }
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

  setPlotTransform(transform: { x: number; y: number; scale: number }): void {
    this.plotGroup.setAttribute('transform', `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`);
    this.gridGroup.setAttribute('transform', `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`);
    this.crosshairGroup.setAttribute('transform', `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`);
  }

  getSvgElement(): SVGSVGElement {
    return this.svg;
  }
}

export function createSvgRenderer(container: HTMLElement, width: number, height: number): SvgRenderer {
  return new SvgRenderer(container, width, height);
}

import { Interaction, InteractionOptions } from './interaction';
import { Renderer } from '../renderers/renderer';
import { Transform } from '../types';

export class ZoomInteraction extends Interaction {
  private container: HTMLElement | null = null;
  private isPanning: boolean = false;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private options: Required<InteractionOptions>;
  private eventHandlers: Map<string, EventListener> = new Map();

  constructor(renderer: Renderer, options: InteractionOptions = {}) {
    super(renderer);
    this.options = {
      zoom: true,
      pan: true,
      tooltip: true,
      zoomExtent: [0.1, 10],
      ...options
    };
  }

  bind(container: HTMLElement): void {
    this.container = container;

    const wheelHandler = this.handleWheel.bind(this);
    const mousedownHandler = this.handleMouseDown.bind(this);
    const mousemoveHandler = this.handleMouseMove.bind(this);
    const mouseupHandler = this.handleMouseUp.bind(this);
    const mouseleaveHandler = this.handleMouseLeave.bind(this);
    const dblclickHandler = this.handleDoubleClick.bind(this);

    container.addEventListener('wheel', wheelHandler, { passive: false });
    container.addEventListener('mousedown', mousedownHandler);
    container.addEventListener('mousemove', mousemoveHandler);
    container.addEventListener('mouseup', mouseupHandler);
    container.addEventListener('mouseleave', mouseleaveHandler);
    container.addEventListener('dblclick', dblclickHandler);

    this.eventHandlers.set('wheel', wheelHandler);
    this.eventHandlers.set('mousedown', mousedownHandler);
    this.eventHandlers.set('mousemove', mousemoveHandler);
    this.eventHandlers.set('mouseup', mouseupHandler);
    this.eventHandlers.set('mouseleave', mouseleaveHandler);
    this.eventHandlers.set('dblclick', dblclickHandler);
  }

  unbind(): void {
    if (!this.container) return;

    this.eventHandlers.forEach((handler, type) => {
      this.container!.removeEventListener(type, handler);
    });

    this.eventHandlers.clear();
    this.container = null;
  }

  private handleWheel(e: WheelEvent): void {
    if (!this.enabled || !this.options.zoom || !this.container) return;

    e.preventDefault();

    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoomAt(mouseX, mouseY, delta);
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.enabled || !this.options.pan) return;

    this.isPanning = true;
    this.lastMousePos = { x: e.clientX, y: e.clientY };

    if (this.container) {
      this.container.style.cursor = 'grabbing';
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.enabled || !this.options.pan || !this.isPanning) return;

    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;

    this.lastMousePos = { x: e.clientX, y: e.clientY };

    this.pan(dx, dy);
  }

  private handleMouseUp(e: MouseEvent): void {
    this.isPanning = false;

    if (this.container) {
      this.container.style.cursor = 'default';
    }
  }

  private handleMouseLeave(e: MouseEvent): void {
    this.isPanning = false;

    if (this.container) {
      this.container.style.cursor = 'default';
    }
  }

  private handleDoubleClick(e: MouseEvent): void {
    if (!this.enabled) return;
    this.resetTransform();
  }

  zoomAt(screenX: number, screenY: number, scale: number): void {
    const [minZoom, maxZoom] = this.options.zoomExtent;
    const newK = Math.max(minZoom, Math.min(maxZoom, this.transform.k * scale));

    if (newK === this.transform.k) return;

    const dataPoint = this.screenToData(screenX, screenY);

    const actualScale = newK / this.transform.k;
    const newTx = screenX - dataPoint.x * newK;
    const newTy = screenY - dataPoint.y * newK;

    this.setTransform({
      k: newK,
      tx: newTx,
      ty: newTy
    });
  }

  pan(dx: number, dy: number): void {
    this.setTransform({
      ...this.transform,
      tx: this.transform.tx + dx,
      ty: this.transform.ty + dy
    });
  }

  scaleBy(factor: number): void {
    const [minZoom, maxZoom] = this.options.zoomExtent;
    const newK = Math.max(minZoom, Math.min(maxZoom, this.transform.k * factor));

    this.setTransform({
      ...this.transform,
      k: newK
    });
  }

  translateBy(dx: number, dy: number): void {
    this.setTransform({
      ...this.transform,
      tx: this.transform.tx + dx,
      ty: this.transform.ty + dy
    });
  }

  setZoomExtent(extent: [number, number]): void {
    this.options.zoomExtent = extent;
  }

  setZoomEnabled(enabled: boolean): void {
    this.options.zoom = enabled;
  }

  setPanEnabled(enabled: boolean): void {
    this.options.pan = enabled;
  }
}

export function createZoomInteraction(
  renderer: Renderer,
  options?: InteractionOptions
): ZoomInteraction {
  return new ZoomInteraction(renderer, options);
}

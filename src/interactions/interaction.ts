import { Renderer } from '../renderers/renderer';
import { Transform, Point } from '../types';

export interface InteractionOptions {
  zoom?: boolean;
  pan?: boolean;
  tooltip?: boolean;
  zoomExtent?: [number, number];
}

export abstract class Interaction {
  protected renderer: Renderer;
  protected enabled: boolean = true;
  protected transform: Transform = { k: 1, tx: 0, ty: 0 };
  protected onTransformChange?: (transform: Transform) => void;
  private plotOffset: { left: number; top: number } = { left: 0, top: 0 };

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  abstract bind(container: HTMLElement): void;
  abstract unbind(): void;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getTransform(): Transform {
    return { ...this.transform };
  }

  setTransform(transform: Transform): void {
    this.transform = { ...transform };
    this.renderer.setTransform(this.transform);
    if (this.onTransformChange) {
      this.onTransformChange(this.transform);
    }
  }

  setOnTransformChange(callback: (transform: Transform) => void): void {
    this.onTransformChange = callback;
  }

  resetTransform(): void {
    this.transform = { k: 1, tx: 0, ty: 0 };
    this.renderer.setTransform(this.transform);
    if (this.onTransformChange) {
      this.onTransformChange(this.transform);
    }
  }

  setPlotOffset(left: number, top: number): void {
    this.plotOffset = { left, top };
  }

  getPlotOffset(): { left: number; top: number } {
    return { ...this.plotOffset };
  }

  screenToData(screenX: number, screenY: number): Point {
    const plotX = screenX - this.plotOffset.left;
    const plotY = screenY - this.plotOffset.top;
    return {
      x: (plotX - this.transform.tx) / this.transform.k,
      y: (plotY - this.transform.ty) / this.transform.k
    };
  }

  dataToScreen(dataX: number, dataY: number): Point {
    return {
      x: dataX * this.transform.k + this.transform.tx + this.plotOffset.left,
      y: dataY * this.transform.k + this.transform.ty + this.plotOffset.top
    };
  }
}

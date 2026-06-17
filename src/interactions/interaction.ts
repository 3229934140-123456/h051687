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

  screenToData(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.transform.tx) / this.transform.k,
      y: (screenY - this.transform.ty) / this.transform.k
    };
  }

  dataToScreen(dataX: number, dataY: number): Point {
    return {
      x: dataX * this.transform.k + this.transform.tx,
      y: dataY * this.transform.k + this.transform.ty
    };
  }
}

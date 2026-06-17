import { AxisConfig, Scale } from '../types';
import { AxisGeometry, calculateAxisGeometry, getTickPoints, generateAxisPath } from './axis-geometry';

export class Axis {
  private config: AxisConfig;
  private geometry: AxisGeometry | null = null;

  constructor(config: AxisConfig) {
    this.config = { ...config };
  }

  update(plotWidth: number, plotHeight: number): void {
    this.geometry = calculateAxisGeometry(this.config, plotWidth, plotHeight);
  }

  getGeometry(): AxisGeometry {
    if (!this.geometry) {
      throw new Error('Axis not updated. Call update() first.');
    }
    return this.geometry;
  }

  getPath(): string {
    if (!this.geometry) return '';
    return generateAxisPath(this.geometry);
  }

  getTickPoints(): Array<{
    line: [{ x: number; y: number }, { x: number; y: number }];
    labelPosition: { x: number; y: number };
    label: string;
  }> {
    if (!this.geometry) return [];

    return this.geometry.ticks.map(tick => {
      const { line, labelPosition } = getTickPoints(tick, this.geometry!);
      return {
        line: [{ x: line[0].x, y: line[0].y }, { x: line[1].x, y: line[1].y }],
        labelPosition: { x: labelPosition.x, y: labelPosition.y },
        label: tick.label
      };
    });
  }

  setScale(scale: Scale): void {
    this.config.scale = scale;
  }

  getScale(): Scale {
    return this.config.scale;
  }

  setPosition(position: 'top' | 'bottom' | 'left' | 'right'): void {
    this.config.position = position;
  }

  setLabel(label: string): void {
    this.config.label = label;
  }

  setTickCount(count: number): void {
    this.config.tickCount = count;
  }

  setTickFormat(format: (value: number | string) => string): void {
    this.config.tickFormat = format;
  }
}

export function createAxis(config: AxisConfig): Axis {
  return new Axis(config);
}

export type ScaleType = 'linear' | 'log' | 'ordinal';

export interface Scale {
  type: ScaleType;
  domain: [number, number] | string[];
  range: [number, number];
  (value: number | string): number;
  invert(pixel: number): number | string;
  ticks(count?: number): (number | string)[];
  nice(): Scale;
}

export interface Point {
  x: number;
  y: number;
}

export interface DataPoint {
  x: number | string;
  y: number;
  [key: string]: any;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartSize {
  width: number;
  height: number;
}

export interface AxisConfig {
  position: 'top' | 'bottom' | 'left' | 'right';
  scale: Scale;
  label?: string;
  tickCount?: number;
  tickFormat?: (value: number | string) => string;
}

export type ChartType = 'line' | 'bar' | 'scatter';

export interface ChartConfig {
  type: ChartType;
  data: DataPoint[];
  xField: string;
  yField: string;
  color?: string;
  name?: string;
}

export interface GeometryPrimitive {
  type: 'line' | 'rect' | 'circle' | 'path';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: Point[];
  color?: string;
  data?: DataPoint;
}

export interface Transform {
  k: number;
  tx: number;
  ty: number;
}

export interface TooltipData {
  x: number;
  y: number;
  data: DataPoint;
  chartName: string;
}

export interface LegendItem {
  name: string;
  color: string;
}

export type RendererType = 'svg' | 'canvas';

export interface ChartOptions {
  renderer: RendererType;
  width: number;
  height: number;
  margin: Margin;
  xScaleType: ScaleType;
  yScaleType: ScaleType;
  title?: string;
  showLegend?: boolean;
  tooltip?: boolean;
  zoom?: boolean;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

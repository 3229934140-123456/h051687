import {
  ChartConfig,
  ChartOptions,
  Scale,
  AxisConfig,
  DataPoint,
  Margin,
  LegendItem,
  ScaleType,
  RendererType
} from './types';

import { createLinearScale, createLogScale, createOrdinalScale } from './scales';
import { createAxis, Axis } from './axes';
import { createLineGeometry, createBarGeometry, createScatterGeometry, Geometry, LineGeometry, BarGeometry, ScatterGeometry } from './geometries';
import { createSvgRenderer, createCanvasRenderer, Renderer } from './renderers';
import { createZoomInteraction, createTooltipInteraction, ZoomInteraction, TooltipInteraction } from './interactions';
import { createLayout, Layout, LayoutResult } from './layout';
import { extent, unique, isNumber, isString, generateColors, getDataBounds, rdpSimplify } from './utils';

export class Chart {
  private container: HTMLElement;
  private options: ChartOptions;
  private layout: Layout;
  private renderer: Renderer;
  private xScale: Scale | null = null;
  private yScale: Scale | null = null;
  private xAxis: Axis | null = null;
  private yAxis: Axis | null = null;
  private geometries: Geometry[] = [];
  private chartConfigs: ChartConfig[] = [];
  private zoomInteraction: ZoomInteraction | null = null;
  private tooltipInteraction: TooltipInteraction | null = null;
  private layoutResult: LayoutResult | null = null;
  private legendItems: LegendItem[] = [];
  private originalXDomain: [number, number] | string[] | null = null;
  private originalYDomain: [number, number] | string[] | null = null;
  private isOrdinalX: boolean = false;

  constructor(container: HTMLElement, options: Partial<ChartOptions> = {}) {
    this.container = container;

    this.options = {
      renderer: 'svg',
      width: 800,
      height: 500,
      margin: { top: 40, right: 60, bottom: 60, left: 60 },
      xScaleType: 'linear',
      yScaleType: 'linear',
      title: '',
      showLegend: true,
      tooltip: true,
      zoom: true,
      ...options
    };

    this.layout = createLayout({
      margin: this.options.margin,
      showLegend: this.options.showLegend,
      legendPosition: 'right'
    });

    this.renderer = this.options.renderer === 'canvas'
      ? createCanvasRenderer(container, this.options.width, this.options.height)
      : createSvgRenderer(container, this.options.width, this.options.height);

    this.initInteractions();
  }

  private initInteractions(): void {
    if (this.options.zoom) {
      this.zoomInteraction = createZoomInteraction(this.renderer, {
        zoom: true,
        pan: true,
        zoomExtent: [0.1, 10]
      });
      this.zoomInteraction.bind(this.container);
      this.zoomInteraction.setOnTransformChange(() => this.render());
    }

    if (this.options.tooltip) {
      this.tooltipInteraction = createTooltipInteraction(this.renderer);
      this.tooltipInteraction.bind(this.container);
    }
  }

  private syncPlotOffset(): void {
    if (!this.layoutResult) return;
    const { plotLeft, plotTop } = this.layoutResult;
    if (this.zoomInteraction) {
      this.zoomInteraction.setPlotOffset(plotLeft, plotTop);
    }
    if (this.tooltipInteraction) {
      this.tooltipInteraction.setPlotOffset(plotLeft, plotTop);
    }
  }

  setData(configs: ChartConfig | ChartConfig[]): void {
    this.chartConfigs = Array.isArray(configs) ? configs : [configs];

    const colors = generateColors(this.chartConfigs.length);
    this.chartConfigs.forEach((config, i) => {
      if (!config.color) {
        config.color = colors[i];
      }
      if (!config.name) {
        config.name = `系列 ${i + 1}`;
      }
    });

    this.legendItems = this.chartConfigs.map(c => ({
      name: c.name!,
      color: c.color!
    }));

    this.isOrdinalX = this.detectOrdinalX();

    this.createScales();
    this.createAxes();
    this.createGeometries();

    if (this.tooltipInteraction) {
      this.tooltipInteraction.setGeometries(this.geometries);
    }

    this.updateLayout();

    if (this.zoomInteraction) {
      this.zoomInteraction.resetTransform();
    }
  }

  private detectOrdinalX(): boolean {
    if (!this.chartConfigs.length) return false;
    const xField = this.chartConfigs[0].xField;
    const sample = this.chartConfigs[0].data.slice(0, 5);
    return sample.some(d => typeof d[xField] === 'string');
  }

  private createScales(): void {
    const allData = this.chartConfigs.flatMap(c => c.data);
    const xValues = allData.map(d => d[this.chartConfigs[0].xField]);
    const yValues = allData.map(d => d[this.chartConfigs[0].yField]);

    if (this.isOrdinalX) {
      const domain = unique(xValues).map(v => v.toString());
      this.xScale = createOrdinalScale(domain);
    } else {
      const numericXValues = xValues.filter(isNumber) as number[];
      const bounds = extent(numericXValues);
      this.xScale = this.createSafeScale(this.options.xScaleType, bounds);
    }

    const numericYValues = yValues.filter(isNumber) as number[];
    const yBounds = extent(numericYValues);
    this.yScale = this.createSafeScale(this.options.yScaleType, yBounds);

    this.xScale.nice();
    this.yScale.nice();

    this.originalXDomain = [...this.xScale.domain] as [number, number] | string[];
    this.originalYDomain = [...this.yScale.domain] as [number, number] | string[];
  }

  private createSafeScale(type: ScaleType, bounds: [number, number]): Scale {
    if (type === 'log') {
      if (bounds[0] <= 0 || bounds[1] <= 0 || !isFinite(bounds[0]) || !isFinite(bounds[1])) {
        return createLinearScale(bounds);
      }
      return createLogScale(bounds);
    }
    return createLinearScale(bounds);
  }

  private createAxes(): void {
    if (!this.xScale || !this.yScale) return;

    this.xAxis = createAxis({
      position: 'bottom',
      scale: this.xScale,
      label: this.chartConfigs[0]?.xField || 'X'
    });

    this.yAxis = createAxis({
      position: 'left',
      scale: this.yScale,
      label: this.chartConfigs[0]?.yField || 'Y'
    });
  }

  private createGeometries(): void {
    if (!this.xScale || !this.yScale) return;

    this.geometries = this.chartConfigs.map(config => {
      const { type, data, xField, yField, color, name } = config;

      let geometry: Geometry;
      switch (type) {
        case 'line':
          geometry = createLineGeometry(data, xField, yField, this.xScale!, this.yScale!, color, name);
          (geometry as LineGeometry).setSmooth(true);
          break;
        case 'bar':
          geometry = createBarGeometry(data, xField, yField, this.xScale!, this.yScale!, color, name);
          break;
        case 'scatter':
          geometry = createScatterGeometry(data, xField, yField, this.xScale!, this.yScale!, color, name);
          (geometry as ScatterGeometry).setRadius(5);
          break;
        default:
          geometry = createLineGeometry(data, xField, yField, this.xScale!, this.yScale!, color, name);
      }

      return geometry;
    });
  }

  private updateLayout(): void {
    this.layoutResult = this.layout.calculate(
      this.options.width,
      this.options.height,
      this.legendItems
    );

    if (this.xScale && this.yScale && this.layoutResult) {
      const { plotWidth, plotHeight } = this.layoutResult;

      if (this.xScale.type !== 'ordinal') {
        (this.xScale as any).range = [0, plotWidth];
      } else {
        (this.xScale as any).range = [20, plotWidth - 20];
      }

      (this.yScale as any).range = [plotHeight, 0];
    }

    if (this.xAxis && this.yAxis && this.layoutResult) {
      this.xAxis.update(this.layoutResult.plotWidth, this.layoutResult.plotHeight);
      this.yAxis.update(this.layoutResult.plotWidth, this.layoutResult.plotHeight);
    }

    this.geometries.forEach(g => {
      g.setScales(this.xScale!, this.yScale!);
      g.update();
    });

    this.syncPlotOffset();
  }

  render(): void {
    if (!this.layoutResult) {
      this.updateLayout();
    }

    this.renderer.clear();

    const { plotLeft, plotTop, plotWidth, plotHeight, legendPosition, titlePosition } = this.layoutResult!;
    const zoomTransform = this.zoomInteraction ? this.zoomInteraction.getTransform() : { k: 1, tx: 0, ty: 0 };

    if (this.options.title && titlePosition) {
      this.renderer.drawTitle(this.options.title, titlePosition.x, titlePosition.y);
    }

    const renderGridAndContent = () => {
      if (this.xAxis) {
        this.renderer.drawGrid(this.xAxis.getGeometry(), true, plotWidth, plotHeight);
      }

      if (this.yAxis) {
        this.renderer.drawGrid(this.yAxis.getGeometry(), false, plotWidth, plotHeight);
      }

      this.geometries.forEach(geometry => {
        geometry.update();

        if (geometry instanceof LineGeometry) {
          this.renderer.drawLine(geometry);
        } else if (geometry instanceof BarGeometry) {
          this.renderer.drawBar(geometry);
        } else if (geometry instanceof ScatterGeometry) {
          this.renderer.drawScatter(geometry);
        }
      });
    };

    if (this.options.renderer === 'svg') {
      const svgRenderer = this.renderer as any;
      svgRenderer.setPlotTransform({
        x: plotLeft + zoomTransform.tx,
        y: plotTop + zoomTransform.ty,
        scale: zoomTransform.k
      });
      renderGridAndContent();
    } else {
      const canvasRenderer = this.renderer as any;
      canvasRenderer.withTransform(() => {
        canvasRenderer.ctx.translate(plotLeft + zoomTransform.tx, plotTop + zoomTransform.ty);
        canvasRenderer.ctx.scale(zoomTransform.k, zoomTransform.k);
        renderGridAndContent();
      });
    }

    if (this.xAxis) {
      this.renderer.drawAxis(this.xAxis.getGeometry(), plotLeft, plotTop);
    }

    if (this.yAxis) {
      this.renderer.drawAxis(this.yAxis.getGeometry(), plotLeft, plotTop);
    }

    if (legendPosition && this.legendItems.length > 0) {
      this.renderer.drawLegend(this.legendItems, legendPosition.x, legendPosition.y);
    }
  }

  updateXScaleType(type: ScaleType): void {
    if (this.isOrdinalX && type !== 'ordinal') {
      return;
    }
    if (!this.isOrdinalX) {
      this.options.xScaleType = type;
    }
    this.createScales();
    this.createAxes();
    this.createGeometries();
    this.updateLayout();
    if (this.zoomInteraction) {
      this.zoomInteraction.resetTransform();
    }
    this.render();
  }

  updateYScaleType(type: ScaleType): void {
    this.options.yScaleType = type;
    this.createScales();
    this.createAxes();
    this.createGeometries();
    this.updateLayout();
    if (this.zoomInteraction) {
      this.zoomInteraction.resetTransform();
    }
    this.render();
  }

  setRendererType(type: RendererType): void {
    if (this.options.renderer === type) return;

    this.options.renderer = type;
    const currentTransform = this.zoomInteraction?.getTransform();

    if (this.zoomInteraction) {
      this.zoomInteraction.unbind();
    }
    if (this.tooltipInteraction) {
      this.tooltipInteraction.unbind();
    }

    this.container.innerHTML = '';

    this.renderer = type === 'canvas'
      ? createCanvasRenderer(this.container, this.options.width, this.options.height)
      : createSvgRenderer(this.container, this.options.width, this.options.height);

    this.initInteractions();

    if (currentTransform) {
      this.zoomInteraction?.setTransform(currentTransform);
    }

    if (this.tooltipInteraction && this.geometries.length > 0) {
      this.tooltipInteraction.setGeometries(this.geometries);
    }

    this.syncPlotOffset();
    this.render();
  }

  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    this.renderer.resize(width, height);
    this.updateLayout();
    this.render();
  }

  zoomTo(factor: number): void {
    if (this.zoomInteraction) {
      this.zoomInteraction.scaleBy(factor);
    }
  }

  panTo(dx: number, dy: number): void {
    if (this.zoomInteraction) {
      this.zoomInteraction.translateBy(dx, dy);
    }
  }

  resetZoom(): void {
    if (this.zoomInteraction) {
      this.zoomInteraction.resetTransform();
    }

    if (this.originalXDomain && this.xScale) {
      (this.xScale as any).domain = [...this.originalXDomain];
    }
    if (this.originalYDomain && this.yScale) {
      (this.yScale as any).domain = [...this.originalYDomain];
    }

    this.render();
  }

  setTooltipFormatter(formatter: any): void {
    if (this.tooltipInteraction) {
      this.tooltipInteraction.setFormatter(formatter);
    }
  }

  showTooltip(x: number, y: number): void {
    if (this.tooltipInteraction) {
      this.tooltipInteraction.showAt(x, y);
    }
  }

  hideTooltip(): void {
    if (this.tooltipInteraction) {
      this.tooltipInteraction.hide();
    }
  }

  setMargin(margin: Partial<Margin>): void {
    this.layout.setMargin(margin);
    this.updateLayout();
    this.render();
  }

  setTitle(title: string): void {
    this.options.title = title;
    this.render();
  }

  showLegend(show: boolean): void {
    this.options.showLegend = show;
    this.layout.setShowLegend(show);
    this.updateLayout();
    this.render();
  }

  setLegendPosition(position: 'top' | 'bottom' | 'left' | 'right'): void {
    this.layout.setLegendPosition(position);
    this.updateLayout();
    this.render();
  }

  getGeometries(): Geometry[] {
    return this.geometries;
  }

  getXScale(): Scale | null {
    return this.xScale;
  }

  getYScale(): Scale | null {
    return this.yScale;
  }

  getRenderer(): Renderer {
    return this.renderer;
  }

  getIsOrdinalX(): boolean {
    return this.isOrdinalX;
  }

  destroy(): void {
    if (this.zoomInteraction) {
      this.zoomInteraction.unbind();
    }
    if (this.tooltipInteraction) {
      this.tooltipInteraction.unbind();
    }
    this.container.innerHTML = '';
  }
}

export function createChart(container: HTMLElement, options?: Partial<ChartOptions>): Chart {
  return new Chart(container, options);
}

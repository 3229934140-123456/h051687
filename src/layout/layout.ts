import { Margin, LegendItem, ChartSize } from '../types';

export interface LayoutResult {
  plotWidth: number;
  plotHeight: number;
  plotLeft: number;
  plotTop: number;
  margin: Margin;
  legendPosition: { x: number; y: number } | null;
  titlePosition: { x: number; y: number } | null;
}

export interface LayoutOptions {
  margin?: Partial<Margin>;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  showTitle?: boolean;
  titlePadding?: number;
  legendPadding?: number;
}

export class Layout {
  private options: Required<Omit<LayoutOptions, 'margin'>> & { margin: Margin };

  constructor(options: LayoutOptions = {}) {
    this.options = {
      margin: {
        top: 40,
        right: 60,
        bottom: 60,
        left: 60,
        ...(options.margin || {})
      },
      showLegend: options.showLegend ?? true,
      legendPosition: options.legendPosition ?? 'right',
      showTitle: options.showTitle ?? true,
      titlePadding: options.titlePadding ?? 20,
      legendPadding: options.legendPadding ?? 20
    };
  }

  calculate(
    totalWidth: number,
    totalHeight: number,
    legendItems: LegendItem[] = []
  ): LayoutResult {
    const { margin, showLegend, legendPosition, showTitle, titlePadding, legendPadding } = this.options;

    let adjustedMargin = { ...margin };
    let legendPositionResult: { x: number; y: number } | null = null;
    let titlePosition: { x: number; y: number } | null = null;

    if (showTitle) {
      titlePosition = {
        x: totalWidth / 2,
        y: 15
      };
      adjustedMargin.top = Math.max(adjustedMargin.top, 45);
    }

    if (showLegend && legendItems.length > 0) {
      const legendWidth = this.estimateLegendWidth(legendItems);
      const legendHeight = this.estimateLegendHeight(legendItems);

      switch (legendPosition) {
        case 'top':
          adjustedMargin.top += legendHeight + legendPadding;
          legendPositionResult = {
            x: (totalWidth - legendWidth) / 2,
            y: (showTitle ? 35 : 10)
          };
          break;
        case 'bottom':
          adjustedMargin.bottom += legendHeight + legendPadding;
          legendPositionResult = {
            x: (totalWidth - legendWidth) / 2,
            y: totalHeight - legendHeight - 10
          };
          break;
        case 'left':
          adjustedMargin.left += legendWidth + legendPadding;
          legendPositionResult = {
            x: 10,
            y: (totalHeight - legendHeight) / 2
          };
          break;
        case 'right':
        default:
          adjustedMargin.right += legendWidth + legendPadding;
          legendPositionResult = {
            x: totalWidth - legendWidth - 10,
            y: (totalHeight - legendHeight) / 2
          };
          break;
      }
    }

    const plotWidth = totalWidth - adjustedMargin.left - adjustedMargin.right;
    const plotHeight = totalHeight - adjustedMargin.top - adjustedMargin.bottom;
    const plotLeft = adjustedMargin.left;
    const plotTop = adjustedMargin.top;

    return {
      plotWidth,
      plotHeight,
      plotLeft,
      plotTop,
      margin: adjustedMargin,
      legendPosition: legendPositionResult,
      titlePosition
    };
  }

  private estimateLegendWidth(items: LegendItem[]): number {
    let maxWidth = 0;
    for (const item of items) {
      const textWidth = item.name.length * 12;
      const totalWidth = 16 + 6 + textWidth;
      maxWidth = Math.max(maxWidth, totalWidth);
    }
    return maxWidth + 10;
  }

  private estimateLegendHeight(items: LegendItem[]): number {
    return items.length * 20 + 10;
  }

  setMargin(margin: Partial<Margin>): void {
    this.options.margin = { ...this.options.margin, ...margin };
  }

  getMargin(): Margin {
    return { ...this.options.margin };
  }

  setShowLegend(show: boolean): void {
    this.options.showLegend = show;
  }

  setLegendPosition(position: 'top' | 'bottom' | 'left' | 'right'): void {
    this.options.legendPosition = position;
  }

  setShowTitle(show: boolean): void {
    this.options.showTitle = show;
  }
}

export function createLayout(options?: LayoutOptions): Layout {
  return new Layout(options);
}

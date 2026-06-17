import { Scale, AxisConfig, Point } from '../types';

export interface Tick {
  value: number | string;
  position: number;
  label: string;
}

export interface AxisGeometry {
  position: 'top' | 'bottom' | 'left' | 'right';
  ticks: Tick[];
  startPoint: Point;
  endPoint: Point;
  label?: string;
  labelPosition: Point;
  tickLength: number;
  scale: Scale;
}

export function calculateAxisGeometry(
  config: AxisConfig,
  plotWidth: number,
  plotHeight: number
): AxisGeometry {
  const { position, scale, label, tickCount = 10, tickFormat } = config;

  const tickValues = scale.ticks(tickCount);

  const ticks: Tick[] = tickValues.map(value => {
    const position = scale(value);
    const formattedLabel = tickFormat
      ? tickFormat(value)
      : typeof value === 'number'
        ? formatTickLabel(value)
        : value.toString();

    return { value, position, label: formattedLabel };
  });

  let startPoint: Point;
  let endPoint: Point;
  let labelPosition: Point;
  const tickLength = 6;

  switch (position) {
    case 'top':
      startPoint = { x: 0, y: 0 };
      endPoint = { x: plotWidth, y: 0 };
      labelPosition = { x: plotWidth / 2, y: -35 };
      break;
    case 'bottom':
      startPoint = { x: 0, y: plotHeight };
      endPoint = { x: plotWidth, y: plotHeight };
      labelPosition = { x: plotWidth / 2, y: plotHeight + 35 };
      break;
    case 'left':
      startPoint = { x: 0, y: plotHeight };
      endPoint = { x: 0, y: 0 };
      labelPosition = { x: -40, y: plotHeight / 2 };
      break;
    case 'right':
      startPoint = { x: plotWidth, y: plotHeight };
      endPoint = { x: plotWidth, y: 0 };
      labelPosition = { x: plotWidth + 40, y: plotHeight / 2 };
      break;
    default:
      startPoint = { x: 0, y: plotHeight };
      endPoint = { x: plotWidth, y: plotHeight };
      labelPosition = { x: plotWidth / 2, y: plotHeight + 35 };
  }

  return {
    position,
    ticks,
    startPoint,
    endPoint,
    label,
    labelPosition,
    tickLength,
    scale
  };
}

export function getTickPoints(tick: Tick, axis: AxisGeometry): { line: [Point, Point]; labelPosition: Point } {
  const { position, tickLength } = axis;
  const p = tick.position;

  let p1: Point;
  let p2: Point;
  let labelPos: Point;
  const labelOffset = tickLength + 4;

  switch (position) {
    case 'top':
      p1 = { x: p, y: 0 };
      p2 = { x: p, y: -tickLength };
      labelPos = { x: p, y: -labelOffset - 10 };
      break;
    case 'bottom':
      p1 = { x: p, y: 0 };
      p2 = { x: p, y: tickLength };
      labelPos = { x: p, y: labelOffset + 10 };
      break;
    case 'left':
      p1 = { x: 0, y: p };
      p2 = { x: -tickLength, y: p };
      labelPos = { x: -labelOffset - 10, y: p };
      break;
    case 'right':
      p1 = { x: 0, y: p };
      p2 = { x: tickLength, y: p };
      labelPos = { x: labelOffset + 10, y: p };
      break;
    default:
      p1 = { x: p, y: 0 };
      p2 = { x: p, y: tickLength };
      labelPos = { x: p, y: labelOffset };
  }

  return { line: [p1, p2], labelPosition: labelPos };
}

export function generateAxisPath(axis: AxisGeometry): string {
  const { startPoint, endPoint } = axis;
  let d = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;

  for (const tick of axis.ticks) {
    const { line } = getTickPoints(tick, axis);
    d += ` M ${line[0].x} ${line[0].y} L ${line[1].x} ${line[1].y}`;
  }

  return d;
}

function formatTickLabel(value: number): string {
  if (value === 0) return '0';

  const absValue = Math.abs(value);
  if (absValue >= 1e6) {
    return (value / 1e6).toFixed(1) + 'M';
  } else if (absValue >= 1e3) {
    return (value / 1e3).toFixed(1) + 'K';
  } else if (absValue < 0.01 && absValue > 0 || absValue >= 1000) {
    return value.toExponential(1);
  } else if (absValue < 1) {
    return value.toFixed(2);
  } else {
    return value.toString();
  }
}

import { Scale } from '../types';

export function tickStep(start: number, stop: number, count: number): number {
  const rawStep = Math.abs(stop - start) / Math.max(1, count);
  if (rawStep === 0 || !isFinite(rawStep)) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let step: number;
  if (normalized >= 10) step = 10;
  else if (normalized >= 5) step = 5;
  else if (normalized >= 2) step = 2;
  else if (normalized >= 1) step = 1;
  else if (normalized >= 0.5) step = 0.5;
  else if (normalized >= 0.2) step = 0.2;
  else if (normalized >= 0.1) step = 0.1;
  else step = Math.pow(10, Math.log10(normalized) | 0);

  return step * magnitude;
}

export function niceDomain(domain: [number, number], count: number = 10): [number, number] {
  let [start, stop] = domain;
  if (!isFinite(start) || !isFinite(stop)) return [0, 1];
  if (start === stop) {
    start -= 0.5;
    stop += 0.5;
  }

  const step = tickStep(start, stop, count);

  const niceStart = Math.floor(start / step) * step;
  const niceStop = Math.ceil(stop / step) * step;

  if (!isFinite(niceStart) || !isFinite(niceStop)) return [0, 1];

  return [niceStart, niceStop];
}

export function ticks(domain: [number, number], count: number = 10): number[] {
  const [start, stop] = domain;
  if (start === stop) return [start];
  if (!isFinite(start) || !isFinite(stop)) return [];

  const step = tickStep(start, stop, count);
  if (step === 0) return [start];

  const results: number[] = [];
  const isDescending = start > stop;
  const actualStart = isDescending ? stop : start;
  const actualStop = isDescending ? start : stop;

  let current = Math.ceil(actualStart / step) * step;
  const maxTicks = Math.floor((actualStop - actualStart) / step) + 1;
  const rawPrecision = -Math.floor(Math.log10(step));
  const precision = Math.max(0, Math.min(100, rawPrecision));

  for (let i = 0; i < maxTicks && current <= actualStop; i++) {
    const value = parseFloat(current.toFixed(precision));
    results.push(value);
    current += step;
  }

  return isDescending ? results.reverse() : results;
}

import { createLinearScale } from './linear';
import { createLogScale } from './log';
import { createOrdinalScale } from './ordinal';

export function createScale(
  type: 'linear' | 'log' | 'ordinal',
  domain: [number, number] | string[],
  range: [number, number]
): Scale {
  switch (type) {
    case 'linear':
      return createLinearScale(domain as [number, number], range);
    case 'log':
      return createLogScale(domain as [number, number], range);
    case 'ordinal':
      return createOrdinalScale(domain as string[], range);
    default:
      throw new Error(`Unknown scale type: ${type}`);
  }
}

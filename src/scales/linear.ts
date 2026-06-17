import { Scale } from '../types';
import { niceDomain, ticks } from './scale';

export function createLinearScale(
  domain: [number, number] = [0, 1],
  range: [number, number] = [0, 1]
): Scale {
  let currentDomain = [...domain] as [number, number];
  let currentRange = [...range] as [number, number];

  const scale = function (value: number): number {
    const [d0, d1] = currentDomain;
    const [r0, r1] = currentRange;

    if (d1 - d0 === 0) return r0;

    const t = (value - d0) / (d1 - d0);
    return r0 + t * (r1 - r0);
  } as Scale;

  scale.type = 'linear';

  Object.defineProperty(scale, 'domain', {
    get: () => currentDomain,
    set: (d: [number, number]) => { currentDomain = [...d]; }
  });

  Object.defineProperty(scale, 'range', {
    get: () => currentRange,
    set: (r: [number, number]) => { currentRange = [...r]; }
  });

  scale.invert = function (pixel: number): number {
    const [d0, d1] = currentDomain;
    const [r0, r1] = currentRange;

    if (r1 - r0 === 0) return d0;

    const t = (pixel - r0) / (r1 - r0);
    return d0 + t * (d1 - d0);
  };

  scale.ticks = function (count: number = 10): number[] {
    return ticks(currentDomain, count);
  };

  scale.nice = function (): Scale {
    currentDomain = niceDomain(currentDomain);
    return scale;
  };

  return scale;
}

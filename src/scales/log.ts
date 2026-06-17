import { Scale } from '../types';

export function createLogScale(
  domain: [number, number] = [1, 10],
  range: [number, number] = [0, 1],
  base: number = 10
): Scale {
  let currentDomain = [...domain] as [number, number];
  let currentRange = [...range] as [number, number];
  let currentBase = base;

  const logBase = (value: number): number => {
    if (value <= 0) {
      return -Infinity;
    }
    return Math.log(value) / Math.log(currentBase);
  };

  const powBase = (value: number): number => {
    return Math.pow(currentBase, value);
  };

  const scale = function (value: number): number {
    const [d0, d1] = currentDomain;
    const [r0, r1] = currentRange;

    const logD0 = logBase(Math.max(d0, Number.EPSILON));
    const logD1 = logBase(Math.max(d1, Number.EPSILON));

    if (logD1 - logD0 === 0) return r0;

    const logValue = logBase(Math.max(value, Number.EPSILON));
    const t = (logValue - logD0) / (logD1 - logD0);
    return r0 + t * (r1 - r0);
  } as Scale;

  scale.type = 'log';

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

    const logD0 = logBase(Math.max(d0, Number.EPSILON));
    const logD1 = logBase(Math.max(d1, Number.EPSILON));

    if (r1 - r0 === 0) return d0;

    const t = (pixel - r0) / (r1 - r0);
    const logValue = logD0 + t * (logD1 - logD0);
    return powBase(logValue);
  };

  scale.ticks = function (count: number = 10): number[] {
    const [d0, d1] = currentDomain;
    if (d0 <= 0 || d1 <= 0) return [];

    const results: number[] = [];
    const logD0 = logBase(d0);
    const logD1 = logBase(d1);

    const startExp = Math.ceil(logD0);
    const endExp = Math.floor(logD1);

    if (endExp - startExp + 1 <= count) {
      for (let exp = startExp; exp <= endExp; exp++) {
        results.push(powBase(exp));
      }
    } else {
      const step = Math.ceil((endExp - startExp) / count);
      for (let exp = startExp; exp <= endExp; exp += step) {
        results.push(powBase(exp));
      }
    }

    if (results.length === 0) {
      results.push(d0, d1);
    }

    return results;
  };

  scale.nice = function (): Scale {
    const [d0, d1] = currentDomain;
    if (d0 <= 0 || d1 <= 0) return scale;

    const niceStart = Math.pow(currentBase, Math.floor(logBase(d0)));
    const niceEnd = Math.pow(currentBase, Math.ceil(logBase(d1)));
    currentDomain = [niceStart, niceEnd];
    return scale;
  };

  return scale;
}

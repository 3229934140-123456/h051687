import { Scale } from '../types';

export function createOrdinalScale(
  domain: string[] = [],
  range: [number, number] = [0, 1]
): Scale {
  let currentDomain = [...domain];
  let currentRange = [...range] as [number, number];

  const indexMap = new Map<string, number>();
  currentDomain.forEach((d, i) => indexMap.set(d, i));

  const updateIndexMap = () => {
    indexMap.clear();
    currentDomain.forEach((d, i) => indexMap.set(d, i));
  };

  const scale = function (value: string): number {
    const [r0, r1] = currentRange;
    const n = currentDomain.length;

    if (n === 0) return r0;

    const index = indexMap.has(value)
      ? indexMap.get(value)!
      : currentDomain.indexOf(value);

    if (index === -1) return r0;

    const step = n > 1 ? (r1 - r0) / (n - 1) : 0;
    return r0 + index * step;
  } as Scale;

  scale.type = 'ordinal';

  Object.defineProperty(scale, 'domain', {
    get: () => currentDomain,
    set: (d: string[]) => {
      currentDomain = [...d];
      updateIndexMap();
    }
  });

  Object.defineProperty(scale, 'range', {
    get: () => currentRange,
    set: (r: [number, number]) => { currentRange = [...r]; }
  });

  scale.invert = function (pixel: number): string {
    const [r0, r1] = currentRange;
    const n = currentDomain.length;

    if (n === 0) return '';
    if (n === 1) return currentDomain[0];

    const step = (r1 - r0) / (n - 1);
    const index = Math.round((pixel - r0) / step);
    const clampedIndex = Math.max(0, Math.min(n - 1, index));

    return currentDomain[clampedIndex];
  };

  scale.ticks = function (count?: number): string[] {
    if (count && count < currentDomain.length) {
      const step = Math.ceil(currentDomain.length / count);
      const result: string[] = [];
      for (let i = 0; i < currentDomain.length; i += step) {
        result.push(currentDomain[i]);
      }
      return result;
    }
    return currentDomain;
  };

  scale.nice = function (): Scale {
    return scale;
  };

  return scale;
}

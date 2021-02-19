import rfdc from 'rfdc';

const deepClone = rfdc();

export default function clone<T>(obj: T): T {
  const copy = deepClone(obj) as any;

  if (typeof obj !== 'object') return copy as T;

  Object.entries(obj).forEach(([key, val]) => {
    if (val instanceof Array) {
      copy[key] = val.map((v) => v?.clone || v);
    } else {
      copy[key] = val?.clone || copy[key];
    }
  });

  return copy as T;
}

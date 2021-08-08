import { dequal } from 'dequal';

import { Availability } from 'lib/model/availability';
import { Timeslot } from 'lib/model/timeslot';

export function encodeBoolean(bool: boolean): string {
  return bool ? '1' : '0';
}
export function decodeBoolean(bool: string): boolean {
  return bool === '1';
}

export function encodeString(str: string): string {
  return str.split(' ').map(encodeURIComponent).join('+');
}
export function decodeString(str: string): string {
  return str.split('+').map(decodeURIComponent).join(' ');
}

export function encodeNumber(num: number): string {
  return num.toString();
}
export function decodeNumber(num: string): number {
  return Number(num);
}

export function encodeDate(date: Date): string {
  return encodeNumber(date.valueOf());
}
export function decodeDate(date: string): Date {
  return new Date(decodeNumber(date));
}

export function encodeArray(arr: string[]): string {
  return arr.map((str) => encodeString(str)).join(',');
}
export function decodeArray(arr: string): string[] {
  return arr.split(',').map((str) => decodeString(str));
}

export function encodeAvailability(a: Availability): string {
  return a.map((t) => `${encodeDate(t.from)}-${encodeDate(t.to)}`).join(',');
}
export function decodeAvailability(a: string): Availability {
  return new Availability(
    ...a.split(',').map((t) => {
      const [from, to] = t.split('-');
      return new Timeslot({ from: decodeDate(from), to: decodeDate(to) });
    })
  );
}

export type Config<T> = Record<
  keyof T,
  [T[keyof T], string, (v: any) => string, (v: string) => T[keyof T]]
>;

export function encode<T extends Record<string, unknown>>(
  obj: T,
  config: Config<T>
): Record<string, string> {
  const query: Record<string, string> = {};
  Object.keys(config).forEach((originalKey: keyof T) => {
    const [defaultVal, queryKey, encodeVal] = config[originalKey];
    if (!dequal(obj[originalKey], defaultVal))
      query[queryKey] = encodeVal(obj[originalKey]);
  });
  return query;
}
export function decode<T extends Record<string, unknown>>(
  query: Record<string, string>,
  config: Config<T>
): T {
  const obj: T = {} as T;
  Object.keys(config).forEach((originalKey: keyof T) => {
    const queryKey = config[originalKey][1];
    const decodeVal = config[originalKey][3];
    if (query[queryKey]) obj[originalKey] = decodeVal(query[queryKey]);
  });
  return obj;
}

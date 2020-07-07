/**
 * Assigns the `base` all the valid properties of the `partial` (that are the
 * same type as the default values of `base`) that are not already defined in
 * `inheritor` (e.g. typically the super class or interface).
 *
 * @todo Does this still work when the default value of `base` is `undefined`
 * (e.g. the `visible` property on `Query` objects)?
 */
export default function construct<T extends S, S = unknown>(
  base: T,
  partial: Partial<T>,
  inheritor?: S
): void {
  Object.entries(partial).forEach(([key, val]: [string, unknown]) => {
    if (key in base && !(key in (inheritor || {}))) {
      const kkey = key as keyof T;
      const vval = val as T[keyof T];
      /* eslint-disable-next-line no-param-reassign */
      if (typeof vval === typeof base[kkey]) base[kkey] = vval;
    }
  });
}

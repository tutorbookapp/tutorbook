export default class Utils {
  /**
   * Helper function that returns the intersection of two given arrays (using
   * the given `compare` function to check if elements overlap).
   * @see {@link https://stackoverflow.com/a/16227294/10023158}
   */
  public static intersection<T = any>(
    a: Array<T>,
    b: Array<T>,
    compare: (a: T, b: T) => boolean = (a, b) => a === b
  ): Array<T> {
    let t: Array<T>;
    if (b.length > a.length) (t = b), (b = a), (a = t); // Use smaller array.
    return a.filter((item: T) => {
      return b.findIndex((i: T) => compare(i, item)) > -1;
    });
  }
}

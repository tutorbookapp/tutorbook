export default class Utils {
  /**
   * Capitalizes the first letter of the given string.
   */
  public static caps(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Helper function that returns the intersection of two given arrays (using
   * the given `compare` function to check if elements overlap).
   * @see {@link https://stackoverflow.com/a/16227294/10023158}
   */
  public static intersection<A extends any, B extends any>(
    a: Array<A>,
    b: Array<B>,
    compare: (a: A, b: B) => boolean = (a, b) => a === b
  ): Array<A> {
    return a.filter((itemA: A) => {
      return b.findIndex((itemB: B) => compare(itemA, itemB)) > -1;
    });
  }

  /**
   * Joins the array like the typicall `Array.join` function but adds the
   * `ending` concatenator between the last two items.
   * @example
   * const Utils = require('@tutorbook/utils');
   * const subjects = ['Chemistry', 'Chemistry H', 'Algebra 1'];
   * const str = Utils.join(subjects, 'or');
   * assert(str === 'Chemistry, Chemistry H, or Algebra 1');
   * @param {any[]} arr - The array of (typically) strings to concatenate.
   * @param {string} [ending='and'] - The concatenator to insert between the last
   * two items in the given `arr`.
   * @param {bool} [oxfordComma=false] - Whether or not to have the Oxford
   * comma before the last item.
   * @return {string} The concatenated array in string form (with the given
   * `ending` between the last two items in the given `arr`).
   */
  public static join<T = any>(
    arr: Array<T>,
    ending: string = 'and',
    oxfordComma: boolean = false
  ): string {
    if (arr.length === 0) {
      return '';
    } else if (arr.length === 1) {
      return '' + arr[0];
    } else {
      const lastItem: T | undefined = arr.pop();
      const str: string = arr.join(', ');
      return str + (oxfordComma ? ', ' : ' ') + ending + ' ' + lastItem;
    }
  }
}

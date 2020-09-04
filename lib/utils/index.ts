import { ObjectWithObjectID, SearchResponse } from '@algolia/client-search';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';

import { Option } from 'lib/model';

export { default as TimeUtils } from './time';

const algoliaId: string = process.env.ALGOLIA_APP_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);
const searchIndex: SearchIndex = client.initIndex('langs');

type LangHit = ObjectWithObjectID & {
  [key: string]: { name: string; synonyms: string[] };
};

export default class Utils {
  /**
   * Converts a given array of locale codes into an array of `Option<string>`
   * that include the language's label (i.e. `en` -> `English`) by fetching the
   * labels from our Algolia search index.
   */
  public static async langsToOptions(
    langs: string[],
    locale = 'en'
  ): Promise<Option<string>[]> {
    const res: SearchResponse<LangHit> = await searchIndex.search('', {
      filters: langs.map((lang: string) => `objectID:${lang}`).join(' OR '),
    });
    return res.hits.map((lang: LangHit) => {
      return { label: lang[locale].name, value: lang.objectID };
    });
  }

  /**
   * Converts an array of subject codes into their `Option<string>` values by
   * fetching their labels from our Algolia search index.
   * @todo Actually add i18n to subjects.
   */
  public static async subjectsToOptions(
    subjects: string[],
    locale = 'en'
  ): Promise<Option<string>[]> {
    return subjects.map((subject) => ({ label: subject, value: subject }));
  }

  /**
   * Ensures that the given string ends in a period.
   */
  public static period(msg: string): string {
    if (!msg || msg.endsWith('.')) return msg;
    return `${msg}.`;
  }

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
    arrA: Array<A>,
    arrB: Array<B>,
    compare: (a: A, b: B) => boolean = (a, b) => a === b
  ): Array<A> {
    return arrA.filter((itemA: A) => {
      return arrB.findIndex((itemB: B) => compare(itemA, itemB)) > -1;
    });
  }

  /**
   * Joins the array like the typicall `Array.join` function but adds the
   * `ending` concatenator between the last two items.
   * @example
   * const Utils = require('lib/utils');
   * const subjects = ['Chemistry', 'Chemistry H', 'Algebra 1'];
   * const str = Utils.join(subjects, 'or');
   * assert(str === 'Chemistry, Chemistry H, or Algebra 1');
   * @param {any[]} array - The array of (typically) strings to concatenate.
   * @param {string} [ending='and'] - The concatenator to insert between the last
   * two items in the given `arr`.
   * @param {bool} [oxfordComma=false] - Whether or not to have the Oxford
   * comma before the last item.
   * @return {string} The concatenated array in string form (with the given
   * `ending` between the last two items in the given `arr`).
   */
  public static join<T = any>(
    array: Array<T>,
    ending = 'and',
    oxfordComma = false
  ): string {
    /* eslint-disable @typescript-eslint/restrict-template-expressions */
    const arr: Array<T> = Array.from(array);
    if (arr.length === 0) return '';
    if (arr.length === 1) return `${arr[0]}`;
    const lastItem: T | undefined = arr.pop();
    const str: string = arr.join(', ');
    return `${str + (oxfordComma ? ', ' : ' ') + ending} ${lastItem}`;
    /* eslint-enable @typescript-eslint/restrict-template-expressions */
  }
}

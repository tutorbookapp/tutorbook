import { ObjectWithObjectID, SearchResponse } from '@algolia/client-search';
import algoliasearch from 'algoliasearch/lite';

import { Option, Role, User, UserWithRoles } from 'lib/model';
import clone from 'lib/utils/clone';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY as string;

const client = algoliasearch(algoliaId, algoliaKey);
const searchIndex = client.initIndex('langs');

type LangHit = ObjectWithObjectID & {
  [key: string]: { name: string; synonyms: string[] };
};

/**
 * Checks if a given URL is a valid GCP Storage item and, if so, returns the
 * filename within the default GCP Storage bucket.
 * @param url - The URL to check (typically a profile photo URL).
 * @return An empty string (when given an invalid URL) or the filename.
 */
export function getPhotoFilename(url: string): string {
  const env =
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    '(?:production|test|development)';
  const rgx = new RegExp(
    `https:\\/\\/firebasestorage\\.googleapis\\.com\\/v0\\/b\\/${env}-` +
      `tutorbook\\.appspot\\.com\\/o\\/(.*)\\?alt=media&token=(.*)`
  );
  return decodeURIComponent((rgx.exec(url) || [])[1] || '');
}

/**
 * Adds roles to a given user object.
 * @param user - The user to add roles to.
 * @param roles - The roles to add.
 * @return A `UserWithRoles` object that contains all data combined.
 */
export function addRoles(user: User, roles: Role[]): UserWithRoles {
  const userWithRoles = new User(clone(user));
  (userWithRoles as UserWithRoles).roles = roles;
  return userWithRoles as UserWithRoles;
}

/**
 * Converts a given array of locale codes into an array of `Option<string>`
 * that include the language's label (i.e. `en` -> `English`) by fetching the
 * labels from our Algolia search index.
 */
export async function langsToOptions(
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
export async function subjectsToOptions(
  subjects: string[],
  locale = 'en'
): Promise<Option<string>[]> {
  return subjects.map((subject) => ({ label: subject, value: subject }));
}

/**
 * Ensures that the given string ends in a period.
 */
export function period(msg: string): string {
  if (!msg || msg.endsWith('.')) return msg;
  return `${msg}.`;
}

/**
 * Capitalizes the first letter of the given string.
 */
export function caps(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper function that returns the intersection of two given arrays (using
 * the given `compare` function to check if elements overlap).
 * @see {@link https://stackoverflow.com/a/16227294/10023158}
 */
export function intersection<A extends any, B extends any>(
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
 * const { join } = require('lib/utils');
 * const subjects = ['Chemistry', 'Chemistry H', 'Algebra 1'];
 * const str = join(subjects, 'or');
 * assert(str === 'Chemistry, Chemistry H, or Algebra 1');
 * @param {any[]} array - The array of (typically) strings to concatenate.
 * @param {string} [ending='and'] - The concatenator to insert between the last
 * two items in the given `arr`.
 * @param {bool} [oxfordComma=false] - Whether or not to have the Oxford
 * comma before the last item.
 * @return {string} The concatenated array in string form (with the given
 * `ending` between the last two items in the given `arr`).
 */
export function join<T = any>(
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

import { Role } from 'lib/model/person';
import { User } from 'lib/model/user';
import clone from 'lib/utils/clone';

/**
 * Converts an RRule into one of Tutorbook's officially supported recur options
 * (daily, weekly, biweekly, or monthly). We don't use the `rrule` package
 * client-side because of it's size.
 */
export function getRecurString(rrule?: string): string {
  if (!rrule) return '';
  if (rrule.includes('FREQ=DAILY')) return 'Daily';
  if (rrule.includes('FREQ=WEEKLY') && rrule.includes('INTERVAL=2'))
    return 'Biweekly';
  if (rrule.includes('FREQ=WEEKLY')) return 'Weekly';
  if (rrule.includes('FREQ=MONTHLY')) return 'Monthly';
  return '';
}

interface PhoneProps {
  name?: string;
  phone: string;
}

/**
 * Returns a link that, when clicked, opens a new SMS message (to the given
 * phone number) that includes the recipient's name.
 * @see {@link https://stackoverflow.com/a/38708066/10023158}
 */
export function getPhoneLink({ name, phone }: PhoneProps): string {
  if (!name) return `sms:${phone}`;
  return `sms:${phone};?&body=${encodeURIComponent(`Hi ${name}!`)}`;
}

interface EmailProps {
  name?: string;
  email: string;
}

export function getEmailLink({ name, email }: EmailProps): string {
  if (!name) return `mailto:${email}`;
  return `mailto:${encodeURIComponent(`"${name}"<${email}>`)}`;
}

/**
 * Replaces the {{var}} dynamic string variables with their values (if
 * available). This allows orgs to customize e.g. booking message placeholders
 * and still take advantage of dynamic variables like {{person}} or {{subject}}.
 */
export function translate(tmpl: string, vals: Record<string, string>): string {
  let str = tmpl;
  Object.entries(vals).forEach(([key, val]) => {
    str = str.replace(`{{${key}}}`, val);
  });
  return str;
}

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
 * Essentially the same as the above function except much more lenient (i.e.
 * allows `assets.tutorbook.org` images when testing and developing).
 * @param url - The URL to check (typically a profile photo URL).
 * @return Whether or not that image is stored with us in a managed location.
 */
export function validPhoto(url: string): boolean {
  const asset = /https:\/\/assets\.tutorbook\.org\/(.*)/;
  return !!asset.exec(url) || !!getPhotoFilename(url);
}

/**
 * Returns the `not-` tags that correspond to the given tags.
 * e.g. given tags ['meeting', 'vetted'] we would return ['not-matched']
 *      ['meeting', 'not-matched', 'vetted']
 */
export function notTags<T extends string>(tags: T[], TAGS: T[]): T[] {
  return TAGS.filter((t) => !tags.includes(t)).map((t) => `not-${t}` as T);
}

/**
 * Adds roles to a given user object.
 * @param user - The user to add roles to.
 * @param roles - The roles to add.
 * @return A `User` object that contains all data combined.
 */
export function addRoles(user: User, roles: Role[]): User {
  return new User(clone({ ...user, roles }));
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
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

/**
 * Helper function that returns the intersection of two given arrays (using
 * the given `compare` function to check if elements overlap).
 * @see {@link https://stackoverflow.com/a/16227294/10023158}
 */
export function intersection<A extends unknown, B extends unknown>(
  arrA: Array<A>,
  arrB?: Array<B>,
  compare: (a: A, b: B) => boolean = (a, b) => a === b
): Array<A> {
  if (!arrB) return arrA.filter(Boolean);
  return arrA.filter(
    (itemA: A) => arrB.findIndex((itemB: B) => compare(itemA, itemB)) > -1
  );
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
  oxfordComma = true
): string {
  /* eslint-disable @typescript-eslint/restrict-template-expressions */
  const arr: Array<T> = Array.from(array);
  if (arr.length === 0) return '';
  if (arr.length === 1) return `${arr[0]}`;
  if (arr.length === 2) return arr.join(` ${ending} `);
  const lastItem: T | undefined = arr.pop();
  const str: string = arr.join(', ');
  return `${str + (oxfordComma ? ', ' : ' ') + ending} ${lastItem}`;
  /* eslint-enable @typescript-eslint/restrict-template-expressions */
}

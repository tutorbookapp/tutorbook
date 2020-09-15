import { customAlphabet } from 'nanoid';

import user from '../fixtures/user.json';

const randId = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);
const randPhone = customAlphabet('0123456789', 10);

export interface UserInfo {
  id: string;
  phone: string;
  email: string;
}

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace NodeJS {
    interface Global {
      user?: UserInfo;
    }
  }
}

/**
 * Firebase Authentication does not have emulator support, so auth requests are
 * made to an actual `test-tutorbook` Firebase project. In order to prevent
 * parallel tests from interfering with one another, we dynamically generate
 * unique user info (for each test) and store it in the global Node.js object.
 *
 * Because that global Node.js object is only accessible server-side, we expose
 * a `generateUserInfo` Cypress task to the browser (e.g. to create info used
 * when testing the sign-up page).
 *
 * We can't use `Cypress.env` variables because they are local to each test.
 * @see {@link https://docs.cypress.io/api/cypress-api/env.html#Why-is-it-Cypress-env-and-not-cy-env}
 */
export default function generateUserInfo(
  overrides?: Record<string, unknown>
): UserInfo {
  const id = randId();
  const phone = `+1${randPhone()}`;
  const email = `${user.name
    .toLowerCase()
    .split(' ')
    .join('-')}-${id}@example.com`;
  global.user = { id, phone, email, ...overrides };
  return { id, phone, email, ...overrides };
}

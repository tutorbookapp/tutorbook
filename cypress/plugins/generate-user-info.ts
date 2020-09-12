import { customAlphabet } from 'nanoid';

import user from '../fixtures/user.json';

const nanuid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 20);
const nanphone = customAlphabet('0123456789', 9);

interface UserInfo {
  uid: string;
  phone: string;
  email: string;
}

// Firebase Authentication does not have emulator support, so auth requests are
// made to an actual `test-tutorbook` Firebase project. In order to prevent
// parallel tests from interfering with one another, we dynamically generate
// unique user info (for each test) and store it in Cypress environment vars.
// @see {@link https://docs.cypress.io/api/cypress-api/env.html}
export default function generateUserInfo(): UserInfo {
  const uid = nanuid();
  const phone = `+1${nanphone()}`;
  const email = `${user.name
    .toLowerCase()
    .split(' ')
    .join('-')}-${uid}@example.com`;
  Cypress.env('uid', uid);
  Cypress.env('phone', phone);
  Cypress.env('email', email);
  return { uid, phone, email };
}

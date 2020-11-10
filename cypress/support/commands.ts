import firebase from 'firebase/app';

import { Overrides } from 'cypress/plugins';
import photo from 'cypress/fixtures/users/volunteer.jpg.json';

import 'firebase/auth';
import 'firebase/firestore';
import 'cypress-file-upload';

/**
 * Add types to the existing global Cypress object.
 * @see {@link https://github.com/prescottprue/cypress-firebase/blob/master/src/attachCustomCommands.ts#L123}
 * @see {@link https://docs.cypress.io/guides/tooling/typescript-support.html#Types-for-custom-commands}
 */
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Cypress {
    interface Chainable {
      login: (uid?: string) => Chainable<null>;
      logout: () => Chainable<null>;
      setup: (overrides?: Overrides) => Chainable<undefined>;
      getBySel: (selector: string, args?: any) => Chainable<Element>;
    }
  }
}

const clientCredentials = {
  apiKey: Cypress.env('apiKey') as string,
  authDomain: Cypress.env('authDomain') as string,
  databaseURL: Cypress.env('databaseURL') as string,
  projectId: Cypress.env('projectId') as string,
  storageBucket: Cypress.env('storageBucket') as string,
  messagingSenderId: Cypress.env('messagingSenderId') as string,
  appId: Cypress.env('appId') as string,
  measurementId: Cypress.env('measurementId') as string,
};
if (!firebase.apps.length) firebase.initializeApp(clientCredentials);

function loginWithToken(token: string): Promise<null> {
  return new Promise<null>((resolve, reject): void => {
    firebase.auth().onAuthStateChanged((auth: unknown): void => {
      if (auth) resolve(null);
    });
    firebase.auth().signInWithCustomToken(token).catch(reject);
  });
}

function login(uid?: string): Cypress.Chainable<null> {
  if (firebase.auth().currentUser) cy.logout();
  return cy.task('login', uid).then((token: string) => loginWithToken(token));
}

function logout(): Cypress.Chainable<null> {
  return cy.wrap(
    new Promise<null>((resolve, reject): void => {
      firebase.auth().onAuthStateChanged((auth: unknown): void => {
        if (!auth) resolve(null);
      });
      firebase.auth().signOut().catch(reject);
    })
  );
}

function setup(overrides?: Overrides): void {
  cy.task('clear');
  cy.task('seed', overrides);

  cy.server();

  cy.route('GET', '/api/account').as('get-account');

  cy.route('GET', '/api/requests*').as('list-requests');

  cy.route('POST', '/api/matches').as('create-match');
  cy.route('GET', '/api/matches*').as('list-matches');
  cy.route('PUT', '/api/matches/*').as('update-match');

  cy.route('POST', '/api/users').as('create-user');
  cy.route('GET', '/api/users*').as('list-users');
  cy.route('PUT', '/api/users/*').as('update-user');

  cy.route({
    method: 'POST',
    url: 'https://firebasestorage.googleapis.com/**',
    response: photo,
  }).as('upload-photo');
  cy.route({
    method: 'GET',
    url: 'https://firebasestorage.googleapis.com/**',
    response: photo,
  }).as('get-photo');
}

function getBySel(
  selector: string,
  ...args: any
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`[data-cy=${selector}]`, ...args);
}

// TODO: Debug why Next.js keeps mounting and unmounting these image components.
chai.Assertion.addMethod('img', function img(
  src: string,
  w: number = 1200,
  q: number = 75
): void {
  /*
   *new chai.Assertion(this._obj).to.exist;
   *const expected = `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${q}`;
   *this.assert(
   *  this._obj.attr('src') === expected,
   *  'expected #{this} to have Next.js image source #{exp}, but the source was #{act}',
   *  'expected #{this} not to have Next.js image source #{exp}',
   *  expected,
   *  this._obj.attr('src')
   *);
   */
});

Cypress.Commands.add('login', login);
Cypress.Commands.add('logout', logout);
Cypress.Commands.add('setup', setup);
Cypress.Commands.add('getBySel', getBySel);

import firebase from 'firebase/app';

import { Overrides } from 'cypress/plugins';

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
}

function getBySel(
  selector: string,
  ...args: any
): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.get(`[data-cy=${selector}]`, ...args);
}

Cypress.Commands.add('login', login);
Cypress.Commands.add('logout', logout);
Cypress.Commands.add('setup', setup);
Cypress.Commands.add('getBySel', getBySel);

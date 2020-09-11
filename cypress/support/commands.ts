import firebase from 'firebase/app';

import 'firebase/auth';
import 'firebase/firestore';
import 'cypress-file-upload';

// Add types to the existing global Cypress object.
// @see {@link https://github.com/prescottprue/cypress-firebase/blob/master/src/attachCustomCommands.ts#L123}
// @see {@link https://docs.cypress.io/guides/tooling/typescript-support.html#Types-for-custom-commands}
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login: (uid?: string) => Chainable<null>;
      logout: () => Chainable<null>;
    }
  }
}

if (!firebase.apps.length)
  firebase.initializeApp(Cypress.env('clientCredentials'));

function loginWithToken(token: string): Promise<null> {
  return new Promise<null>((resolve, reject): void => {
    firebase.auth().onAuthStateChanged((auth: unknown): void => {
      if (auth) resolve(null);
    });
    firebase.auth().signInWithCustomToken(token).catch(reject);
  });
}

Cypress.Commands.add(
  'login',
  (uid?: string): Cypress.Chainable<null> => {
    cy.log('logging in');
    if (firebase.auth().currentUser) throw new Error('User already logged in.');
    return cy.task('login', uid).then((token: unknown) => {
      return loginWithToken(token as string);
    });
  }
);

Cypress.Commands.add(
  'logout',
  (): Cypress.Chainable<null> => {
    cy.log('logging out');
    return cy.wrap(
      new Promise<null>((resolve, reject): void => {
        firebase.auth().onAuthStateChanged((auth: unknown): void => {
          if (!auth) resolve(null);
        });
        firebase.auth().signOut().catch(reject);
      })
    );
  }
);

import admin from 'cypress/fixtures/users/admin.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

function snackbarIsOpen(label: string = 'Link copied to clipboard.'): void {
  cy.get('.mdc-snackbar__surface')
    .as('snackbar')
    .should('be.visible')
    .find('.mdc-snackbar__label')
    .should('have.text', label);
  cy.get('@snackbar').find('button').click();
  cy.get('@snackbar').should('not.exist');
}

describe('Users dashboard page', () => {
  beforeEach(() => {
    cy.setup();
  });

  it('redirects to login page when logged out', () => {
    cy.logout();
    cy.visit(`/${school.id}/users`);
    cy.wait('@get-account');

    // TODO: Refactor these assertions into reusable functions as they're used
    // on every single "login required" page. Or, just test them once and assume
    // that they work on every page.
    const url = `/login?href=${encodeURIComponent(`/${school.id}/users`)}`;

    cy.url({ timeout: 60000 }).should('contain', url);
  });

  it.only('shows share buttons and filters users', () => {
    cy.login(admin.id);
    cy.visit(`/${school.id}/users`);
    cy.wait('@get-account');

    cy.getBySel('title').should('have.text', 'Users');
    cy.getBySel('subtitle').should(
      'have.text',
      'Create, edit, and match users'
    );

    // TODO: Assert about the content of the user's clipboard once it's
    // implemented in Cypress.
    // @see {@link https://github.com/cypress-io/cypress/issues/2752}
    cy.contains('button', 'Share signup link').click();
    snackbarIsOpen();
    cy.contains('button', 'Share search link').click();
    snackbarIsOpen();

    // TODO: Right now, we can't test the Intercom integration due to
    // `localhost` not being whitelisted. We'll have to change the development
    // server hostname to something like `127.0.0.1` or `0.0.0.0` to be able to
    // access Intercom locally. But do we really need to test Intercom?
    cy.contains('button', 'Import data').click();

    cy.wait('@list-users');
    cy.getBySel('results')
      .children('a')
      .as('results')
      .should('have.length', 3)
      .first()
      .should('contain', volunteer.name)
      .and('have.attr', 'href', `/${school.id}/users/${volunteer.id}`)
      .and('have.attr', 'target', '_blank');
  });
});

import request from '../../fixtures/request.json';
import user from '../../fixtures/user.json';
import org from '../../fixtures/org.json';

describe('Search page', () => {
  beforeEach(() => {
    cy.setup();
    cy.logout();

    // TODO: Refactor the `search.spec.ts` into two specs (one for the default
    // search view and one for when a user slug is passed along with the URL).
    cy.visit(`/${org.id}/search`, {
      onBeforeLoad(win: Window): void {
        cy.stub(win, 'open');
      },
    });
  });

  // TODO: Create test where the user is already logged in (and then ping
  // SendGrid to ensure that our email notifications were sent).
  it('searches and requests users', () => {
    cy.get('[data-cy=results] li')
      .should('have.length', 1)
      .and('not.contain', user.name)
      .and('contain', user.username)
      .and('contain', user.bio)
      .find('img')
      .should('have.attr', 'src', user.photo);

    cy.contains('button', 'Any subjects').click();
    cy.focused()
      .type('Computer')
      .closest('label')
      .should('contain', 'What would you like to learn?');
    cy.contains('li', 'Computer Science').click();

    cy.get('[data-cy=page]').click({ force: true });
    cy.get('[data-cy=results] li').first().should('not.be.disabled').click();

    cy.get('[data-cy=request-dialog]').should('be.visible');
    cy.get('[data-cy=bio]').should('have.text', user.bio);
    cy.get('[data-cy=name]').should('have.text', user.username);
    cy.get('[data-cy=socials] a').should('have.length', user.socials.length);

    user.socials.forEach((social: Record<string, string>) => {
      cy.get(`[data-cy=${social.type}-social-link]`)
        .should('have.attr', 'href', social.url)
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noreferrer');
    });

    cy.contains('What would you like to learn?')
      .children('.mdc-chip')
      .should('have.length', 1)
      .and('contain', 'Computer Science');
    cy.contains('What specifically do you need help with?').type(
      request.message
    );

    cy.contains('button', 'Signup and send').click().should('be.disabled');
    cy.get('[data-cy=loader]').should('be.visible');

    // TODO: Stub out the Google OAuth response using the Google OAuth
    // server-side REST API. That way, we can test this programmatically.
    cy.window().its('open').should('be.called');

    cy.get('[data-cy=loader]').should('not.be.visible');
    cy.get('[data-cy=error]')
      .should('be.visible')
      .and('contain', 'Unable to establish a connection with the popup.');
  });
});

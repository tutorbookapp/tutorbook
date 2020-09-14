import org from 'fixtures/org.json';
import user from 'fixtures/user.json';

describe('Dashboard page', () => {
  beforeEach(() => {
    cy.logout();
  });

  context('when logged out', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('redirects to login page', () => {
      cy.url({ timeout: 60000 }).should('contain', '/login');
    });
  });

  context('when logged in', () => {
    beforeEach(() => {
      cy.setup();
      cy.login();
      cy.visit('/dashboard');
    });

    it('shows placeholders', () => {
      cy.contains('COMING SOON');
      cy.get('[data-cy=title]').should('have.text', 'Overview');
      cy.get('[data-cy=subtitle]').should(
        'have.text',
        `Analytics dashboard for ${user.name}`
      );
    });

    it('switches accounts', () => {
      cy.contains('button', 'Account').click();
      cy.get('[data-cy=switcher-list] a')
        .as('accounts')
        .should('have.length', 2);
      cy.get('@accounts')
        .eq(0)
        .should('have.text', user.name)
        .and('have.attr', 'href', '/dashboard');
      cy.get('@accounts')
        .eq(1)
        .should('have.text', org.name)
        .and('have.attr', 'href', `/${org.id}/dashboard`);
    });
  });
});

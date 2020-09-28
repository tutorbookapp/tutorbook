import admin from 'cypress/fixtures/users/admin.json';
import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';

describe('Dashboard page', () => {
  beforeEach(() => {
    cy.server();
    cy.route('GET', '/api/account').as('get-account');
  });

  it('redirects to login page when logged out', () => {
    cy.logout();
    cy.visit('/dashboard');

    cy.wait('@get-account');
    cy.url({ timeout: 60000 }).should('contain', '/login');
  });

  context('when logged in', () => {
    beforeEach(() => {
      cy.setup();
      cy.login(admin.id);
      cy.visit('/dashboard');
    });

    it('shows placeholders', () => {
      cy.contains('COMING SOON');
      cy.getBySel('title').should('have.text', 'Overview');
      cy.wait('@get-account');
      cy.getBySel('subtitle').should(
        'have.text',
        `Analytics dashboard for ${admin.name}`
      );
    });

    it('switches accounts', () => {
      cy.wait('@get-account');
      cy.contains('button', 'Account').click();
      cy.getBySel('switcher-list')
        .find('a')
        .as('accounts')
        .should('have.length', 3);
      cy.get('@accounts')
        .eq(0)
        .should('have.text', admin.name)
        .and('have.attr', 'href', '/dashboard');
      cy.get('@accounts')
        .eq(1)
        .should('have.text', org.name)
        .and('have.attr', 'href', `/${org.id}/dashboard`);
      cy.get('@accounts')
        .eq(2)
        .should('have.text', school.name)
        .and('have.attr', 'href', `/${school.id}/dashboard`);
    });
  });
});

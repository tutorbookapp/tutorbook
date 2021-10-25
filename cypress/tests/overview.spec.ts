import admin from 'cypress/fixtures/users/admin.json';
import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';

describe('Overview page', () => {
  it('redirects to login page when logged out', () => {
    cy.setup(null);
    cy.logout();
    cy.visit('/overview');
    cy.wait('@get-account');

    cy.url({ timeout: 60000 }).should('contain', '/login?href=%2Foverview');
    cy.loading(false).percySnapshot('Login Page');
  });

  it.only('only shows org accounts to admins', () => {
    cy.setup({ volunteer: null, meeting: null });
    cy.login(student.id);
    cy.visit('/overview');
    cy.percySnapshot('Overview Page in Loading State');

    cy.wait('@get-account');
    cy.percySnapshot('Overview Page for Students');

    cy.contains('button', 'Account').click();
    cy.getBySel('switcher-list')
      .find('a')
      .should('have.length', 1)
      .first()
      .should('contain', student.name)
      .and('have.attr', 'href', '/overview');

    cy.window().then((win) => cy.stub(win, 'Intercom').as('intercom'));
    cy.getBySel('switcher-list')
      .contains('button', 'Create an organization')
      .click();
    const msg = "I'd like to create a new organization.";
    cy.get('@intercom').should('be.calledWithExactly', 'showNewMessage', msg);
    cy.percySnapshot('Overview Page for Students with Switcher Open');

    cy.getBySel('page').click({ force: true });
    cy.percySnapshot('Overview Page for Students');
  });

  it.only('shows placeholders and accounts when logged in', () => {
    cy.setup({ student: null, volunteer: null, meeting: null });
    cy.login(admin.id);
    cy.visit('/overview');

    cy.contains('COMING SOON');
    cy.getBySel('title').should('have.text', 'Overview');

    cy.wait('@get-account');
    cy.getBySel('subtitle').should('have.text', 'View your analytics');
    cy.percySnapshot('Overview Page for Admins');

    cy.contains('button', 'Account').click();
    cy.getBySel('switcher-list')
      .find('a')
      .as('accounts')
      .should('have.length', 3);
    cy.get('@accounts')
      .eq(0)
      .should('contain', admin.name)
      .and('have.attr', 'href', '/overview');
    cy.get('@accounts')
      .eq(1)
      .should('contain', org.name)
      .and('have.attr', 'href', `/${org.id}/overview`);
    cy.get('@accounts')
      .eq(2)
      .should('contain', school.name)
      .and('have.attr', 'href', `/${school.id}/overview`);

    cy.percySnapshot('Overview Page for Admins with Switcher Open');
  });
});

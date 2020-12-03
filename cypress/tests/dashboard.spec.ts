import admin from 'cypress/fixtures/users/admin.json';
import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';

describe('Dashboard page', () => {
  it('redirects to login page when logged out', () => {
    cy.setup(null);
    cy.logout();
    cy.visit('/dashboard');
    cy.wait('@get-account');

    cy.url({ timeout: 60000 }).should('contain', '/login?href=%2Fdashboard');
    cy.loading(false).percySnapshot('Login Page');
  });

  it('only shows org accounts to admins', () => {
    cy.setup({ volunteer: null, match: null, meeting: null });
    cy.login(student.id);
    cy.visit('/dashboard');
    cy.percySnapshot('Dashboard Page in Loading State');

    cy.wait('@get-account');
    cy.percySnapshot('Dashboard Page for Students');

    cy.contains('button', 'Account').click();
    cy.getBySel('switcher-list')
      .find('a')
      .should('have.length', 1)
      .first()
      .should('have.text', student.name)
      .and('have.attr', 'href', '/dashboard');

    // Segment seems to replace the global `Intercom` object, so we can't place
    // these assertions in the `onLoad` option of `cy.visit()`.
    cy.window().then((win: Window) => cy.spy(win, 'Intercom').as('intercom'));
    cy.getBySel('switcher-list')
      .contains('button', 'Create an Organization')
      .click();
    const msg = "I'd like to create a new organization.";
    cy.get('@intercom').should('be.calledWithExactly', 'showNewMessage', msg);
    cy.percySnapshot('Dashboard Page for Students with Switcher Open');

    cy.getBySel('page').click({ force: true });
    cy.percySnapshot('Dashboard Page for Students');
  });

  it('shows placeholders and accounts when logged in', () => {
    cy.setup({ student: null, volunteer: null, match: null, meeting: null });
    cy.login(admin.id);
    cy.visit('/dashboard');

    cy.contains('COMING SOON');
    cy.getBySel('title').should('have.text', 'Overview');

    cy.wait('@get-account');
    cy.getBySel('subtitle').should(
      'have.text',
      `Analytics dashboard for ${admin.name}`
    );
    cy.percySnapshot('Dashboard Page for Admins');

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

    cy.percySnapshot('Dashboard Page for Admins with Switcher Open');
  });
});

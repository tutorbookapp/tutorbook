import volunteer from 'cypress/fixtures/users/volunteer.json';

describe('Calendar page', () => {
  it('redirects to login page when logged out', () => {
    cy.setup(null);
    cy.logout();
    cy.visit('/calendar');
    cy.wait('@get-account');

    cy.url({ timeout: 60000 }).should('contain', '/login?href=%2Fcalendar');
    cy.loading(false).percySnapshot('Login Page');
  });

  it('creates, edits, and cancels meetings', () => {
    cy.setup();
    cy.login(volunteer.id);
    cy.visit('/calendar');
    cy.wait('@get-account');
  });
});

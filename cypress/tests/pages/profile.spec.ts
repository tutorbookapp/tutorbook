import volunteer from 'cypress/fixtures/users/volunteer.json';

describe('Profile page', () => {
  beforeEach(() => {
    cy.server();
    cy.route('GET', '/api/account').as('get-account');
  });

  it('redirects to login page when logged out', () => {
    cy.logout();
    cy.visit('/profile');

    cy.wait('@get-account');

    cy.url({ timeout: 60000 }).should('contain', '/login');
  });

  it('updates volunteer profiles', () => {
    cy.setup();
    cy.login(volunteer.id);
    cy.visit('/profile');

    cy.wait('@get-account');
  });
});

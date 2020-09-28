import volunteer from 'cypress/fixtures/users/volunteer.json';

describe('Profile page', () => {
  beforeEach(() => {
    cy.setup();
  });

  it('redirects to login page when logged out', () => {
    cy.logout();
    cy.visit('/profile');
    cy.wait('@get-account');

    cy.url({ timeout: 60000 }).should('contain', '/login');
  });

  it('updates volunteer profiles', () => {
    cy.login(volunteer.id);
    cy.visit('/profile');
    cy.wait('@get-account');
  });
});

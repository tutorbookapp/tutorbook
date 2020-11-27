describe('Login page', () => {
  beforeEach(() => {
    cy.logout();
  });

  // TODO: Use the new Firebase Auth local emulator to test my two login flows.
  it('contains greeting and links', () => {
    cy.visit('/login');
    cy.contains('h2', 'Welcome');
    cy.get('header').contains('TB').should('have.attr', 'href', '/');
  });

  it('navigates to dashboard on successful login', () => {
    cy.setup();
    cy.login();
    cy.visit('/login');
    cy.url({ timeout: 60000 }).should('contain', '/dashboard');
  });

  it('navigates to specified redirect destination', () => {
    cy.setup();
    cy.login();
    cy.visit('/login?href=%2Fprofile');
    cy.url({ timeout: 60000 }).should('contain', '/profile');
  });
});

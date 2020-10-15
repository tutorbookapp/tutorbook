describe('Login page', () => {
  beforeEach(() => {
    cy.logout();
  });

  it('contains greeting and links', () => {
    cy.visit('/login');

    cy.contains('h1', 'Login to Tutorbook');

    cy.contains('Signup here').should('have.attr', 'href', '/default/signup');

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
    cy.visit('/login?href=profile');
    cy.url({ timeout: 60000 }).should('contain', '/profile');
  });
});

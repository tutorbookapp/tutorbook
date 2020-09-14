describe('Login page', () => {
  beforeEach(() => {
    cy.logout();
    cy.visit('/login');
  });

  it('contains greeting and links', () => {
    cy.contains('h1', 'Login to Tutorbook');

    cy.contains('Signup here').should('have.attr', 'href', '/default/signup');

    cy.get('header').contains('TB').should('have.attr', 'href', '/');
  });

  it('navigates to dashboard on successful login', () => {
    cy.setup();
    cy.login();
    cy.reload();
    cy.url({ timeout: 60000 }).should('contain', '/dashboard');
  });
});

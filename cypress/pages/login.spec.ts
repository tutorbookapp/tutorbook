describe('Login page', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.logout();
  });

  it('contains greeting and links', () => {
    cy.contains('h1', 'Login to Tutorbook');

    cy.contains('Signup here').should('have.attr', 'href', '/default/signup');

    cy.get('header').contains('TB').should('have.attr', 'href', '/');
  });

  it('navigates to dashboard on successful login', () => {
    cy.task('clear');
    cy.task('seed');
    cy.login();
    cy.reload();
    cy.url({ timeout: 60000 }).should('contain', '/dashboard');
  });
});

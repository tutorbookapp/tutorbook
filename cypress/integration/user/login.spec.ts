describe('Login page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.visit('/login');
  });

  it('greets with login prompt', () => {
    cy.contains('h1', 'Login to Tutorbook');
  });

  it('links to sign-up page', () => {
    cy.contains('Signup here').should('have.attr', 'href', '/default/signup');
  });

  it.only('navigates to dashboard on successful login', () => {
    cy.login();
    cy.reload();
    cy.url({ timeout: 60000 }).should('contain', '/dashboard');
  });
});

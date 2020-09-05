describe('Login page', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.logout();
  });

  it('greets with login prompt', () => {
    cy.contains('h1', 'Login to Tutorbook');
  });

  it('links to signup page', () => {
    cy.contains('Signup here').should('have.attr', 'href', '/default/signup');
  });

  it('links to home page', () => {
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

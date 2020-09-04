describe('Login page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('greets with login prompt', () => {
    cy.contains('h1', 'Login to Tutorbook');
  });

  it('links to sign-up page', () => {
    cy.contains('Signup here').should('have.attr', 'href', '/default/signup');
  });

  it('navigates to dashboard on successful login', () => {});
});

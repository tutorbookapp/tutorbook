describe('Dashboard page', () => {
  context('when logged in', () => {
    beforeEach(() => {
      cy.task('clear');
      cy.task('seed');
      cy.visit('/dashboard');
      cy.login();
    });

    it('shows coming soon placeholder', () => {
      cy.contains('COMING SOON');
    });
  });

  context('when not logged in', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('redirects to login page', () => {
      cy.url({ timeout: 60000 }).should('contain', '/login');
    });
  });
});

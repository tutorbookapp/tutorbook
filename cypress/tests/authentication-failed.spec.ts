describe('Authentication failed page', () => {
  beforeEach(() => {
    cy.logout();
    cy.setup(null);
    cy.visit('/authentication-failed');
  });

  it('shows authentication failed message', () => {
    cy.getBySel('page').within(() => {
      cy.get('h3').should('have.text', 'Authentication Failed');
      cy.get('p')
        .should('have.length', 2)
        .first()
        .should(
          'have.text',
          'It looks like you may have clicked on an invalid email verification link.'
        );
      cy.get('p')
        .last()
        .should(
          'have.text',
          'Please close this window and try authenticating again.'
        );
    });

    cy.wait('@get-account');
    cy.percySnapshot('Authentication Failed Page');
  });
});

describe('Authentication failed page', () => {
  it('shows authentication failed message', () => {
    cy.visit('/authentication-failed');

    cy.getBySel('page').find('h3').should('have.text', 'Authentication Failed');
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

    cy.percySnapshot('Authentication Failed Page');
  });
});

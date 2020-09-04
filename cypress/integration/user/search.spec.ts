function onlyFirstNameAndLastInitial(name: string): string {
  const split: string[] = name.trim().split(' ');
  if (split.length === 1) return split[0];
  return `${split[0]} ${split[split.length - 1][0]}.`;
}

describe('Search page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.visit('/default/search');
  });

  it('searches and requests users', () => {
    cy.get('[data-cy=results] li').as('results').should('have.length', 1);
    cy.fixture('user').then((user: Record<string, string>) => {
      cy.get('@results')
        .first()
        .should('not.contain', user.name)
        .and('contain', onlyFirstNameAndLastInitial(user.name))
        .and('contain', user.bio);
    });

    cy.contains('Any subjects').click();
    cy.contains('What would you like to learn?').type('Computer');
    cy.contains('Computer Science').click();

    cy.get('[data-cy=page]').click({ force: true });
    cy.get('[data-cy=results] li').first().should('not.be.disabled').click();

    cy.fixture('request').then((request: Record<string, string>) => {
      cy.contains('What would you like to learn?')
        .children('.mdc-chip')
        .first()
        .should('contain', 'Computer Science');
      cy.contains('What specifically do you need help with?').type(
        request.message
      );

      cy.contains('button', 'Signup and send').click();
      cy.get('[data-cy=loader]').as('loader').should('be.visible');

      cy.get('@loader', { timeout: 60000 }).should('not.be.visible');
    });
  });
});

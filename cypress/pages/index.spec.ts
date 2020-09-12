import user from '../fixtures/user.json';

describe('Landing page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.visit('/');
  });

  it('has collapsible banner', () => {
    cy.get('[data-cy=banner]')
      .should('be.visible')
      .and('contain', 'We stand with the black community.')
      .find('[role=button]')
      .click();
    cy.get('[data-cy=banner]').should('not.be.visible');
  });

  it('leads to search page', () => {
    cy.get('[data-cy=title]')
      .should('have.length', 2)
      .and('contain', 'Learn from and work with an expert');
    cy.get('[data-cy=hero] button').should('contain', 'Search mentors');

    cy.get('header').contains('button', 'Tutors').click();

    cy.get('[data-cy=title]').should(
      'contain',
      'Free tutoring amidst COVID-19.'
    );
    cy.get('[data-cy=hero] button').should('contain', 'Search tutors');

    cy.contains('What would you like to learn?').type('Computer');
    cy.contains('Computer Science').click();
    cy.get('[data-cy=hero] button').first().click();

    cy.url({ timeout: 60000 }).should('contain', '/default/search');
    /*
     *cy.get('header')
     *  .contains('button', 'Tutors')
     *  .should('have.attr', 'aria-selected', true);
     */
  });

  /*
   *  it('shows featured users carousel', () => {
   *    cy.get('[data-cy=carousel]')
   *      .first()
   *      .find('[data-cy=user-card]', { timeout: 60000 })
   *      .should('have.length', 1)
   *      .as('card');
   *
   *    cy.get('@card').find('[data-cy=name]').should('have.text', user.username);
   *    cy.get('@card').find('[data-cy=bio]').should('have.text', user.bio);
   *    cy.get('@card').find('img').should('have.attr', 'src', user.photo);
   *
   *    cy.get('[data-cy=carousel] button').should('not.be.visible');
   *  });
   */
});

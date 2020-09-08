import user from '../../fixtures/user.json';

describe('Landing page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.visit('/');
  });

  it('switches hero based on aspect tabs', () => {
    cy.get('[data-cy=hero]')
      .as('hero')
      .find('[data-cy=title]')
      .as('title')
      .should('contain', 'Learn from and work with an expert');
    cy.get('@hero')
      .find('button')
      .as('button')
      .should('contain', 'Search mentors');
    cy.get('header').contains('button', 'Tutors').click();
    cy.get('@title').should('contain', 'Free tutoring amidst COVID-19.');
    cy.get('@button').should('contain', 'Search tutors');
  });

  it('shows skeleton loading cards', () => {
    cy.get('[data-cy=carousel]').first().as('carousel');
    cy.get('header').contains('button', 'Tutors').click();
    cy.get('@carousel')
      .find('[data-cy=loading-card]')
      .should('be.disabled')
      .and('have.length', 12);
    cy.get('@carousel').find('button:visible').should('have.length', 1);
  });

  it('shows featured user cards', () => {
    cy.get('[data-cy=carousel]')
      .first()
      .find('[data-cy=user-card]')
      .should('be.visible')
      .and('have.length', 1)
      .as('card')
      .find('[data-cy=name]')
      .should('have.text', user.username);
    cy.get('@card').find('[data-cy=bio]').should('have.text', user.bio);
    cy.get('@card').find('img').should('have.attr', 'href', user.photo);
    cy.get('[data-cy=carousel] button').should('not.be.visible');
  });
});

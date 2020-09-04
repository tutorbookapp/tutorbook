describe('Org landing page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.visit('/default');
  });

  it('links to search tutors page', () => {
    cy.contains('Search tutors').should(
      'have.attr',
      'href',
      '/default/search?aspect=tutoring'
    );
  });

  it('links to search mentors page', () => {
    cy.contains('Search mentors').should(
      'have.attr',
      'href',
      '/default/search?aspect=mentoring'
    );
  });

  it('links to tutor sign-up page', () => {
    cy.contains('Become a tutor').should(
      'have.attr',
      'href',
      '/default/signup?aspect=tutoring'
    );
  });

  it('links to mentor sign-up page', () => {
    cy.contains('Become a mentor').should(
      'have.attr',
      'href',
      '/default/signup?aspect=mentoring'
    );
  });
});

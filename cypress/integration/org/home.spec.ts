import org from '../../fixtures/org.json';

describe('Org landing page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.visit(`/${org.id}`);
  });

  it('links to search tutors page', () => {
    cy.contains('Search tutors').should(
      'have.attr',
      'href',
      `/${org.id}/search?aspect=tutoring`
    );
  });

  it('links to search mentors page', () => {
    cy.contains('Search mentors').should(
      'have.attr',
      'href',
      `/${org.id}/search?aspect=mentoring`
    );
  });

  it('links to tutor sign-up page', () => {
    cy.contains('Become a tutor').should(
      'have.attr',
      'href',
      `/${org.id}/signup?aspect=tutoring`
    );
  });

  it('links to mentor sign-up page', () => {
    cy.contains('Become a mentor').should(
      'have.attr',
      'href',
      `/${org.id}/signup?aspect=mentoring`
    );
  });
});

describe('Org landing page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.visit('/default');
  });

  it('lets students search tutors', () => {
    cy.contains('Search tutors').click();
    cy.url({ timeout: 10000 }).should('include', '/default/search');
    cy.contains('Any subjects').click();
    cy.contains('What would you like to learn?').type('Computer');
    cy.contains('Computer Science').click();
    cy.get('[data-cy=page]').click({ force: true });
    cy.get('[data-cy=results] li').first().should('not.be.disabled').click();
    cy.contains('What would you like to learn?')
      .children('.mdc-chip')
      .first()
      .should('contain', 'Computer Science');
    cy.contains('What specifically do you need help with?').type(
      'I could really use your help with learning how to use Cypress for integration and unit tests.'
    );
    cy.contains('button', 'Signup and send').click();
    cy.get('[data-cy=loader]').as('loader').should('be.visible');
    cy.get('@loader', { timeout: 10000 }).should('not.be.visible');
  });

  it('lets volunteers signup', () => {
    cy.contains('Become a tutor').click();
    cy.url({ timeout: 10000 }).should('include', '/default/signup');
    cy.fixture('user').then((user: Record<string, string>) => {
      cy.contains('Your name').type(user.name);
      cy.contains('Your email address')
        .children('input')
        .should('have.attr', 'type', 'email')
        .type(user.email);
      cy.contains('Your phone number')
        .children('input')
        .should('have.attr', 'type', 'tel')
        .type(user.phone);

      cy.contains('Your profile photo')
        .children('input')
        .should('have.prop', 'type', 'file')
        .attachFile('user.jpg');

      cy.contains('What can you tutor?').as('subject-input').type('Computer');
      cy.contains('Computer Science').click();
      cy.get('@subject-input').children('.mdc-chip');

      cy.contains('Qualifications? Interests?').type(user.bio);

      cy.contains('Become a tutor').as('btn').click().should('be.disabled');
      cy.get('[data-cy=loader]').as('loader').should('be.visible');
      cy.get('@loader', { timeout: 10000 }).should('not.be.visible');
      cy.get('@btn').should('contain', 'Update profile');
    });
  });
});

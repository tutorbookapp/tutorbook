import org from '../../fixtures/org.json';
import user from '../../fixtures/user.json';

describe('Profile and sign-up page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.logout();
    cy.visit(`/${org.id}/signup`);
  });

  it('validates email addresses', () => {
    cy.contains('Your email address')
      .children('input')
      .as('email-input')
      .type('invalidemail');
    cy.contains('Become a mentor').click();
    cy.get('@email-input').should('have.attr', 'valid', true);
  });

  it('signs new users up', () => {
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

    cy.contains('What are your fields of expertise?')
      .as('subject-input')
      .type('Computer');
    cy.contains('Computer Science').click();
    cy.get('@subject-input').children('.mdc-chip');

    cy.contains('Qualifications? Interests?').type(user.bio);

    cy.contains('Become a mentor').as('btn').click().should('be.disabled');
    cy.get('[data-cy=loader]').as('loader').should('be.visible');

    cy.get('@loader', { timeout: 60000 }).should('not.be.visible');
    cy.get('@btn').should('contain', 'Update profile');
  });
});

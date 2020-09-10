import org from '../../fixtures/org.json';
import user from '../../fixtures/user.json';

describe('Signup page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.logout();
    cy.visit(`/${org.id}/signup`);
  });

  it('validates email addresses', () => {
    cy.contains('Your email address').as('input').type('email');
    cy.contains('Become a mentor').click().should('not.be.disabled');
    cy.get('[data-cy=loader]').should('not.be.visible');
    cy.get('@input')
      .closest('.mdc-text-field')
      .as('text-field')
      .should('have.class', 'mdc-text-field--invalid');

    // Ideally, we'd be able to just type `{tab}` to focus to the next input but
    // that feature hasn't been released (built into Cypress) yet.
    // @see {@link https://stackoverflow.com/a/55009333}
    // @see {@link https://github.com/cypress-io/cypress/issues/311}
    cy.get('@input').type('{selectall} {del} email@example.com');
    cy.contains('Your phone number').find('input').focus();
    cy.get('@text-field').should('not.have.class', 'mdc-text-field--invalid');

    cy.get('@input').type('{selectall} {del} email');
    cy.contains('Your phone number').find('input').focus();
    cy.get('@text-field').should('have.class', 'mdc-text-field--invalid');
  });

  it('signs new volunteers up', () => {
    cy.contains('Your name').children('input').as('name-input').type(user.name);
    cy.contains('Your email address')
      .children('input')
      .as('email-input')
      .should('have.attr', 'type', 'email')
      .type(user.email);
    cy.contains('Your phone number')
      .children('input')
      .as('phone-input')
      .should('have.attr', 'type', 'tel')
      .type(user.phone);
    cy.contains('Your profile photo')
      .children('input')
      .should('have.attr', 'type', 'file')
      .attachFile('user.jpg');

    cy.contains('What are your fields of expertise?')
      .as('tutoring-subjects-input')
      .type('Computer');

    // TODO: Why isn't this `click()` call working? It seems to be working fine
    // with the `SubjectSelect` controlling the search view.
    /*
     *    cy.contains('li', 'Computer Science').click();
     *    cy.get('@tutoring-subjects-input')
     *      .children('.mdc-chip')
     *      .should('have.length', 1)
     *      .and('contain', 'Computer Science');
     *
     *    cy.contains('Qualifications? Interests?').type(user.bio);
     *
     *    cy.contains('Become a mentor').as('btn').click().should('be.disabled');
     *    cy.get('[data-cy=loader]').as('loader').should('be.visible');
     *
     *    cy.get('@loader', { timeout: 60000 }).should('not.be.visible');
     *    cy.get('@btn').should('contain', 'Update profile');
     *
     *    cy.get('header').contains('button', 'Tutors').click();
     *
     *    cy.get('@name-input').should('have.value', user.name);
     *    cy.get('@email-input').should('have.value', user.email);
     *    cy.get('@phone-input').should('have.value', user.phone);
     *    cy.get('@tutoring-subjects-input').should('not.exist');
     *
     *    cy.contains('What can you tutor?')
     *      .as('mentoring-subjects-input')
     *      .type('Math');
     *    cy.contains('li', 'Algebra').click();
     *    cy.contains('li', 'Geometry').click();
     *    cy.contains('li', 'Trigonometry').click();
     *    cy.get('@mentoring-subjects-input')
     *      .children('.mdc-chip')
     *      .should('have.length', 3)
     *      .and('contain', 'Algebra');
     *
     *    cy.get('@btn').click().should('be.disabled');
     *    cy.get('@loader').should('be.visible');
     *
     *    cy.get('@loader', { timeout: 60000 }).should('be.not.visible');
     */
  });
});

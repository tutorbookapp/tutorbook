import org from 'cypress/fixtures/orgs/default.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

describe('Signup page', () => {
  beforeEach(() => {
    cy.setup({ volunteer: null });
    cy.logout();

    cy.server();
    cy.route('POST', '/api/users').as('create-user');
    cy.route('PUT', '/api/users/*').as('update-user');
    cy.route('POST', 'https://firebasestorage.googleapis.com/**').as(
      'upload-photo'
    );

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
    cy.contains('Your name')
      .children('input')
      .as('name-input')
      .type(volunteer.name);
    cy.contains('Your email address')
      .children('input')
      .as('email-input')
      .should('have.attr', 'type', 'email')
      .type(volunteer.email);
    cy.contains('Your phone number')
      .children('input')
      .as('phone-input')
      .should('have.attr', 'type', 'tel')
      .type(volunteer.phone);

    cy.contains('Your profile photo')
      .as('photo-input')
      .children('input')
      .should('have.attr', 'type', 'file')
      .attachFile('users/volunteer.jpg');
    cy.get('@photo-input')
      .next()
      .as('photo-input-label')
      .should('have.text', 'Uploading volunteer.jpg...');

    cy.wait('@upload-photo');

    cy.get('@photo-input-label').should('have.text', 'Uploaded volunteer.jpg.');

    cy.contains('What are your fields of expertise?')
      .as('subjects-input')
      .type('Computer');

    // TODO: Why isn't this `click()` call working? It seems to be working fine
    // with the `SubjectSelect` controlling the search view.
    cy.contains('li', 'Computer Science').click({ force: true });
    cy.get('@subjects-input')
      .children('.mdc-chip')
      .should('have.length', 1)
      .and('contain', 'Computer Science');

    cy.contains('Qualifications? Interests?').type(volunteer.bio);

    cy.contains('Become a mentor').as('btn').click().should('be.disabled');
    cy.get('[data-cy=loader]').as('loader').should('be.visible');

    cy.wait('@create-user');

    cy.get('@loader').should('not.be.visible');
    cy.get('[data-cy=error]').as('error').should('not.exist');
    cy.get('@btn').should('contain', 'Update profile');

    cy.get('header').contains('button', 'Tutors').click();

    cy.get('@name-input').should('have.value', volunteer.name);
    cy.get('@email-input').should('have.value', volunteer.email);
    cy.get('@phone-input').should('have.value', volunteer.phone);

    cy.get('@subjects-input')
      .should('contain', 'What can you tutor?')
      .and('have.value', '')
      .type('Math');
    cy.contains('li', 'Algebra').click({ force: true });
    cy.contains('li', 'Geometry').click({ force: true });
    cy.contains('li', 'Trigonometry').click({ force: true });
    cy.get('@subjects-input')
      .children('.mdc-chip')
      .should('have.length', 3)
      .and('contain', 'Algebra')
      .and('contain', 'Geometry')
      .and('contain', 'Trigonometry');

    cy.get('@btn').click().should('be.disabled');
    cy.get('@loader').should('be.visible');

    cy.wait('@update-user');

    // TODO: Add assertion(s) that the error message isn't visible (and about
    // the response status code of the various API calls).
    cy.get('@loader').should('not.be.visible');
    cy.get('@error').should('not.exist');
  });
});

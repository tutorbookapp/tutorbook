import org from 'cypress/fixtures/orgs/default.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

describe('Signup page', () => {
  beforeEach(() => {
    cy.setup({ student: null, volunteer: null, match: null, meeting: null });
    cy.logout();
    cy.visit(`/${org.id}/signup`);
  });

  it('validates email addresses', () => {
    cy.contains('Your email address').find('input').as('input').type('email');
    cy.contains('Create profile').click().should('not.be.disabled');
    cy.getBySel('loader').should('not.be.visible');
    cy.get('@input')
      .closest('.mdc-text-field')
      .as('text-field')
      .should('have.class', 'mdc-text-field--invalid');

    // Ideally, we'd be able to just type `{tab}` to focus to the next input but
    // that feature hasn't been released (built into Cypress) yet.
    // @see {@link https://stackoverflow.com/a/55009333}
    // @see {@link https://github.com/cypress-io/cypress/issues/311}
    cy.get('@input').clear().type('email@example.com');
    cy.contains('Your phone number').find('input').focus();
    cy.get('@text-field').should('not.have.class', 'mdc-text-field--invalid');

    cy.get('@input').clear().type('email');
    cy.contains('Your phone number').find('input').focus();
    cy.get('@text-field').should('have.class', 'mdc-text-field--invalid');
  });

  it('shows photo upload errors', () => {
    cy.intercept('POST', 'https://firebasestorage.googleapis.com/**', {
      delay: 1000,
      statusCode: 401,
    }).as('upload-photo');

    cy.contains('Your profile photo').as('photo-input');
    cy.get('@photo-input').next().children('p').as('photo-input-label');

    cy.get('@photo-input')
      .children('input')
      .should('have.attr', 'type', 'file')
      .attachFile('users/volunteer.jpg');
    cy.get('@photo-input-label')
      .should('be.visible')
      .and('have.text', 'Uploading volunteer.jpg...');
    cy.percySnapshot('Signup Page with Photo Uploading');

    cy.wait('@upload-photo');

    cy.get('@photo-input').should('have.class', 'mdc-text-field--invalid');
    cy.get('@photo-input-label')
      .should('have.class', 'mdc-text-field-helper-text--validation-msg')
      .and('contain', 'An error occurred while uploading volunteer.jpg.');
    cy.percySnapshot('Signup Page with Photo Errored');
  });

  it('signs new volunteers up', () => {
    cy.intercept('POST', 'https://firebasestorage.googleapis.com/**', {
      fixture: 'users/volunteer.jpg.json',
    }).as('upload-photo');
    cy.intercept('GET', 'https://firebasestorage.googleapis.com/**', {
      fixture: 'users/volunteer.jpg.json',
    }).as('get-photo');

    cy.percySnapshot('Signup Page');

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

    // TODO: Test this in different locales to ensure that the current locale is
    // always properly pre-selected.
    cy.contains('What languages do you speak?')
      .as('langs-input')
      .children('.mdc-chip')
      .should('have.length', 1)
      .and('contain', 'English');
    cy.get('@langs-input').type('Span');
    cy.contains('li:visible', 'Spanish').trigger('click');
    cy.get('@langs-input')
      .children('.mdc-chip')
      .should('have.length', 2)
      .last()
      .should('contain', 'Spanish');

    cy.contains('What are your fields of expertise?')
      .as('subjects-input')
      .type('Computer');

    // TODO: Why isn't this `click()` call working? It seems to be working fine
    // with the `SubjectSelect` controlling the search view.
    cy.contains('li:visible', 'Computer Science')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.get('@subjects-input')
      .children('.mdc-chip')
      .should('have.length', 1)
      .and('contain', 'Computer Science');
    cy.percySnapshot('Signup Page with Subject Selected');

    cy.contains('Qualifications? Interests?').type(volunteer.bio);
    cy.percySnapshot('Signup Page with Bio Populated');

    cy.contains('Create profile').as('btn').click();
    cy.getBySel('loader').as('loader').should('not.be.visible');
    cy.contains('Your profile photo')
      .as('photo-input')
      .should('have.class', 'mdc-text-field--invalid');
    cy.get('@photo-input')
      .next()
      .as('photo-input-label')
      .should(
        'have.text',
        'Please click the text field above to upload a photo.'
      );
    cy.percySnapshot('Signup Page with Invalid Photo');

    // TODO: Assert that clicking on this button triggers a click on the input.
    cy.get('@photo-input').children('button').click();
    cy.get('@photo-input')
      .children('input')
      .should('have.attr', 'type', 'file')
      .attachFile('users/volunteer.jpg');
    cy.get('@photo-input-label')
      .should('be.visible')
      .and('have.text', 'Uploading volunteer.jpg...');
    cy.percySnapshot('Signup Page with Photo Uploading');

    cy.wait('@upload-photo');
    cy.wait('@get-photo');

    cy.get('@photo-input-label').should('have.text', 'Uploaded volunteer.jpg.');
    cy.percySnapshot('Signup Page with Photo Uploaded');

    cy.get('@btn').click().should('be.disabled');
    cy.getBySel('loader').as('loader').should('be.visible');
    cy.percySnapshot('Signup Page in Loading State');

    cy.wait('@create-user');

    // TODO: Right now, it takes a second for our app to update the local data
    // after receiving the API response. We should account for that instead of
    // just arbitrarily waiting 60secs before our assertion fails.
    cy.get('@loader', { timeout: 60000 }).should('not.be.visible');
    cy.getBySel('error').as('error').should('not.exist');
    cy.get('@btn').should('contain', 'Update profile');

    cy.get('header').contains('button', 'Tutors').click();

    cy.get('@name-input').should('have.value', volunteer.name);
    cy.get('@email-input').should('have.value', volunteer.email);
    cy.get('@phone-input').should('have.value', volunteer.phone);

    cy.get('@subjects-input')
      .should('contain', 'What can you tutor?')
      .and('have.value', '')
      .type('Math');
    cy.contains('li:visible', 'Algebra').trigger('click');
    cy.contains('li:visible', 'Geometry').trigger('click');
    cy.contains('li:visible', 'Trigonometry').trigger('click');
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
    cy.get('@loader', { timeout: 60000 }).should('not.be.visible');
    cy.get('@error').should('not.exist');
  });
});

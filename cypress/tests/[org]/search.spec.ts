import admin from 'cypress/fixtures/users/admin.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';

import request from 'cypress/fixtures/request.json';

import { onlyFirstNameAndLastInitial } from 'lib/api/helpers/truncation';

function waitForResults() {
  cy.wait('@list-users');
  cy.getBySel('results').find('li').should('have.length', 2).as('results');
  cy.get('@results')
    .eq(0)
    .should('not.contain', volunteer.name)
    .and('contain', onlyFirstNameAndLastInitial(volunteer.name))
    .and('contain', volunteer.bio)
    .find('img')
    .should('have.attr', 'src', volunteer.photo);
  cy.get('@results')
    .eq(1)
    .should('not.contain', admin.name)
    .and('contain', onlyFirstNameAndLastInitial(admin.name))
    .and('contain', admin.bio)
    .find('img')
    .should('have.attr', 'src', admin.photo);
}

describe('Search page', () => {
  beforeEach(() => {
    cy.server();
    cy.route('GET', '/api/users*').as('list-users');
    cy.route('GET', '/api/account').as('get-account');
    cy.route('POST', '/api/matches').as('create-match');
  });

  it('restricts access to school data', () => {
    cy.setup();
    cy.logout();
    cy.visit(`/${school.id}/search`, {
      onBeforeLoad(win: Window): void {
        cy.stub(win, 'open');
      },
    });

    cy.getBySel('results')
      .find('li')
      .should('have.css', 'cursor', 'not-allowed')
      .and('have.attr', 'disabled');

    cy.wait('@get-account');
    cy.get('.mdc-dialog--open')
      .as('dialog')
      .should('contain', `Login to ${school.name}`);
    cy.get('@dialog')
      .find('p')
      .should(
        'have.text',
        `You must be a part of ${school.name} to see these search results. ` +
          `Please login with your ${school.domains
            .map((domain: string) => `@${domain}`)
            .join(' or ')} email address and try again.`
      );

    cy.get('@dialog').click('left');
    cy.get('@dialog').should('have.class', 'mdc-dialog--open');
    cy.get('@dialog').trigger('keyup', { keyCode: 27 });
    cy.get('@dialog').should('have.class', 'mdc-dialog--open');

    cy.contains('button', 'Continue with Google').click().should('be.disabled');
    cy.getBySel('loader').should('be.visible');

    cy.window().its('open').should('be.called');

    cy.getBySel('loader').should('not.be.visible');
    cy.getBySel('error')
      .should('be.visible')
      .and('contain', 'Unable to establish a connection with the popup.');

    cy.getBySel('results')
      .find('li')
      .should('have.css', 'cursor', 'not-allowed')
      .and('have.attr', 'disabled');
  });

  // TODO: Create test where the user is already logged in (and then ping
  // SendGrid to ensure that our email notifications were sent).
  it('allows authorized access to org data', () => {
    cy.setup();
    cy.login(student.id);
    cy.visit(`/${school.id}/search`);

    cy.wait('@get-account');
    cy.get('.mdc-dialog--open').should('not.exist');

    waitForResults();

    cy.getBySel('results').find('li').first().click();
    cy.get('.mdc-dialog--open')
      .should('be.visible')
      .and('contain', 'Send request')
      .contains('Your phone number')
      .should('not.exist');
  });

  it('collects phone before sending requests', () => {
    cy.setup({ student: { phone: null } });
    cy.login(student.id);
    cy.visit(`/${school.id}/search`);
    cy.wait('@get-account');

    waitForResults();

    cy.getBySel('results').find('li').first().click();
    cy.get('.mdc-dialog--open')
      .should('be.visible')
      .as('dialog')
      .contains('Your phone number')
      .find('input')
      .should('have.value', '')
      .and('have.attr', 'type', 'tel')
      .and('have.attr', 'required');

    cy.get('@dialog').contains('Your phone number').type(student.phone);
    cy.get('@dialog')
      .contains('What would you like to learn?')
      .as('subject-input')
      .type('Chem');
    cy.contains('No subjects').should('be.visible');
    cy.get('@subject-input').type('{selectall}{del}Computer');
    cy.contains('li', 'Computer Science').click();
    cy.get('@dialog')
      .contains('What specifically do you need help with?')
      .type(request.message);

    cy.contains('button', 'Send request').click().should('be.disabled');
    cy.getBySel('loader').should('be.visible');

    cy.wait('@create-match');

    cy.getBySel('loader').should('not.be.visible');
    cy.getBySel('error').should('not.exist');
  });

  it('signs users up and sends requests', () => {
    cy.setup({ student: null });
    cy.logout();
    // TODO: Refactor the `search.spec.ts` into two specs (one for the default
    // search view and one for when a user slug is passed along with the URL).
    cy.visit(`/${org.id}/search`, {
      onBeforeLoad(win: Window): void {
        cy.stub(win, 'open');
      },
    });
    cy.wait('@get-account');

    waitForResults();

    cy.contains('button', 'Any subjects').click();
    cy.focused()
      .type('Artificial')
      .closest('label')
      .should('contain', 'What would you like to learn?');
    cy.contains('li', 'Artificial Intelligence').click();

    cy.getBySel('page').click({ force: true });
    cy.getBySel('results').find('li').first().should('not.be.disabled').click();

    cy.getBySel('request-dialog').should('be.visible').as('dialog');
    cy.get('@dialog').find('[data-cy=bio]').should('have.text', volunteer.bio);
    cy.get('@dialog')
      .find('[data-cy=name]')
      .should('have.text', onlyFirstNameAndLastInitial(volunteer.name));
    cy.get('@dialog')
      .find('[data-cy=socials] a')
      .should('have.length', volunteer.socials.length);

    volunteer.socials.forEach((social: Record<string, string>) => {
      cy.getBySel(`${social.type}-social-link`)
        .should('have.attr', 'href', social.url)
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noreferrer');
    });

    cy.contains('What would you like to learn?')
      .children('.mdc-chip')
      .should('have.length', 1)
      .and('contain', 'Artificial Intelligence');
    cy.contains('What specifically do you need help with?')
      .click()
      .should('have.class', 'mdc-text-field--focused')
      .type(request.message);

    cy.contains('button', 'Signup and send').click().should('be.disabled');
    cy.getBySel('loader').should('be.visible');

    // TODO: Stub out the Google OAuth response using the Google OAuth
    // server-side REST API. That way, we can test this programmatically.
    cy.window().its('open').should('be.called');

    cy.getBySel('loader').should('not.be.visible');
    cy.getBySel('error')
      .should('be.visible')
      .and('contain', 'Unable to establish a connection with the popup.');
  });
});

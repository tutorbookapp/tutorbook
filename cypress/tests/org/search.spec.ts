import { DayAlias, getDaysInMonth, getNextDateWithDay } from 'lib/utils/time';
import { onlyFirstNameAndLastInitial } from 'lib/api/get/truncated-users';

import admin from 'cypress/fixtures/users/admin.json';
import match from 'cypress/fixtures/match.json';
import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

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

function selectTime() {
  cy.contains('When would you like to meet?')
    .children('input')
    .as('time-input')
    .focus();
  cy.getBySel('time-select-surface').should('be.visible');

  cy.getBySel('prev-month-button').should('be.disabled');
  cy.getBySel('next-month-button')
    .click()
    .click()
    .click()
    .should('be.disabled');
  cy.getBySel('prev-month-button').click().click().click();

  const now = new Date();
  cy.getBySel('selected-month').should(
    'have.text',
    now.toLocaleString('en', {
      month: 'long',
      year: 'numeric',
    })
  );
  cy.getBySel('day-button')
    .as('days')
    .should('have.length', getDaysInMonth(now.getMonth()))
    .eq(now.getDay())
    .should('have.attr', 'aria-selected', 'true')
    .and('have.css', 'background-color', 'rgb(0, 112, 243)');

  function dayIdx(day: DayAlias): number {
    return getNextDateWithDay(day, now).getDate() - 1;
  }

  // Only the days when John Doe is available should be clickable.
  cy.get('@days').eq(dayIdx(0)).should('not.be.disabled');
  cy.get('@days').eq(dayIdx(1)).should('be.disabled');
  cy.get('@days').eq(dayIdx(2)).should('not.be.disabled');
  cy.get('@days').eq(dayIdx(3)).should('be.disabled');
  cy.get('@days').eq(dayIdx(4)).should('be.disabled');
  cy.get('@days').eq(dayIdx(5)).should('not.be.disabled');
  cy.get('@days').eq(dayIdx(6)).should('be.disabled');

  const selected = getNextDateWithDay(0, now);
  selected.setHours(9, 0, 0, 0);
  cy.get('@days')
    .eq(selected.getDate() - 1)
    .click()
    .should('have.attr', 'aria-selected', 'true')
    .and('have.css', 'background-color', 'rgb(0, 112, 243)');
  cy.getBySel('selected-day')
    .should('be.visible')
    .and(
      'have.text',
      selected.toLocaleString('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    );

  // John Doe is available on Sundays 9am-12pm and 1-4pm. These are the times
  // that should be shown to the user (30min timeslots in 15min intervals).
  [
    ['9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM', '10:00 AM', '10:15 AM'],
    ['10:30 AM', '10:45 AM', '11:00 AM', '11:15 AM', '11:30 AM', '1:00 PM'],
    ['1:15 PM', '1:30 PM', '1:45 PM', '2:00 PM', '2:15 PM', '2:30 PM'],
    ['2:45 PM', '3:00 PM', '3:15 PM', '3:30 PM'],
  ]
    .reduce((a, c) => a.concat(c))
    .forEach((time: string, idx: number) => {
      cy.getBySel('time-button').eq(idx).should('have.text', time);
    });
  cy.getBySel('time-button').first().click();
  cy.get('@time-input')
    .should('not.be.focused')
    .and(
      'have.value',
      `${selected.toLocaleString('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })} - 9:30 AM`
    );
}

describe('Search page', () => {
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

    // TODO: Find some way to trick the application into thinking that it was
    // logged in successfully so we can make assertions about the user being
    // created and subsequently logged in.
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

  // TODO: Ping SendGrid to ensure that our email notifications were sent.
  it('collects phone before sending matches', () => {
    cy.setup({ student: { phone: '' } });
    cy.login(student.id);
    cy.visit(`/${school.id}/search`);

    cy.wait('@get-account');
    cy.get('.mdc-dialog--open').should('not.exist');

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

    selectTime();

    cy.get('@dialog')
      .contains('What specifically do you need help with?')
      .type(match.message);

    cy.contains('button', 'Send match').click().should('be.disabled');
    cy.getBySel('loader').should('be.visible');

    // TODO: Make assertions about the content within our Firestore database
    // simulator to ensure that it matches what we submitted.
    cy.wait('@create-match');

    cy.getBySel('loader').should('not.be.visible');
    cy.getBySel('error').should('not.exist');
  });

  it('signs users up and sends matches', () => {
    cy.setup({ student: null, match: null });
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

    // TODO: Add tests for filtering by languages and availability as well.
    cy.contains('button', 'Any subjects').click();
    cy.focused()
      .type('Artificial')
      .closest('label')
      .should('contain', 'What would you like to learn?');
    cy.contains('li', 'Artificial Intelligence').click();

    cy.getBySel('page').click({ force: true });
    cy.wait('@list-users');
    cy.getBySel('results')
      .find('li')
      .should('have.length', 1)
      .first()
      .should('not.have.attr', 'disabled', '')
      .click();

    cy.getBySel('match-dialog').should('be.visible').as('dialog');
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

    selectTime();

    cy.contains('What specifically do you need help with?')
      .click()
      .should('have.class', 'mdc-text-field--focused')
      .type(match.message);

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

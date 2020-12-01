import { getDaysInMonth, getNextDateWithDay } from 'lib/utils/time';
import { onlyFirstNameAndLastInitial } from 'lib/api/get/truncated-user';

import match from 'cypress/fixtures/match.json';
import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

// TODO: The time selected and pre-selected date changes based on the current
// date. B/c of this, our visual snapshot tests are useless. Instead, we should
// use `cy.clock()` to manually set the time and control when it changes.
function selectTime(): void {
  cy.contains('When would you like to meet?')
    .children('input')
    .as('time-input')
    .focus();
  cy.getBySel('time-select-surface').should('be.visible');

  // TODO: Why doesn't the `cy.click()` command work here?
  cy.getBySel('prev-month-button').should('be.disabled');
  cy.getBySel('next-month-button')
    .trigger('click')
    .trigger('click')
    .trigger('click')
    .should('be.disabled');
  cy.getBySel('prev-month-button')
    .trigger('click')
    .trigger('click')
    .trigger('click')
    .should('be.disabled');

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
    .eq(now.getDate() - 1)
    .should('have.attr', 'aria-selected', 'true')
    .and('have.css', 'background-color', 'rgb(0, 112, 243)');

  const monthBeginning = new Date(now.getFullYear(), now.getMonth());
  function dayIdx(day: number): number {
    return getNextDateWithDay(day, monthBeginning).getDate() - 1;
  }

  // Only the days when John Doe is available should be clickable.
  cy.get('@days').eq(dayIdx(0)).should('not.be.disabled');
  cy.get('@days').eq(dayIdx(1)).should('be.disabled');
  cy.get('@days').eq(dayIdx(2)).should('not.be.disabled');
  cy.get('@days').eq(dayIdx(3)).should('be.disabled');
  cy.get('@days').eq(dayIdx(4)).should('be.disabled');
  cy.get('@days').eq(dayIdx(5)).should('not.be.disabled');
  cy.get('@days').eq(dayIdx(6)).should('be.disabled');
  cy.percySnapshot('User Display Page with Time Select Open');

  // TODO: We won't let bookings in the past so this will sometimes fail.
  const selected = getNextDateWithDay(0, monthBeginning);
  selected.setHours(9, 0, 0, 0);
  cy.get('@days')
    .eq(selected.getDate() - 1)
    .trigger('click')
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
  cy.percySnapshot('User Display Page with Date Selected');

  cy.getBySel('time-button').first().trigger('click');
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
  cy.percySnapshot('User Display Page with Time Selected');
}

// TODO: Test flashes of truncated data, edit and vet action links, request form
// behavior, subjects displayed (based on org and query aspect), etc.
describe('User display page', () => {
  it('shows not found error for missing users', () => {
    cy.setup({ volunteer: null, match: null, meeting: null });
    cy.login(student.id);
    cy.visit(`/${org.id}/users/${volunteer.id}`);

    cy.loading().percySnapshot('User Display Page in Loading State');
    cy.loading(false, { timeout: 60000 }).should('be.404');
  });

  it('collects phone before sending requests', () => {
    cy.setup({ student: { phone: '' } });
    cy.login(student.id);
    cy.visit(`/${school.id}/users/${volunteer.id}`);
    cy.wait('@get-user', { timeout: 60000 });

    cy.getBySel('user-display').within(() => {
      cy.getBySel('bio').should('have.text', volunteer.bio);
      cy.getBySel('name').should(
        'have.text',
        onlyFirstNameAndLastInitial(volunteer.name)
      );
      cy.getBySel('avatar')
        .should('have.img', volunteer.photo, 260)
        .closest('a')
        .should('have.attr', 'href', volunteer.photo);
      cy.getBySel('socials')
        .find('a')
        .should('have.length', volunteer.socials.length);

      volunteer.socials.forEach((social: Record<string, string>) => {
        cy.getBySel(`${social.type}-social-link`)
          .should('have.attr', 'href', social.url)
          .and('have.attr', 'target', '_blank')
          .and('have.attr', 'rel', 'noreferrer');
      });
    });

    cy.getBySel('subjects')
      .should('contain', 'Computer Science')
      .and('contain', 'Math');
    cy.getBySel('langs').should('contain', 'English').and('contain', 'Spanish');
    cy.percySnapshot('User Display Page');

    cy.contains('Your phone number')
      .find('input')
      .should('have.value', '')
      .and('have.attr', 'type', 'tel')
      .and('have.attr', 'required', 'required')
      .type(student.phone);
    cy.percySnapshot('User Display Page with Phone Populated');

    cy.contains('What would you like to learn?')
      .as('subject-input')
      .type('Chem');
    cy.contains('No subjects').should('be.visible');
    cy.percySnapshot('User Display Page with No Subjects');

    cy.get('@subject-input').type('{selectall}{del}Computer');
    cy.contains('li', 'Computer Science')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.percySnapshot('User Display Page with Subject Selected');

    selectTime();

    cy.contains('What specifically do you need help with?')
      .click()
      .should('have.class', 'mdc-text-field--focused')
      .type(match.message);
    cy.percySnapshot('User Display Page with Message Populated');

    cy.contains('button', 'Send request').click().should('be.disabled');
    cy.getBySel('loader')
      .should('be.visible')
      .find('svg')
      .should('have.attr', 'data-cy-checked', 'false');
    cy.percySnapshot('User Display Page in Loading State');

    // TODO: Make assertions about the content within our Firestore database
    // simulator and SendGrid API to ensure that it matches what we submitted.
    cy.wait('@create-match');

    cy.getBySel('loader')
      .find('svg')
      .should('have.attr', 'data-cy-checked', 'true');
    cy.getBySel('error').should('not.exist');
    cy.percySnapshot('User Display Page with Checkmark');
  });

  it('signs users up before sending requests', () => {
    cy.setup({ student: null, match: null, meeting: null });
    cy.logout();
    cy.visit(`/${org.id}/users/${volunteer.id}`, {
      onBeforeLoad(win: Window): void {
        cy.stub(win, 'open');
      },
    });
    cy.wait('@get-user', { timeout: 60000 });
    cy.percySnapshot('User Display Page with Signup Button');

    // TODO: Instead, shift-click all of the available subjects.
    cy.contains('What would you like to learn?').type('Artificial');
    cy.contains('li', 'Artificial Intelligence')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');

    selectTime();

    cy.contains('What specifically do you need help with?').type(match.message);

    cy.contains('button', 'Signup and send').click().should('be.disabled');
    cy.getBySel('loader').should('be.visible');
    cy.percySnapshot('User Display Page with Signup Button in Loading State');

    // TODO: Stub out the Google OAuth response using the Google OAuth
    // server-side REST API. That way, we can test this programmatically.
    cy.window().its('open').should('be.called');

    cy.getBySel('loader').should('not.be.visible');
    cy.getBySel('error')
      .should('be.visible')
      .and('contain', 'Unable to establish a connection with the popup.');
    cy.percySnapshot('User Display Page with Google Error');
  });
});

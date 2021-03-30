import { nanoid } from 'nanoid';

import { getDateWithDay, getDaysInMonth } from 'lib/utils/time';
import { onlyFirstNameAndLastInitial } from 'lib/api/get/truncated-user';

import child from 'cypress/fixtures/users/child.json';
import match from 'cypress/fixtures/match.json';
import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

// John Doe is available on Sundays 9am-12pm and 1-4pm. These are the times that
// should be shown to the user (30min timeslots in 15min intervals).
function getTimeOptions(): string[] {
  const start = new Date(0);
  const times: string[] = [];
  let hour = new Date(volunteer.availability[0].from).getHours();
  let min = 0;

  function addTimes(): void {
    start.setHours(hour);
    start.setMinutes(min);
    times.push(
      start.toLocaleString('en', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
    );
    if (min === 45) {
      hour += 1;
      min = 0;
    } else {
      min += 15;
    }
  }

  while (hour < 12) addTimes(); // Sundays from 9am-12pm.

  // Remove the last time which is invalid (e.g. 11:45am isn't within the 30min
  // window of the end time of 12pm b/c we didn't include that complex logic).
  times.pop();
  times.pop();
  times.pop();

  hour = new Date(volunteer.availability[1].from).getHours();
  while (hour < 16) addTimes(); // Sundays from 1-4pm.
  times.pop();
  times.pop();
  times.pop();

  return times;
}

// TODO: The time selected and pre-selected date changes based on the current
// date. B/c of this, our visual snapshot tests are useless. Instead, we should
// use `cy.clock()` to manually set the time and control when it changes.
function selectTime(they: boolean = false): void {
  cy.contains(`When would ${they ? 'they' : 'you'} like to meet?`)
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

  // Days in the past should be disabled.
  let past = new Date(now.getFullYear(), now.getMonth());
  while (past < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    cy.get('@days')
      .eq(past.getDate() - 1)
      .should('be.disabled');
    past = new Date(past.getFullYear(), past.getMonth(), past.getDate() + 1);
  }

  // Only the days when John Doe is available should be clickable.
  function dayIsAvailable(day: number, available: boolean): void {
    // Don't error when all the timeslots for the current (usually available)
    // date are already in the past (i.e. changes based on when our CI is run).
    const tmrw = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (tmrw.getMonth() !== now.getMonth()) return;
    const date = getDateWithDay(day, tmrw);
    if (date.getMonth() !== now.getMonth()) return;
    cy.get('@days')
      .eq(date.getDate() - 1)
      .should(available ? 'not.be.disabled' : 'be.disabled');
  }

  // TODO: Perhaps test these for a month in the future so we don't have to
  // worry about days in the past being disabled or not. Or test both cases.
  dayIsAvailable(0, true);
  dayIsAvailable(1, false);
  dayIsAvailable(2, true);
  dayIsAvailable(3, false);
  dayIsAvailable(4, false);
  dayIsAvailable(5, true);
  dayIsAvailable(6, false);

  // TODO: Why can't we use `percySnapshot()` within these helper functions?
  // cy.percySnapshot('User Display Page with Time Select Open');

  const selected = getDateWithDay(
    0,
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      new Date(volunteer.availability[0].from).getHours()
    )
  );

  if (selected.getMonth() === now.getMonth() + 1)
    cy.getBySel('next-month-button').trigger('click');

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

  // TODO: Create a meeting and assert that it's time isn't included in the
  // times available here (e.g. a meeting from 9-9:30am removes those options).
  getTimeOptions().forEach((time: string, idx: number) => {
    cy.getBySel('time-button').eq(idx).should('have.text', time);
  });

  // TODO: Why can't we use `percySnapshot()` within these helper functions?
  // cy.percySnapshot('User Display Page with Date Selected');

  const timeString = `${selected
    .toLocaleString('en', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
    .replace(' AM', '')
    .replace(' PM', '')}–${new Date(
    selected.valueOf() + 60 * 60 * 1000
  ).toLocaleString('en', {
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  })}`;
  cy.getBySel('time-button')
    .first()
    .should(
      'have.text',
      selected.toLocaleString('en', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })
    )
    .trigger('click');
  cy.get('@time-input').should('not.be.focused').and('have.value', timeString);

  // TODO: Why can't we use `percySnapshot()` within these helper functions?
  // cy.percySnapshot('User Display Page with Time Selected');
}

// TODO: Test flashes of truncated data, edit and vet action links, request form
// behavior, subjects displayed (based on org and query aspect), etc.
describe('User display page', () => {
  it('shows not found error for missing users', () => {
    cy.setup(null);
    cy.logout();
    cy.visit(`/${org.id}/users/${nanoid()}`, { failOnStatusCode: false });

    cy.loading().percySnapshot('User Display Page in Fallback State');
    cy.loading(false, { timeout: 60000 });

    cy.getBySel('page').within(() => {
      cy.get('h3').should('have.text', '404 - Page Not Found');
      cy.get('p').should(
        'have.text',
        "The requested page doesn't exist or you don't have access to it."
      );
    });
    cy.percySnapshot('Not Found Page');
  });

  it('collects profiles before booking meetings', () => {
    cy.setup({
      student: { phone: '', reference: '' },
      school: { profiles: ['phone', 'reference'] },
      meeting: null,
      match: null,
    });
    cy.login(student.id);
    cy.visit(`/${school.id}/users/${volunteer.id}`);
    cy.wait('@get-user', { timeout: 60000 });

    cy.getBySel('user-display').within(() => {
      cy.getBySel('name').should(
        'have.text',
        onlyFirstNameAndLastInitial(volunteer.name)
      );
      cy.getBySel('socials')
        .find('a')
        .should('have.length', volunteer.socials.length);
      volunteer.socials.forEach((social: Record<string, string>) => {
        cy.getBySel(`${social.type}-social-link`)
          .should('have.attr', 'href', social.url)
          .and('have.attr', 'target', '_blank')
          .and('have.attr', 'rel', 'noopener noreferrer');
      });

      cy.getBySel('avatar')
        .should('have.img', volunteer.photo)
        .closest('a')
        .should('have.attr', 'href', volunteer.photo);
      cy.getBySel('backdrop')
        .should('have.img', volunteer.background)
        .closest('a')
        .should('have.attr', 'href', volunteer.background);

      cy.getBySel('bio').should('have.text', volunteer.bio);
      cy.getBySel('subjects')
        .should('not.contain', 'Artificial Intelligence')
        .and('contain', 'Computer Science')
        .and('contain', 'Math');
      cy.getBySel('langs')
        .should('contain', 'English')
        .and('contain', 'Spanish');
      cy.percySnapshot('User Display Page');
    });

    cy.contains('.mdc-select', 'Who needs help?')
      .find('.mdc-select__selected-text')
      .should('have.text', 'Me');

    cy.contains('What would you like to learn?')
      .as('subject-input')
      .type('Chem');
    cy.contains('No subjects').should('be.visible');
    cy.percySnapshot('User Display Page with No Subjects');

    cy.get('@subject-input').find('textarea').clear().type('Computer');
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

    cy.contains('Your phone number')
      .as('phone-input')
      .find('input')
      .should('have.value', '')
      .and('have.attr', 'type', 'tel')
      .and('have.attr', 'required', 'required')
      .type(student.phone);
    cy.percySnapshot('User Display Page with Phone Populated');

    cy.contains(`How did you hear about ${school.name}?`)
      .as('reference-input')
      .find('textarea')
      .should('have.value', '')
      .and('have.attr', 'required', 'required')
      .type(student.reference);
    cy.percySnapshot('User Display Page with Reference Populated');

    cy.contains('button', 'Book meeting').click().should('be.disabled');
    cy.getBySel('loader')
      .should('be.visible')
      .find('svg')
      .should('have.attr', 'data-cy-checked', 'false');
    cy.percySnapshot('User Display Page in Loading State');

    // TODO: Make assertions about the content within our Firestore database
    // simulator and SendGrid API to ensure that it matches what we submitted.
    cy.wait('@update-account');
    cy.get('@phone-input').should('not.exist');
    cy.get('@reference-input').should('not.exist');

    cy.wait('@create-meeting');

    cy.getBySel('loader')
      .find('svg')
      .should('have.attr', 'data-cy-checked', 'true');
    cy.getBySel('error').should('not.exist');
    cy.percySnapshot('User Display Page with Checkmark');
  });

  it('lets parents book meetings for their kids', () => {
    cy.setup({ meeting: null, match: null });
    cy.login(student.id);
    cy.visit(`/${school.id}/users/${volunteer.id}`);
    cy.wait('@get-user', { timeout: 60000 });

    cy.contains('.mdc-select', 'Who needs help?')
      .find('.mdc-select__selected-text')
      .should('have.text', 'Me')
      .as('child-select')
      .click();
    cy.percySnapshot('User Display Page with Child Select Open');

    cy.contains('.mdc-menu ul li', 'My child').click();
    cy.get('@child-select').should('have.text', 'My child');
    cy.percySnapshot('User Display Page with Child Selected');

    cy.contains('Child name').type(child.name);
    cy.contains('Child age').type(child.age.toFixed(0));
    cy.percySnapshot('User Display Page with Child Populated');

    cy.contains('What would they like to learn?').type('Computer');
    cy.contains('li', 'Computer Science')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.percySnapshot('User Display Page with Child with Subject Selected');

    selectTime(true);

    cy.contains('What specifically do they need help with?').type(
      match.message
    );
    cy.percySnapshot('User Display Page with Child with Message Populated');

    cy.contains('button', 'Book meeting').click().should('be.disabled');
    cy.getBySel('loader')
      .should('be.visible')
      .find('svg')
      .should('have.attr', 'data-cy-checked', 'false');
    cy.percySnapshot('User Display Page with Child in Loading State');

    cy.wait('@create-user');
    cy.wait('@create-meeting');

    cy.getBySel('loader')
      .find('svg')
      .should('have.attr', 'data-cy-checked', 'true');
    cy.getBySel('error').should('not.exist');
    cy.percySnapshot('User Display Page with Child with Checkmark');
  });

  it('restricts subjects based on query aspect', () => {
    cy.setup({ student: null, match: null, meeting: null });
    cy.logout();
    cy.visit(`/${org.id}/users/${volunteer.id}?aspect=tutoring`);

    cy.getBySel('subjects')
      .should('not.contain', 'Artificial Intelligence')
      .and('contain', 'Computer Science')
      .and('contain', 'Math');
    cy.percySnapshot('User Display Page for Tutoring');

    cy.contains('What would you like to learn?')
      .as('subject-input')
      .type('Artificial');
    cy.contains('No subjects').should('be.visible');
    cy.percySnapshot('User Display Page for Tutoring with No Subjects');

    cy.get('@subject-input').find('textarea').clear().type('Computer');
    cy.contains('li', 'Computer Science')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.percySnapshot('User Display Page for Tutoring with Subject Selected');
  });

  it('signs users up before booking meetings', () => {
    cy.setup({ student: null, match: null, meeting: null });
    cy.logout();
    cy.visit(`/${org.id}/users/${volunteer.id}`, {
      onBeforeLoad(win: Window): void {
        cy.stub(win, 'open');
      },
    });
    cy.wait('@get-user', { timeout: 60000 });
    cy.percySnapshot('User Display Page with Signup Button');

    cy.contains('.mdc-select', 'Who needs help?')
      .find('.mdc-select__selected-text')
      .should('have.text', 'Me');

    cy.contains('What would you like to learn?').type('Artificial');
    cy.contains('li', 'Artificial Intelligence')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.percySnapshot('User Display Page with Signup with Subject Selected');

    selectTime();

    cy.contains('What specifically do you need help with?').type(match.message);
    cy.percySnapshot('User Display Page with Signup with Message Populated');

    cy.contains('button', 'Signup and book').click().should('be.disabled');
    cy.getBySel('loader').should('be.visible');
    cy.percySnapshot('User Display Page with Signup in Loading State');

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

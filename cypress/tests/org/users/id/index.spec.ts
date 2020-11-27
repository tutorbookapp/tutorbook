import org from 'cypress/fixtures/orgs/default.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

// TODO: Ping SendGrid to ensure that our email notifications were sent.
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

  function dayIdx(day: number): number {
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
  cy.getBySel('time-button').first().click({ force: true });
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

// TODO: Test flashes of truncated data, edit and vet action links, request form
// behavior, subjects displayed (based on org and query aspect), etc.
describe('User display page', () => {
  beforeEach(() => {
    cy.setup();
    cy.visit(`/${org.id}/users/${volunteer.id}`);
  });

  it('collects phone before sending requests', () => {
    cy.getBySel('bio').should('have.text', volunteer.bio);

    cy.contains('Your phone number')
      .find('input')
      .should('have.value', '')
      .and('have.attr', 'type', 'tel')
      .and('have.attr', 'required', '')
      .type(student.phone);

    cy.contains('What would you like to learn?')
      .as('subject-input')
      .type('Chem');
    cy.contains('No subjects').should('be.visible');
    cy.get('@subject-input').type('{selectall}{del}Computer');
    cy.contains('li', 'Computer Science').click();

    selectTime();

    cy.contains('What specifically do you need help with?').type(match.message);

    cy.contains('button', 'Send request').click().should('be.disabled');
    cy.getBySel('loader').should('be.visible');

    // TODO: Make assertions about the content within our Firestore database
    // simulator to ensure that it matches what we submitted.
    cy.wait('@create-match');

    cy.getBySel('loader').should('not.be.visible');
    cy.getBySel('error').should('not.exist');
  });
});

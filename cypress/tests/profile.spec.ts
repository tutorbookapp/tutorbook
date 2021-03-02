import { TimeslotJSON } from 'lib/model/timeslot';

import volunteer from 'cypress/fixtures/users/volunteer.json';

describe('Profile page', () => {
  beforeEach(() => {
    cy.setup({ student: null, match: null, meeting: null });
  });

  it('redirects to login page when logged out', () => {
    cy.logout();
    cy.visit('/profile');
    cy.wait('@get-account');

    cy.url({ timeout: 60000 }).should('contain', '/login?href=%2Fprofile');
    cy.loading(false).percySnapshot('Login Page');
  });

  it('retries failed update requests', () => {
    cy.route({
      method: 'PUT',
      url: '/api/users/*',
      status: 400,
      response: { message: 'You must provide a request body.' },
    }).as('update-user');
    cy.login(volunteer.id);
    cy.visit('/profile');
    cy.percySnapshot('Profile Page in Loading State');

    cy.wait('@get-account');
    cy.percySnapshot('Profile Page');

    cy.clock();
    cy.contains('Your name').clear().type('John');
    cy.percySnapshot('Profile Page with Updated Name');

    cy.tick(5000);
    cy.wait('@update-user');

    cy.tick(1000);
    cy.get('.mdc-snackbar__surface')
      .should('be.visible')
      .children('.mdc-snackbar__label')
      .as('snackbar-label');
    cy.percySnapshot('Profile Page with Update Error');
    cy.get('@snackbar-label')
      .invoke('text')
      .then((text1: string) => {
        expect(text1).to.contain('Could not update profile.');
        const waitRegex = /Retry in (\d+) seconds./;
        const wait1 = Number((waitRegex.exec(text1) as string[])[1]);

        cy.tick(10000);
        cy.wait('@update-user');

        cy.get('@snackbar-label')
          .invoke('text')
          .should((text2: string) => {
            const wait2 = Number((waitRegex.exec(text2) as string[])[1]);
            expect(wait2).to.be.greaterThan(wait1);
          });
      });
  });

  it('updates volunteer profiles', () => {
    cy.login(volunteer.id);
    cy.visit('/profile');
    cy.wait('@get-account');

    cy.getBySel('title').should('have.text', 'Profile');
    cy.getBySel('subtitle').should('have.text', 'Update your profile');
    cy.percySnapshot('Profile Page');

    cy.contains('a', 'View profile').should(
      'have.attr',
      'href',
      `/default/users/${volunteer.id}`
    );

    // TODO: Why does SWR fetch '/api/account' a second time sometimes? When it
    // does, the 'useContinuous' hook resets all of our changes (b/c of that
    // 500ms local update throttle, which we definitely want to keep). I'm
    // guessing that the window was refocused so it tries to revalidate.
    cy.contains('Your name')
      .find('input')
      .clear()
      .type('John')
      .should('have.value', 'John')
      .and('have.attr', 'required');

    cy.wait(500); // Wait for the 500ms throttle on local updates to trigger.

    cy.get('#open-nav').click();
    cy.getBySel('account-header').should('have.length', 1).as('account-header');
    cy.get('@account-header').find('span').should('have.text', 'John');
    cy.get('@account-header')
      .find('img')
      .as('profile-img')
      .should('have.img', volunteer.photo, 24);
    cy.percySnapshot('Profile Page with Navigation Open');

    cy.contains('Your email address')
      .children('input')
      .should('be.disabled')
      .and('have.attr', 'type', 'email');

    cy.contains('Your phone number')
      .children('input')
      .click()
      .should('be.focused')
      .and('have.attr', 'type', 'tel');

    cy.contains('Your profile photo')
      .as('photo-input')
      .children('input')
      .should('have.attr', 'type', 'file')
      .attachFile('users/student.jpg');
    cy.get('@photo-input')
      .next()
      .as('photo-input-label')
      .should('have.text', 'Uploading student.jpg...');
    cy.percySnapshot('Profile Page with Photo Uploading');

    cy.wait('@upload-photo');
    cy.wait(500); // Wait for the 500ms throttle on local updates to trigger.

    cy.get('@photo-input-label').should('have.text', 'Uploaded student.jpg.');
    cy.get('@profile-img').should('not.have.img', volunteer.photo, 24);
    cy.percySnapshot('Profile Page with Photo Uploaded');

    cy.contains('What can you tutor?')
      .children('.mdc-chip')
      .should('have.length', volunteer.tutoring.subjects.length)
      .as('tutoring-subjects');
    volunteer.tutoring.subjects.forEach((subject: string, idx: number) => {
      cy.get('@tutoring-subjects').eq(idx).should('contain', subject);
    });

    cy.contains('What are your fields of expertise?')
      .children('.mdc-chip')
      .should('have.length', volunteer.mentoring.subjects.length)
      .as('mentoring-subjects');
    volunteer.mentoring.subjects.forEach((subject: string, idx: number) => {
      cy.get('@mentoring-subjects').eq(idx).should('contain', subject);
    });

    const langs: Record<string, string> = { en: 'English', es: 'Spanish' };
    cy.contains('What languages do you speak?')
      .children('.mdc-chip')
      .should('have.length', volunteer.langs.length)
      .as('langs');
    volunteer.langs.forEach((lang: string, idx: number) => {
      cy.get('@langs').eq(idx).should('contain', langs[lang]);
    });

    const availabilityString = volunteer.availability
      .map((timeslot: TimeslotJSON) => {
        const from = new Date(timeslot.from);
        const to = new Date(timeslot.to);
        const showSecondDate =
          from.getDate() !== to.getDate() ||
          from.getMonth() !== to.getMonth() ||
          from.getFullYear() !== to.getFullYear();
        return `${from.toLocaleString('en', {
          weekday: 'long',
          hour: 'numeric',
          minute: 'numeric',
        })} - ${to.toLocaleString('en', {
          weekday: showSecondDate ? 'long' : undefined,
          hour: 'numeric',
          minute: 'numeric',
        })}`;
      })
      .join(', ');

    cy.contains('What is your weekly availability?')
      .children('input')
      .should('have.value', availabilityString)
      .focus();
    cy.getBySel('availability-select-surface').should('be.visible');
    cy.getBySel('timeslot-rnd')
      .should('have.length', volunteer.availability.length)
      .and('be.visible')
      .as('timeslots');
    cy.percySnapshot('Profile Page with Availability Select Open');

    // Drag-and-drop the timeslots and assert that their content changes.
    // @see {@link https://bit.ly/2TIuE3i}
    volunteer.availability.forEach((timeslot: TimeslotJSON, idx: number) => {
      const config = { hour: 'numeric', minute: 'numeric' };
      const from = new Date(timeslot.from);
      const to = new Date(timeslot.to);
      cy.get('@timeslots')
        .eq(idx)
        .should('contain', from.toLocaleString('en', config))
        .and('contain', to.toLocaleString('en', config))
        .then((timeslotEl: JQuery<HTMLElement>) => {
          // TODO: Make sure these drag-and-drop tests actually work.
          const { x, y } = timeslotEl[0].getBoundingClientRect();
          timeslotEl
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: x, clientY: y + 200 })
            .trigger('mouseup', { force: true });
        });
    });

    // Override the default clock so we can test the continuous updating system
    // that automatically saves changes with 5secs of no change.
    cy.clock();
    cy.tick(5000);
    cy.wait('@update-user');

    cy.get('.mdc-snackbar').should('not.exist');
  });
});

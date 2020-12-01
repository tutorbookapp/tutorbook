import admin from 'cypress/fixtures/users/admin.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

function snackbarIsOpen(label: string = 'Link copied to clipboard.'): void {
  cy.get('.mdc-snackbar__surface')
    .as('snackbar')
    .should('be.visible')
    .find('.mdc-snackbar__label')
    .should('have.text', label);
  cy.get('@snackbar').find('button').click();
  cy.get('@snackbar').should('not.exist');
}

// TODO: Add `cy.percySnapshot` calls to add visual snapshot testing.
describe('Users dashboard page', () => {
  beforeEach(() => {
    // TODO: Update our fixtures so we can accurately test that the aspect chips
    // only appear when the aspect is within the given org.
    cy.setup({ school: { aspects: ['tutoring', 'mentoring'] } });
  });

  it('redirects to login page when logged out', () => {
    cy.logout();
    cy.visit(`/${school.id}/users`);
    cy.wait('@get-account');

    // TODO: Refactor these assertions into reusable functions as they're used
    // on every single "login required" page. Or, just test them once and assume
    // that they work on every page.
    const url = `/login?href=${encodeURIComponent(`/${school.id}/users`)}`;

    cy.url({ timeout: 60000 }).should('contain', url);
  });

  it('fallbacks to invisible textarea copy-paste', () => {
    cy.login(admin.id);
    cy.visit(`/${school.id}/users`, {
      onBeforeLoad(win: Window): void {
        cy.stub(win.navigator.clipboard, 'writeText').as('copy');
      },
    });

    // TODO: Assert about the content of the user's clipboard (i.e. to see if
    // the textarea clipboard workaround works properly).
    // @see {@link https://github.com/cypress-io/cypress/issues/2752}
    cy.contains('button', 'Share signup link').click();
    cy.get('@copy').should('be.calledOnce');
  });

  it('copies org links and filters users', () => {
    cy.login(admin.id);
    cy.visit(`/${school.id}/users`, {
      onBeforeLoad(win: Window): void {
        cy.spy(win.navigator.clipboard, 'writeText').as('copy');
      },
    });
    cy.wait('@get-account');

    cy.getBySel('title').should('have.text', 'Users');
    cy.getBySel('subtitle').should(
      'have.text',
      'Create, edit, and match users'
    );

    cy.contains('button', 'Share signup link').click();
    cy.get('@copy').should(
      'be.calledWithExactly',
      `http://localhost:3000/${school.id}/signup`
    );
    snackbarIsOpen();
    cy.contains('button', 'Share search link').click();
    cy.get('@copy').should(
      'be.calledWithExactly',
      `http://localhost:3000/${school.id}/search`
    );
    snackbarIsOpen();

    // TODO: Right now, we can't test the Intercom integration due to
    // `localhost` not being whitelisted. We'll have to change the development
    // server hostname to something like `127.0.0.1` or `0.0.0.0` to be able to
    // access Intercom locally. But do we really need to test Intercom?
    cy.contains('button', 'Import data').click();

    // Showing featured tutors first.
    cy.wait('@list-users');
    cy.getBySel('results')
      .children('li')
      .as('results')
      .should('have.length', 3)
      .first()
      .find('a')
      .should('contain', volunteer.name)
      .and('have.attr', 'href', `/${school.id}/users/${volunteer.id}`)
      .and('have.attr', 'target', '_blank');

    // Showing featured tutors first; users must be hidden from search.
    cy.contains('.mdc-chip', 'Hidden from search')
      .as('hidden-chip')
      .click()
      .should('have.class', 'mdc-chip--selected');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .first()
      .find('a')
      .should('contain', student.name)
      .and('have.attr', 'href', `/${school.id}/users/${student.id}`)
      .and('have.attr', 'target', '_blank');

    // Showing featured tutors first; users must be visible in search.
    cy.contains('.mdc-chip', 'Visible in search')
      .as('visible-chip')
      .click()
      .should('have.class', 'mdc-chip--selected');
    cy.get('@hidden-chip').should('not.have.class', 'mdc-chip--selected');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 2)
      .first()
      .should('contain', volunteer.name);
    cy.get('@results').last().should('contain', admin.name);

    // Showing featured mentors first; users must be visible in search.
    cy.contains('.mdc-chip', 'Tutors')
      .as('tutors-chip')
      .should('have.class', 'mdc-chip--selected');
    cy.contains('.mdc-chip', 'Mentors')
      .as('mentors-chip')
      .click()
      .should('have.class', 'mdc-chip--selected');
    cy.get('@tutors-chip').should('not.have.class', 'mdc-chip--selected');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 2)
      .first()
      .should('contain', admin.name);
    cy.get('@results').last().should('contain', volunteer.name);

    // Showing featured mentors first; users must be visible in search AND speak
    // Spanish.
    cy.contains('button', 'filter_list').as('filters-button').click();
    cy.contains('Languages').as('langs-input').type('sp');

    // TODO: Why doesn't a regular `cy.click()` command work here? Why do I have
    // to call `cy.trigger()` instead? What is wrong with the event listener?
    cy.get('@langs-input')
      .parent()
      .should('have.class', 'mdc-menu-surface--anchor')
      .contains('li:visible', 'Spanish')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.get('@langs-input')
      .children('.mdc-chip')
      .should('have.length', 1)
      .first()
      .as('spanish-chip')
      .should('contain', 'Spanish');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .first()
      .should('contain', volunteer.name);
    cy.get('@spanish-chip').contains('[role="button"]', 'close').click();
    cy.get('@langs-input').children('.mdc-chip').should('have.length', 0);
    cy.get('@filters-button').click();
    cy.get('@langs-input').should('not.be.visible');

    // Showing featured mentors first; users must be visible in search AND not
    // yet vetted.
    cy.contains('.mdc-chip', 'Not yet vetted')
      .click()
      .should('have.class', 'mdc-chip--selected');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .first()
      .should('contain', volunteer.name);

    // Showing featured tutors first; users must not yet be vetted.
    cy.get('@tutors-chip').click().should('have.class', 'mdc-chip--selected');
    cy.get('@mentors-chip').should('not.have.class', 'mdc-chip--selected');
    cy.get('@visible-chip')
      .click()
      .should('not.have.class', 'mdc-chip--selected');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 2)
      .first()
      .should('contain', volunteer.name);
    cy.get('@results').last().should('contain', student.name);

    // Showing featured tutors first; users must not yet be vetted AND must
    // tutor Computer Science.
    cy.get('@filters-button').click();
    cy.contains('Subjects').as('subjects-input').type('computer');
    cy.get('@subjects-input')
      .parent()
      .should('have.class', 'mdc-menu-surface--anchor')
      .contains('li:visible', 'Computer Science')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.get('@subjects-input')
      .children('.mdc-chip')
      .should('have.length', 1)
      .first()
      .as('cs-chip')
      .should('contain', 'Computer Science');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .first()
      .should('contain', volunteer.name);
    cy.get('@cs-chip').contains('[role="button"]', 'close').click();
    cy.get('@subjects-input').children('.mdc-chip').should('have.length', 0);
    cy.get('@filters-button').click();
    cy.get('@subjects-input').should('not.be.visible');

    // Search by text (using 'Erik' name).
    cy.get('[placeholder="Search users"]').as('query-input').type('Erik');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .first()
      .should('contain', student.name);

    // Search by text (using 'Nicholas' name).
    cy.get('@query-input').type('{selectall}{del}Nicholas');
    cy.wait('@list-users');
    cy.get('@results').should('not.exist');
    cy.contains('NO USERS TO SHOW').should('be.visible');
  });
});

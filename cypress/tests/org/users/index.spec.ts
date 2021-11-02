import admin from 'cypress/fixtures/users/admin.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

function filterSheetIsOpen(open: boolean = true): void {
  // TODO: Because this filter sheet wrapper has a 1px left border, the width
  // will never actually be 0px which also prevents Cypress from determining
  // if the child `<form>` element is visible or not (https://bit.ly/2NqKaRI).
  cy.getBySel('filters-sheet', { timeout: 60000 })
    .should('have.css', 'width', open ? '300px' : '1px')
    .find('.mdc-text-field')
    .should(open ? 'be.visible' : 'not.be.visible');
}

function snackbarIsOpen(label: string = 'Link copied to clipboard.'): void {
  cy.get('.mdc-snackbar__surface')
    .as('snackbar')
    .should('be.visible')
    .find('.mdc-snackbar__label')
    .should('have.text', label);

  // TODO: Restore this once we can use SVGs for the snackbar dismiss button.
  // @see {@link https://github.com/jamesmfriedman/rmwc/pull/727}
  // cy.get('@snackbar').find('button').click();
  // cy.get('@snackbar').should('not.exist');
}

// TODO: Add `cy.percySnapshot` calls to add visual snapshot testing.
describe('Users page', () => {
  beforeEach(() => {
    cy.setup({ meeting: null });
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

  it('falls back to invisible textarea copy-paste', () => {
    cy.login(admin.id);
    cy.visit(`/${school.id}/users`, {
      onBeforeLoad(win: Window): void {
        const value = { writeText: async () => {} };
        cy.spy(value, 'writeText').as('copy');
        Object.defineProperty(win.navigator, 'clipboard', { value });
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
        const value = { writeText: async () => {} };
        cy.spy(value, 'writeText').as('copy');
        Object.defineProperty(win.navigator, 'clipboard', { value });
      },
    });
    cy.wait('@get-account');

    cy.getBySel('title').should('have.text', 'Users');
    cy.getBySel('subtitle').should(
      'have.text',
      `Create, edit, and match ${school.name}'s users`
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

    // TODO: Test the new "Create user" dialog.

    cy.wait('@list-users');
    cy.contains('.mdc-chip', 'Visible in search')
      .as('visible-chip')
      .should('have.class', 'mdc-chip--selected');
    cy.getBySel('result')
      .should('not.have.css', 'cursor', 'wait')
      .as('results')
      .should('have.length', 2)
      .first()
      .find('a')
      .should('contain', volunteer.name)
      .and('have.attr', 'href', `/${school.id}/users/${volunteer.id}`);
    cy.get('@results').last().should('contain', admin.name);
    
    // Users must be hidden from search.
    cy.contains('.mdc-chip', 'Hidden from search')
      .as('hidden-chip')
      .click()
      .should('have.class', 'mdc-chip--selected');
    cy.get('@visible-chip').should('not.have.class', 'mdc-chip--selected');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .first()
      .find('a')
      .should('contain', student.name)
      .and('have.attr', 'href', `/${school.id}/users/${student.id}`);

    // Users must be visible in search.
    cy.get('@hidden-chip')
      .click()
      .should('not.have.class', 'mdc-chip--selected');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 3)
      .first()
      .should('contain', volunteer.name);

    // Users must be visible in search AND speak Spanish.
    cy.getBySel('filters-button').click();
    filterSheetIsOpen();
    cy.contains('Languages').as('langs-input').type('spanish');

    // TODO: Why doesn't a regular `cy.click()` command work here? Why do I have
    // to call `cy.trigger()` instead? What is wrong with the event listener?
    cy.get('#portal')
      .as('portal')
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
    cy.get('@spanish-chip').find('[role="button"]').last().click();
    cy.get('@langs-input').children('.mdc-chip').should('have.length', 0);

    // Users must tutor Computer Science.
    cy.contains('Subjects').as('subjects-input').type('computer');
    cy.get('@portal')
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
      .should('have.length', 2)
      .first()
      .should('contain', volunteer.name);
    cy.get('@results').last().should('contain', admin.name);
    
    // Users must tutor both Computer Science AND Artificial Intelligence.
    cy.get('@subjects-input').type('artificial');
    cy.get('@portal')
      .contains('li:visible', 'Artificial Intelligence')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.get('@subjects-input')
      .children('.mdc-chip')
      .should('have.length', 2)
      .last()
      .as('ai-chip')
      .should('contain', 'Artificial Intelligence');
    cy.wait('@list-users')
    cy.get('@results')
      .should('have.length', 1)
      .first()
      .should('contain', volunteer.name);
    cy.get('@ai-chip').find('[role="button"]').last().click();
    cy.get('@cs-chip').find('[role="button"]').last().click();
    cy.get('@subjects-input').children('.mdc-chip').should('have.length', 0);
    cy.getBySel('filters-button').click();
    filterSheetIsOpen(false);

    // Search by text (using 'Erik' name).
    cy.get('[placeholder="Search by name"]').as('query-input').type('Erik');
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .first()
      .should('contain', student.name);

    // Search by text (using 'Lorem Ipsum' name).
    cy.get('@query-input').clear().type('Lorem Ipsum');
    cy.wait('@list-users');
    cy.getBySel('result').should('not.exist');
    cy.contains('NO USERS TO SHOW').should('be.visible');
    cy.percySnapshot('Users Page with No Results');
  });
});

import { onlyFirstNameAndLastInitial } from 'lib/api/get/truncated-user';

import admin from 'cypress/fixtures/users/admin.json';
import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

describe('Search page', () => {
  it('restricts access to school data', () => {
    cy.setup({ student: null, volunteer: null, meeting: null });
    cy.logout();
    cy.visit(`/${school.id}/search`, {
      onBeforeLoad(win: Window): void {
        cy.stub(win, 'open');
      },
    });

    cy.getBySel('result')
      .should('have.css', 'cursor', 'wait')
      .and('have.attr', 'disabled');
    cy.percySnapshot('Search Page in Loading State');

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
    cy.percySnapshot('Search Page with Auth Dialog Open');

    cy.contains('button', 'Continue with Google').click().should('be.disabled');
    cy.getBySel('loader').should('be.visible');
    cy.percySnapshot('Search Page with Auth Dialog Loading');

    // TODO: Find some way to trick the application into thinking that it was
    // logged in successfully so we can make assertions about the user being
    // created and subsequently logged in.
    cy.on('uncaught:exception', (err) => {
      expect(err.message).to.include('Unable to establish a connection with the popup. It may have been blocked by the browser.');
      return false;
    });
    cy.window().its('open').should('be.called');

    cy.getBySel('loader').should('not.be.visible');
    cy.getBySel('error')
      .should('be.visible')
      .and('contain', 'Unable to establish a connection with the popup.');
    cy.percySnapshot('Search Page with Auth Dialog Error');

    cy.getBySel('result')
      .should('have.css', 'cursor', 'wait')
      .and('have.attr', 'disabled');
  });

  it('partitions search results by org', () => {
    cy.setup({ student: null, meeting: null });
    cy.login(admin.id);
    cy.visit(`/${org.id}/search`);

    // TODO: Perhaps make assertions about the 'api/users' query to remove this
    // awkward result item selection timeout workaround.
    cy.wait('@list-users');
    cy.getBySel('result', { timeout: 60000 })
      .should('not.have.css', 'cursor', 'wait')
      .as('results')
      .should('have.length', 1)
      .first()
      .should('contain', volunteer.name)
      .and('contain', volunteer.bio)
      .find('img')
      .should('have.img', volunteer.photo, 85);
    cy.percySnapshot('Search Page');

    cy.visit(`/${school.id}/search`);

    cy.wait('@list-users');
    cy.get('@results').should('have.length', 2);
    cy.get('@results')
      .eq(0)
      .should('contain', volunteer.name)
      .and('contain', volunteer.bio)
      .find('img')
      .should('have.img', volunteer.photo, 85);
    cy.get('@results')
      .eq(1)
      .should('contain', admin.name)
      .and('contain', admin.bio)
      .find('img')
      .should('have.img', admin.photo, 85);
    cy.percySnapshot('Search Page for Schools');
  });

  // TODO: Refactor this into reusable tests and assertions to test a variety of
  // different filter combinations (in order to reach 100% back-end coverage).
  it('filters users by subjects, langs, and name', () => {
    cy.setup({ student: { phone: '' }, meeting: null });
    cy.login(student.id);
    cy.visit(`/${school.id}/search`);

    cy.wait('@get-account');
    cy.get('.mdc-dialog--open').should('not.exist');
    cy.percySnapshot('Search Page in Loading State');

    cy.wait('@list-users');
    cy.getBySel('result', { timeout: 60000 })
      .should('not.have.css', 'cursor', 'wait')
      .as('results')
      .should('have.length', 2);
    cy.get('@results')
      .eq(0)
      .should('not.contain', volunteer.name)
      .and('contain', onlyFirstNameAndLastInitial(volunteer.name))
      .and('contain', volunteer.bio)
      .find('img')
      .should('have.img', volunteer.photo, 85);
    cy.get('@results')
      .eq(1)
      .should('not.contain', admin.name)
      .and('contain', onlyFirstNameAndLastInitial(admin.name))
      .and('contain', admin.bio)
      .find('img')
      .should('have.img', admin.photo, 85);
    cy.percySnapshot('Search Page for Schools');

    cy.get('input[placeholder="Search by name"]')
      .as('search-input')
      .type(admin.name.substring(0, 5));
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .and('not.have.attr', 'disabled', '')
      .children('a')
      .should('contain', onlyFirstNameAndLastInitial(admin.name))
      .and('have.attr', 'href', `/${school.id}/users/${admin.id}`)
      .and('have.attr', 'target', '_blank');
    cy.percySnapshot('Search Page with Search Populated');
    cy.get('@search-input').clear().should('have.value', '');

    // TODO: Perhaps create some `Select` component tests to test the different
    // error and content states (e.g. multiple lines of selected chips).
    cy.contains('What languages do you speak?')
      .type('Span')
      .as('langs-input');
    cy.percySnapshot('Search Page with Lang Select Focused');

    // TODO: Why doesn't a regular `cy.click()` command work here? Why do I have
    // to call `cy.trigger()` instead? What is wrong with the event listener?
    cy.contains('li:visible', 'Spanish')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.get('@langs-input')
      .children('.mdc-chip')
      .should('have.length', 1)
      .first()
      .should('contain', 'Spanish');
    cy.percySnapshot('Search Page with Lang Selected');

    // TODO: Find a better way to unfocus the `FilterForm` (something that an
    // actual user would actually do, e.g. click on the loading results).
    cy.getBySel('page').click({ force: true });
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .should('not.have.attr', 'disabled', '')
      .children('a')
      .should('contain', onlyFirstNameAndLastInitial(volunteer.name))
      .and('have.attr', 'href', `/${school.id}/users/${volunteer.id}`)
      .and('have.attr', 'target', '_blank');
    cy.percySnapshot('Search Page with Lang Filters');

    cy.contains('What would you like to learn?')
      .type('Lorem Ipsum');
    cy.contains('.mdc-menu-surface', 'No subjects').should('be.visible');
    cy.percySnapshot('Search Page with Subject Select Focused');

    cy.focused().clear().type('Geo').should('have.value', 'Geo');
    cy.contains('li:visible', 'Geometry')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.percySnapshot('Search Page with Subject and Lang Selected');

    cy.getBySel('page').click({ force: true });
    cy.wait('@list-users');
    cy.getBySel('results').should('contain', 'NO RESULTS TO SHOW');
    cy.percySnapshot('Search Page with No Results');

    cy.contains('What languages do you speak?')
      .parent()
      .within(() => {
        cy.get('.mdc-chip')
          .first()
          .should('contain', 'Spanish')
          .find('[role="button"]')
          .last()
          .click();
        cy.get('.mdc-chip').should('have.length', 0);
        cy.percySnapshot('Search Page with Subject Selected');
      });

    cy.getBySel('page').click({ force: true });
    cy.wait('@list-users');
    cy.get('@results')
      .should('have.length', 1)
      .should('not.have.attr', 'disabled', '')
      .children('a')
      .should('contain', onlyFirstNameAndLastInitial(admin.name))
      .and('have.attr', 'href', `/${school.id}/users/${admin.id}`)
      .and('have.attr', 'target', '_blank');
    cy.percySnapshot('Search Page with Subject Filters');
  });
});

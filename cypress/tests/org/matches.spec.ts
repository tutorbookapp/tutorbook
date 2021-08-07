import admin from 'cypress/fixtures/users/admin.json';
import match from 'cypress/fixtures/match.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';

describe('Org matches page', () => {
  it('redirects to login page when logged out', () => {
    cy.setup({ student: null, volunteer: null, match: null, meeting: null });
    cy.logout();
    cy.visit(`/${school.id}/matches`);
    cy.wait('@get-account');

    const redirect = encodeURIComponent(`/${school.id}/matches`);
    cy.url({ timeout: 60000 }).should('contain', `/login?href=${redirect}`);
  });

  it('shows error when not org admin', () => {
    cy.setup({ volunteer: null, match: null, meeting: null });
    cy.login(student.id);
    cy.visit(`/${school.id}/matches`);
    cy.wait('@get-account');
    cy.url({ timeout: 60000 }).should('contain', '/404');
  });

  it('links to match pages', () => {
    cy.setup({ meeting: null });
    cy.login(admin.id);
    cy.visit(`/${school.id}/matches`);
    cy.wait('@get-account');

    cy.getBySel('title').should('have.text', 'Matches');
    cy.getBySel('subtitle').should(
      'have.text',
      `View ${school.name}'s ongoing matches`
    );
    cy.percySnapshot('Org Matches Page in Fallback State');

    cy.window().then((win) => cy.stub(win, 'Intercom').as('intercom'));
    cy.contains('button', 'Import data').click();
    const msg = 'Could you help me import some existing matches?';
    cy.get('@intercom').should('be.calledWithExactly', 'showNewMessage', msg);

    function matchIsListed(): void {
      cy.getBySel('match-row')
        .should('have.length', 1)
        .and('contain', `${match.people[0].name} (${match.people[0].roles[0]})`)
        .and('contain', `${match.people[1].name} (${match.people[1].roles[0]})`)
        .and('contain', match.subjects[0])
        .and('contain', match.description);
    }

    cy.wait('@list-matches');
    matchIsListed();
    cy.percySnapshot('Org Matches Page');

    cy.get('[placeholder="Search matches"]').as('search-input').type('Biology');
    cy.wait('@list-matches');
    cy.getBySel('match-row').should('not.exist');
    cy.contains('NO MATCHES TO SHOW').should('be.visible');
    cy.percySnapshot('Org Matches Page with No Results');

    cy.get('@search-input').clear().type('Computer Science');
    cy.percySnapshot('Org Matches Page in Loading State');

    cy.wait('@list-matches');
    matchIsListed();
    cy.percySnapshot('Org Matches Page with Search Populated');

    cy.getBySel('match-row').click();

    // TODO: Ensure that our back-end keeps the original fixture IDs and then
    // add that ID to the end of this URL assertion.
    cy.url({ timeout: 60000 }).should('contain', `/${school.id}/matches/`);
    cy.loading(false, { timeout: 60000 }).percySnapshot('Match Display Page');
  });
});

import admin from 'cypress/fixtures/users/admin.json';
import match from 'cypress/fixtures/match.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';

describe('Matches page', () => {
  it('links to user matches', () => {
    cy.setup({ meeting: null });
    cy.login(student.id);
    cy.visit('/matches');

    cy.getBySel('title').should('have.text', 'Matches');
    cy.getBySel('subtitle').should('have.text', 'View your ongoing matches');
    cy.percySnapshot('Matches Page in Fallback State');

    cy.wait('@list-matches');
    cy.getBySel('match-row')
      .should('have.length', 1)
      .and('contain', `${match.people[0].name} (${match.people[0].roles[0]})`)
      .and('contain', `${match.people[1].name} (${match.people[1].roles[0]})`)
      .and('contain', match.subjects[0])
      .and('contain', match.description);
    cy.percySnapshot('Matches Page');

    cy.getBySel('match-row').click();
    cy.url({ timeout: 60000 }).should('contain', `/${school.id}/matches/`);
    cy.loading(false, { timeout: 60000 });
  });

  it('only shows user matches', () => {
    cy.setup({ meeting: null });
    cy.login(admin.id);
    cy.visit('/matches');
    cy.wait('@list-matches');
    cy.getBySel('match-row').should('not.exist');
    cy.contains('NO MATCHES TO SHOW').should('be.visible');
    cy.percySnapshot('Matches Page with No Results');
  });
});

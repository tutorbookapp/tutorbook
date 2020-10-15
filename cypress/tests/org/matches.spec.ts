import admin from 'cypress/fixtures/users/admin.json';
import org from 'cypress/fixtures/orgs/default.json';

describe('Matches dashboard page', () => {
  beforeEach(() => {
    cy.setup();
    cy.login(admin.id);
    cy.visit(`/${org.id}/matches`);
  });

  it('shows matches', () => {});
});

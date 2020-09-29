import org from 'cypress/fixtures/orgs/default.json';
import admin from 'cypress/fixtures/users/admin.json';

describe('Matches page', () => {
  beforeEach(() => {
    cy.setup();
    cy.login(admin.id);
    cy.visit(`/${org.id}/matches`);
  });

  it('shows matches', () => {});
});

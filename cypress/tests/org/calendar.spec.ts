import admin from 'cypress/fixtures/users/admin.json';
import school from 'cypress/fixtures/orgs/school.json';

describe('Org calendar page', () => {
  beforeEach(() => {
    cy.setup();
    cy.login(admin.id);
    cy.visit(`/${school.id}/calendar`);
  });
});

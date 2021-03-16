// TODO: Don't include this "spec" file when actually running tests.
describe('Back-end', () => {
  it('seeds data', () => {
    cy.task('clear');
    cy.task('seed');
  });
});

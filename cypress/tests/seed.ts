describe('Back-end', () => {
  it('seeds data', () => {
    cy.task('clear');
    cy.task('seed');
  });
});

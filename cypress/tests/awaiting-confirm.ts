import student from 'cypress/fixtures/users/student.json';

describe('Awaiting confirmation page', () => {
  beforeEach(() => {
    cy.logout();
  });

  it('shows message with specified email address', () => {
    cy.visit(`/awaiting-confirm?email=${student.email}`);
    cy.wait('@get-account');

    cy.getBySel('page').find('h3').should('have.text', 'Awaiting Confirmation');
    cy.get('p')
      .should('have.length', 2)
      .first()
      .should('have.text', `We just sent an email to ${student.email}.`)
      .children('b')
      .should('have.text', student.email);
    cy.get('p')
      .last()
      .should(
        'have.text',
        'Click the confirmation button in that email to continue.'
      );

    cy.percySnapshot('Awaiting Confirm Page for Students');
  });

  it('shows fallback example email address', () => {
    cy.visit('/awaiting-confirm');
    cy.wait('@get-account');

    cy.get('p')
      .should('have.length', 2)
      .first()
      .should('have.text', 'We just sent an email to your-email@domain.com.')
      .children('b')
      .should('have.text', 'your-email@domain.com');

    cy.percySnapshot('Awaiting Confirm Page');
  });
});

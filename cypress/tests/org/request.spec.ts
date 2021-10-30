import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';

describe('Request page', () => {
  beforeEach(() => {
    cy.setup({ student: null, volunteer: null, meeting: null });
    cy.logout();
    cy.visit(`/${school.id}/request`, {
      onBeforeLoad(win: Window) {
        cy.stub(win, 'open');
      },
    });
  });

  it('creates tutor requests', () => {
    cy.contains('Your phone number')
      .find('input')
      .should('have.attr', 'type', 'tel')
      .and('have.attr', 'required', 'required')
      .type(student.phone);
    cy.percySnapshot('Request Page with Phone Populated');
    
    cy.contains('What would you like to learn?')
      .as('subject-input')
      .type('Lorem Ipsum');
    cy.contains('No subjects').should('be.visible');
    cy.percySnapshot('Request Page with No Subjects');

    cy.get('@subject-input').find('textarea').clear().type('Trig');
    cy.contains('li', 'Trigonometry')
      .trigger('click')
      .find('input[type="checkbox"]')
      .should('be.checked');
    cy.percySnapshot('Request Page with Subject Selected');

    cy.contains('What specifically do you need help with?')
      .find('textarea')
      .should('have.attr', 'required', 'required')
      .type('I need help studying for my test in a week.');
    cy.percySnapshot('Request Page with Specifics Populated');

    cy.contains('Login and request').click().should('be.disabled');
    cy.getBySel('loader').should('be.visible');
    cy.percySnapshot('Request Page in Loading State');

    cy.on('uncaught:exception', (err) => {
      expect(err.message).to.include('Unable to establish a connection with the popup. It may have been blocked by the browser.');
      return false;
    });
    cy.window().its('open').should('be.calledOnce').loading(false);
    cy.getBySel('error')
      .should('be.visible')
      .and('contain', 'Unable to establish a connection with the popup.');
    cy.percySnapshot('Request Page with Google Error');
  });
});

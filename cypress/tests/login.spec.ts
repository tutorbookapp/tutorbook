import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

function startEmailAddressLogin(): void {
  cy.contains('Your email address').type(student.email);
  cy.percySnapshot('Login Page with Email Populated');

  cy.contains('button', 'Continue with email').click();
  cy.get('button').should('be.disabled').loading();
  cy.percySnapshot('Login Page in Loading State');
}

describe('Login page', () => {
  beforeEach(() => {
    cy.logout();
  });

  // TODO: Use the new Firebase Auth local emulator to test my two login flows.
  // We have to wait until the emulator has proper `idToken` support however.
  // @see {@link https://firebase.google.com/docs/emulator-suite/connect_auth}
  it('logs in with Google pop-up or email link', () => {
    cy.visit('/login', {
      onBeforeLoad(win: Window) {
        cy.stub(win, 'open');
      },
    });

    cy.getBySel('page').find('h2').should('have.text', 'Welcome');
    cy.get('header').contains('TB').should('have.attr', 'href', '/');
    cy.loading(false).percySnapshot('Login Page');

    cy.contains('button', 'Continue with Google').click();
    cy.get('button').should('be.disabled').loading();
    cy.percySnapshot('Login Page in Loading State');

    // TODO: Find some way to simulate a correct Google login response so we can
    // get 100% code coverage on `components/login` (perhaps using emulators).
    cy.window().its('open').should('be.calledOnce').loading(false);
    cy.getBySel('error')
      .should('be.visible')
      .and('contain', 'Unable to establish a connection with the popup.');
    cy.percySnapshot('Login Page with Google Error');

    // TODO: Make assertions about the email being sent by our back-end API.
    cy.contains('button', 'Continue with email')
      .as('email-btn')
      .click()
      .should('not.be.disabled')
      .loading(false);
    cy.contains('Your email address')
      .as('email-input')
      .find('input')
      .should('be.focused')
      .and('have.attr', 'type', 'email')
      .type(student.email.substring(0, 3));
    cy.get('@email-btn').click();
    cy.get('@email-input').should('have.class', 'mdc-text-field--invalid');
    cy.percySnapshot('Login Page with Invalid Email');

    cy.get('@email-input').type(`${student.email.substring(3)}{enter}`);
    cy.get('button').should('be.disabled').loading();
    cy.percySnapshot('Login Page in Loading State');

    cy.url({ timeout: 60000 }).should(
      'contain',
      `/awaiting-confirm?email=${student.email}`
    );
    cy.percySnapshot('Awaiting Confirm Page for Students');
  });

  it('errors when location cannot be detected', () => {
    cy.intercept('GET', 'https://ipinfo.io/json*', {
      statusCode: 500,
      delayMs: 1000,
    }).as('get-location');
    cy.visit('/login');

    startEmailAddressLogin();

    // TODO: Show a more specific error message when the location cannot be
    // detected and update this test code to assert about that error message.
    cy.wait('@get-location').loading(false);
    cy.getBySel('error')
      .should('be.visible')
      .and('have.text', 'An error occurred while logging in. Network Error.');
    cy.percySnapshot('Login Page with Location Error');
  });

  it('errors when login API endpoint fails', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 500,
      delayMs: 1000,
    }).as('create-login');
    cy.visit('/login');

    startEmailAddressLogin();

    // TODO: Send a more specific error message in our stubbed API response.
    cy.wait('@create-login').loading(false);
    cy.getBySel('error')
      .should('be.visible')
      .and('contain', 'Request failed with status code 500.');
    cy.percySnapshot('Login Page with API Error');
  });

  it('navigates to dashboard on successful login', () => {
    cy.setup();
    cy.login(student.id);
    cy.visit('/login');
    cy.wait('@get-account');
    cy.url({ timeout: 60000 }).should('contain', '/dashboard');
    cy.percySnapshot('Dashboard Page for Students');
  });

  it('navigates to specified redirect destination', () => {
    cy.setup();
    cy.login(volunteer.id);
    cy.visit('/login?href=%2Fprofile');
    cy.wait('@get-account');
    cy.url({ timeout: 60000 }).should('contain', '/profile');
    cy.percySnapshot('Profile Page for Volunteers');
  });
});

import volunteer from 'cypress/fixtures/users/volunteer.json';

describe('Profile page', () => {
  beforeEach(() => {
    cy.setup();

    cy.server();
    cy.route('PUT', '/api/users/*').as('update-user');
    cy.route('POST', 'https://firebasestorage.googleapis.com/**').as(
      'upload-photo'
    );
  });

  it('redirects to login page when logged out', () => {
    cy.logout();
    cy.visit('/profile');
    cy.wait('@get-account');

    cy.url({ timeout: 60000 }).should('contain', '/login');
  });

  it('retries failed update requests', () => {
    cy.route({
      method: 'PUT',
      url: '/api/users/*',
      status: 400,
      response: { msg: 'You must provide a request body.' },
    }).as('update-user');
    cy.login(volunteer.id);
    cy.visit('/profile');
    cy.wait('@get-account');

    cy.clock();
    cy.contains('Your name').type('{selectall}{del}John');

    cy.tick(5000);
    cy.wait('@update-user');

    cy.tick(1000);
    cy.get('.mdc-snackbar__surface')
      .should('be.visible')
      .children('.mdc-snackbar__label')
      .as('snackbar-label')
      .invoke('text')
      .then((text1: string) => {
        expect(text1).to.contain('Could not update profile.');
        const waitRegex = /Retry in (\d+) seconds./;
        const wait1 = Number((waitRegex.exec(text1) as string[])[1]);

        cy.tick(10000);
        cy.wait('@update-user');

        cy.get('@snackbar-label')
          .invoke('text')
          .should((text2: string) => {
            const wait2 = Number((waitRegex.exec(text2) as string[])[1]);
            expect(wait2).to.be.greaterThan(wait1);
          });
      });
  });

  it('updates volunteer profiles', () => {
    cy.login(volunteer.id);
    cy.visit('/profile');
    cy.wait('@get-account');

    cy.getBySel('title').should('have.text', 'Profile');
    cy.getBySel('subtitle').should('have.text', 'Update your profile');

    cy.contains('a', 'View profile').should(
      'have.attr',
      'href',
      `/default/search/${volunteer.id}`
    );
    cy.contains('Your name')
      .find('input')
      .type('{selectall}{del}John')
      .should('have.attr', 'required');
    cy.get('#open-nav').click();
    cy.getBySel('account-header').should('have.length', 1).as('account-header');
    cy.get('@account-header').find('span').should('have.text', 'John');
    cy.get('@account-header')
      .find('img')
      .as('profile-img')
      .should('have.attr', 'src')
      .as('profile-img-src');

    cy.contains('Your email address')
      .children('input')
      .click({ force: true })
      .should('be.focused')
      .and('have.attr', 'type', 'email');

    cy.contains('Your profile photo')
      .as('photo-input')
      .children('input')
      .should('have.attr', 'type', 'file')
      .attachFile('users/student.jpg');
    cy.get('@photo-input')
      .next()
      .as('photo-input-label')
      .should('have.text', 'Uploading student.jpg...');

    cy.wait('@upload-photo');

    // TODO: These assertions are taking advantage of a bug in Cypress to check
    // if the profile photo's `src` attribute has changed.
    // @see {@link https://github.com/cypress-io/cypress/issues/8552}
    cy.get('@photo-input-label').should('have.text', 'Uploaded student.jpg.');
    cy.get('@profile-img')
      .should('have.attr', 'src')
      .then((src: unknown) => {
        cy.get('@profile-img-src').then((originalSrc: unknown) => {
          expect(src as string).to.not.equal(originalSrc as string);
        });
      });

    // Override the default clock so we can test the continuous updating system
    // that automatically saves changes after 5secs of no change.
    cy.clock();
    cy.tick(5000);
    cy.wait('@update-user');

    cy.get('.mdc-snackbar').should('not.exist');
  });
});

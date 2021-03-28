describe('Org landing page', () => {
  beforeEach(() => {
    cy.setup({ volunteer: null, student: null, meeting: null, match: null });
    cy.logout();
    cy.visit('/');
  });

  it('shows demo pages and videos', () => {
    cy.percySnapshot('Org Landing Page');

    function focusDemoPage(title: string, page: string): void {
      cy.contains('button', title)
        .click()
        .should('have.attr', 'aria-selected', 'true');

      // For more info on working with iframe's in Cypress see:
      // https://cypress.io/blog/2020/02/12/working-with-iframes-in-cypress
      cy.get('iframe')
        .should('have.attr', 'title', title)
        .and('have.attr', 'src', page)
        .its('0.contentDocument')
        .should('exist');

      const capitalizedTitle = title.replace(/\b\w/g, (l) => l.toUpperCase());
      cy.percySnapshot(`Org Landing Page with ${capitalizedTitle} Active`);
    }

    focusDemoPage('Landing pages', '/default');
    focusDemoPage('Profile forms', '/default/signup');
    focusDemoPage(
      'Match scheduling',
      '/default/users/2SLcWTl1DxbgJzFGGAUghtcJuAl2'
    );
    focusDemoPage('Search views', '/default/search');

    // Clicking the refresh icon reloads the iframe contents.
    cy.contains('a', 'tutorbook.org/default/search')
      .next()
      .should('have.attr', 'type', 'button')
      .click();
    cy.get('iframe').its('0.contentDocument').should('not.exist');
    cy.get('iframe').its('0.contentDocument').should('exist');

    // Test the video component's play/pause/scrub functionality.
    cy.get('figure')
      .should('have.length', 5)
      .first()
      .within(() => {
        cy.get('video').its('0.paused').should('equal', true);
        cy.get('button').should('have.length', 2).first().as('play-pause-btn');
        cy.get('button').should('have.length', 2).last().as('full-screen-btn');

        cy.get('@play-pause-btn').click();
        cy.get('video').its('0.paused').should('equal', false);
        cy.percySnapshot('Org Landing Page with Demo Playing');

        cy.get('@play-pause-btn').click();
        cy.get('video').its('0.paused').should('equal', true);

        cy.get('progress').prev().click('center');
        cy.get('progress').its('0.value').should('be.closeTo', 50, 0.1);
        cy.get('video').then(([videoEl]) => {
          expect(videoEl.currentTime).to.be.closeTo(videoEl.duration / 2, 0.1);
          cy.stub(videoEl, 'requestFullscreen').as('request-full-screen');
        });

        cy.get('@full-screen-btn').click();
        cy.get('@request-full-screen').should('be.calledOnce');
      });

    // Test that the "contact us" button opens Intercom.
    cy.window().then((win) => cy.stub(win, 'Intercom').as('intercom'));
    cy.contains('button', 'Contact us').click();
    const msg = "I'd like to create a new organization.";
    cy.get('@intercom').should('be.calledWithExactly', 'showNewMessage', msg);
  });
});

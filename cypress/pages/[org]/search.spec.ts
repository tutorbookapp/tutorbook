import request from '../../fixtures/request.json';
import user from '../../fixtures/user.json';

describe('Search page', () => {
  beforeEach(() => {
    cy.task('clear');
    cy.task('seed');
    cy.visit('/default/search', {
      onBeforeLoad(win: Window): void {
        cy.stub(win, 'open');
      },
    });
  });

  it.only('searches and requests users', () => {
    cy.get('[data-cy=results] li')
      .should('have.length', 1)
      .first()
      .should('not.contain', user.name)
      .and('contain', user.username)
      .and('contain', user.bio)
      .find('img')
      .should('have.attr', 'src', user.photo);

    cy.contains('Any subjects').click();
    cy.focused()
      .type('Computer')
      .closest('label')
      .should('contain', 'What would you like to learn?');
    cy.contains('Computer Science').click();

    cy.get('[data-cy=page]').click({ force: true });
    cy.get('[data-cy=results] li').first().should('not.be.disabled').click();

    cy.get('[data-cy=request-dialog]').should('be.visible');
    cy.get('[data-cy=bio]').should('contain', user.bio);
    cy.get('[data-cy=name]').should('contain', user.username);
    cy.get('[data-cy=socials] a').should('have.length', user.socials.length);

    user.socials.forEach((social: Record<string, string>) => {
      cy.get(`[data-cy=${social.type}-social-link]`)
        .should('have.attr', 'href', social.url)
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noreferrer');
    });

    cy.contains('What would you like to learn?')
      .find('.mdc-chip')
      .should('contain', 'Computer Science');
    cy.contains('What specifically do you need help with?').type(
      request.message
    );

    cy.contains('button', 'Signup and send').click().should('be.disabled');
    cy.get('[data-cy=loader]').as('loader').should('be.visible');
    cy.window().its('open').should('be.called');
    cy.get('@loader').should('not.be.visible');
    cy.get('[data-cy=error]')
      .should('be.visible')
      .and('contain', 'Unable to establish a connection with the popup.');
  });
});

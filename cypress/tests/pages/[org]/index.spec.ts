import org from '../../fixtures/org.json';

describe('Org landing page', () => {
  beforeEach(() => {
    cy.setup();
    cy.visit(`/${org.id}`);
  });

  it('links to the search and signup pages', () => {
    cy.contains('a', 'Search tutors').should(
      'have.attr',
      'href',
      `/${org.id}/search?aspect=tutoring`
    );
    cy.contains('a', 'Search mentors').should(
      'have.attr',
      'href',
      `/${org.id}/search?aspect=mentoring`
    );
    cy.contains('a', 'Become a tutor').should(
      'have.attr',
      'href',
      `/${org.id}/signup?aspect=tutoring`
    );
    cy.contains('a', 'Become a mentor').should(
      'have.attr',
      'href',
      `/${org.id}/signup?aspect=mentoring`
    );
  });

  it('displays org information', () => {
    cy.get('[data-cy=name]').should('have.text', org.name);
    cy.get('[data-cy=avatar]')
      .should('have.attr', 'src', org.photo)
      .closest('a')
      .should('have.attr', 'href', org.photo);
    cy.get('[data-cy=socials] a').should('have.length', org.socials.length);

    org.socials.forEach((social: Record<string, string>) => {
      cy.get(`[data-cy=${social.type}-social-link]`)
        .should('have.attr', 'href', social.url)
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noreferrer');
    });

    cy.get('[data-cy=bio]').should('have.text', org.bio);
    cy.get('[data-cy=header]').should('have.text', org.home.en.header);
    cy.get('[data-cy=body]').should('have.text', org.home.en.body);
    cy.get('[data-cy=backdrop]').should('have.attr', 'src', org.home.en.photo);
  });
});

import org from 'cypress/fixtures/orgs/default.json';

describe('Org landing page', () => {
  beforeEach(() => {
    cy.setup();
    cy.visit(`/${org.id}`);
  });

  it('displays org info and actions', () => {
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

    cy.getBySel('org-home').as('home').should('be.visible');

    cy.get('@home').getBySel('name').should('have.text', org.name);
    cy.get('@home')
      .getBySel('avatar')
      .should('have.img', org.photo, 120)
      .closest('a')
      .should('have.attr', 'href', org.photo);
    cy.get('@home')
      .getBySel('socials')
      .children('a')
      .should('have.length', org.socials.length);

    org.socials.forEach((social: Record<string, string>) => {
      cy.get('@home')
        .getBySel(`${social.type}-social-link`)
        .should('have.attr', 'href', social.url)
        .and('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noreferrer');
    });

    cy.get('@home').getBySel('bio').should('have.text', org.bio);
    cy.get('@home').getBySel('header').should('have.text', org.home.en.header);
    cy.get('@home').getBySel('body').should('have.text', org.home.en.body);
    cy.get('@home')
      .getBySel('backdrop')
      .should('be.visible')
      .and('have.img', org.home.en.photo, 1200, 100);
  });
});

import '@cypress/code-coverage/support';

import './commands';

before(() => {
  cy.task('createIndices');
});

after(() => {
  cy.task('deleteIndices');
});

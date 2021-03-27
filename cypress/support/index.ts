import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector';

import '@cypress/code-coverage/support';

import './commands';

installLogsCollector();

before(() => {
  cy.task('createIndices');
});

after(() => {
  cy.task('deleteIndices');
});

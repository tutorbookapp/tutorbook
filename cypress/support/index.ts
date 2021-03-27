import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector';

import '@cypress/code-coverage/support';

import './commands';

installLogsCollector({
  enableExtendedCollector: false,
  xhr: { printHeaderData: true, printRequestData: true },
});

before(() => {
  cy.task('createIndices');
});

after(() => {
  cy.task('deleteIndices');
});

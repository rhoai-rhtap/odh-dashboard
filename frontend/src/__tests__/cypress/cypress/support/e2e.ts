// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import chaiSubset from 'chai-subset';
import '@cypress/code-coverage/support';
import 'cypress-mochawesome-reporter/register';
import './commands';
import { asProjectAdminUser } from '~/__tests__/cypress/cypress/utils/users';
import { addCommands as webSocketsAddCommands } from './websockets';

chai.use(chaiSubset);

webSocketsAddCommands();

Cypress.Keyboard.defaults({
  keystrokeDelay: 0,
});

if (Cypress.env('MOCK')) {
  Cypress.on('uncaught:exception', (error) => {
    // Failed to execute 'importScripts' on 'WorkerGlobalScope': The script at 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/base/worker/workerMain.js' failed to load.
    if (
      error.message.includes("Failed to execute 'importScripts' on 'WorkerGlobalScope'") &&
      error.message.includes('monaco-editor')
    ) {
      return false;
    }
    return undefined;
  });
}

beforeEach(() => {
  if (Cypress.env('MOCK')) {
    // fallback: return 404 for all api requests
    cy.intercept({ pathname: '/api/**' }, { statusCode: 404 });

    // default intercepts
    asProjectAdminUser();
  }
});

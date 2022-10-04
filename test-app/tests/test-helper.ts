import { currentURL, getSettledState, resetOnerror, setApplication } from '@ember/test-helpers';
import { getPendingWaiterState } from '@ember/test-waiters';
import { start } from 'ember-qunit';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';

import Application from 'test-app/app';
import config from 'test-app/config/environment';

// Prevent tests from re-ordering on refresh
// (use seed query param to deliberately re-order)
QUnit.config.reorder = false;

// easy access debugging tools during a paused or stuck test
Object.assign(window, { getSettledState, currentURL, getPendingWaiterState });

QUnit.testDone(() => {
  resetOnerror();
});

setup(QUnit.assert);

setApplication(Application.create(config.APP));

start();

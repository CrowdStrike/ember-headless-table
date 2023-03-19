'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    autoImport: {
      watchDependencies: ['ember-headless-table'],
    },
    'ember-cli-babel': {
      enableTypeScriptTransform: true,
    },
    'ember-cli-memory-leak-detector': {
      enabled: true, // process.env.DETECT_MEMORY_LEAKS || false,
    },
  });

  const { maybeEmbroider } = require('@embroider/test-setup');

  return maybeEmbroider(app);
};

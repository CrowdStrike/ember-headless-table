'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    autoImport: {
      watchDependencies: ['ember-headless-table'],
      webpack: {
        resolve: {
          fallback: {
            // Sinon is not browser compatible...
            // We should stop using sinon...
            util: require.resolve('util/')
          }
        }
      }
    },
  });

  const { maybeEmbroider } = require('@embroider/test-setup');

  return maybeEmbroider(app);
};

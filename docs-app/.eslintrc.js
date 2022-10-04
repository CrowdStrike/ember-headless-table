'use strict';

const { configs } = require('@nullvoxpopuli/eslint-configs');

// accommodates: JS, TS, App, and Addon
const config = configs.ember();

module.exports = {
  ...config,
  overrides: [
    ...config.overrides,
    {
      files: ['tailwind.config.js'],
      rules: {
        // This ESLint plugin does not understand
        // package.json#exports
        'node/no-missing-require': 'off',
      },
    },
  ],
};

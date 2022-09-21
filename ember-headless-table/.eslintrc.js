'use strict';

const { configs } = require('@nullvoxpopuli/eslint-configs');

let config = configs.ember();

module.exports = {
  ...config,
  overrides: [
    ...config.overrides,
    {
      files: ['**/*.ts'],
      rules: {
        // For consistency, we always define ColumnOptions and TableOptions
        // For plugin authors tho, that is not necessary.
        '@typescript-eslint/no-empty-interface': 'off',
        // We need deliberate use of object and any for proper inference
        '@typescript-eslint/ban-types': 'off',
      },
    },
  ],
};

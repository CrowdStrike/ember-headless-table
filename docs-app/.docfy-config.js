'use strict';

const path = require('path');
const monorepoRoot = path.resolve(__dirname, '..');

module.exports = {
  sources: [
    {
      root: path.resolve(monorepoRoot, 'docs'),
      pattern: '**/*.md',
      urlSchema: 'manual',
      urlPrefix: 'docs',
    },
  ],
};

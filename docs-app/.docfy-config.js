'use strict';

const path = require('path');
const monorepoRoot = path.resolve(__dirname, '..');

module.exports = {
  sources: [
    {
      root: path.resolve(monorepoRoot, 'docs'),
      pattern: '**/*.md',
      // if set to "manual", the URL will need to be specified in each markdown file
      urlSchema: 'auto',
      urlPrefix: 'docs',
    },
  ],
};

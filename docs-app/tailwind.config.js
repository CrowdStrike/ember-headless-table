'use strict';

const path = require('path');

const appRoot = __dirname;
const appEntry = path.join(appRoot, 'app');
const relevantFilesGlob = '**/*.{html,js,ts,hbs,gjs,gts}';

const packageJson = require(path.join(appRoot, 'package.json'));

module.exports = {
  content: [
    path.join(appEntry, relevantFilesGlob),
    /**
     * Also check if addons/libraries contain any tailwind classes
     * that we need to include
     */
    ...Object.keys(packageJson.dependencies).map((depName) => {
      const packagePath = path.dirname(require.resolve(depName));

      return `${packagePath}/${relevantFilesGlob}`;
    }),
  ],
  theme: {
    extend: {},
  },
  presets: [require('@crowdstrike/tailwind-toucan-base')],
  safelist: ['theme-dark', 'theme-light', 'theme-mezzanine'],
};

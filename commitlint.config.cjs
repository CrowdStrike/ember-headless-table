'use strict';

/**
  * The goal of commitlint in this repo is not to enforce
  * eerily similar commit messages across comitters, but
  * to give juuust enough enformation for automated releasing.
  *
  * Beyond major/minor/patch indicators, most of the commit
  * message's conventions are irrelevant, and should instead be
  * focused on content / release notes.
  *
  * And for contributors to the repository, following convential commits
  * is not needed. The maintainer of ember-headless-table merging a PR
  * can specify chore/feat/fix/breaking in the merge commit in the GitHub
  * UI.
  */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // https://commitlint.js.org/#/reference-rules
  // Level [0..2]: 0 disables the rule. For 1 it will be considered a warning for 2 an error.
  // Applicable always|never: never inverts the rule.
  // Value: value to use for this rule.
  rules: {
    // 72, the default, is a little short
    'header-max-length': [1, 'always', 100],
    // Let people use caps
    'header-case': [0],
    // Let people write  sentences
    'header-full-stop': [0],
    // Casing doesn't really matter
    'subject-case': [0],
  },
};

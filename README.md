[![npm version](https://badge.fury.io/js/ember-headless-table.svg)](https://badge.fury.io/js/ember-headless-table)
[![CI](https://github.com/CrowdStrike/ember-headless-table/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/CrowdStrike/ember-headless-table/actions/workflows/ci.yml)

A headless table implementation that supports all the major product-level features needed for feature-rich tables.
Bring your own markup and styles without the need to implement any of the table behaviors.

- hiding and showing columns
- re-ordering columns
- re-sizing columns
- sticky columns
- sorting data

## Install

```bash
pnpm add ember-headless-table
# or
yarn add ember-headless-table
# or
npm install ember-headless-table
# or
ember install ember-headless-table
```

### Compatibility

* ember-auto-import >= v2
* ember-source >= 3.28
* embroider safe + optimized
* typescript >= 4.8, [rolling window policy](https://www.semver-ts.org/#decouple-typescript-support-from-lts-cycles), range: TS@current-2 to TS@current (3 version window).
  Note that types changes will be considered bugfixes until Glint support is added to ember-headless-table
* Glint -- not yet
  All Glint changes will be considered bugfixes until Glint 1.0 is released.

### Usage

See the [Documentation][docs-app] for examples.

[API Reference][docs-api] can be found [here][docs-api].

[docs-app]: https://ember-headless-table.pages.dev/
[docs-api]: https://ember-headless-table.pages.dev/api/modules/


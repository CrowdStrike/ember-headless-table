# How To Contribute

## Installation

* `git clone <repository-url>`
* `cd ember-headless-table`
* `pnpm install`

## Linting

* `pnpm lint`
* `pnpm lint:fix`

## Building the addon

* `cd ember-headless-table`
* `pnpm build`

## Running tests

* `cd test-app`
* `pnpm start` – starts the test app and tests are available at `/tests`
* `pnpm test:ember` – runs the ember tests for the current environment

## Running the docs app

* `cd docs-app`
* `pnpm start` – starts the test app and tests are available at `/tests`

## Notes, Caveats, and Bugs

Until [this pnpm issue#4965](https://github.com/pnpm/pnpm/issues/4965) is fixed,
with the peer-dependency requirements of this repo, every time you re-build the addon,
you'll need to re-run `pnpm install` to re-create the links in the local `node_modules/.pnpm` store.
Thankfully, this is pretty fast.

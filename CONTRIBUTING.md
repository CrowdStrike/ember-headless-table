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

:hear_no_evil: **Note**: if you are building the addon for local development, you have to run `pnpm i` once more after `pnpm build`. This will link the `dist` docs.

## Running tests


* `cd test-app`
* `pnpm start` – starts the test app and tests are available at `/tests`
* `pnpm test:ember` – runs the ember tests for the current environment

## Running the docs app

* `cd docs-app`
* `pnpm start` – starts the test app and tests are available at `/tests`

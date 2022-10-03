# Writing your own

## What can be extended?

## Managing state

## Managing API surface area

## Accessing data from other plugins

## Overriding behavior of an existing plugin

## Supporting preferences

## Recommended plugin file / project Layout

Ultimately, you can do whatever you want, but this is the structure that `ember-headless-table` uses for each plugin.

- `/{plugin-name}/` - folder named after your plugin
  - `plugin.ts` - defines the actual plugin, `Meta`, `Options`, and other related structures.
      The name of the plugin class should be a PascalCased version of the folder name.
  - `helpers.ts` - helpers aimed at public API, but not directly imported -- pre-wires usage of meta (or the other base utilities) along with the plugin exported from `plugin.ts`.
  - `index.ts` - re-exports the public APIs of other files.
      Example:
      ```ts
      export * from './helpers';
      export { ColumnVisibility } from './plugin';

      // Types
      export type { ColumnOptions, TableOptions } from './plugin';
      ```

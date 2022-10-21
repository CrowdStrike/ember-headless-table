# Writing your own

Plugins are a good way to provide functionality to every part of a table without needing to add branching logic to a particular table's implementation.
`ember-headless-table` provides hooks in to the plugin system in a way that allows for unlimited plugin use without any changes to the template markup.


This document is an overview of the plugin system. For details, see the _[Plugin API Documentation][docs-plugins]_.


[docs-plugins]: /api/modules/plugins
[docs-table-option-plugins]: /api/interfaces/index.TableConfig#plugins
[docs-table-options-preferences]: /api/interfaces/index.TableConfig#preferences
[docs-base-plugin]: /api/classes/plugins__private_base.BasePlugin
[docs-plugin-interface]: /api/interfaces/plugins.Plugin
[docs-plugin-meta]: /api/interfaces/plugins.Plugin#meta
[docs-plugin-features]: /api/interfaces/plugins.Plugin#features
[docs-plugin-api-meta]: /api/variables/plugins__private_base.meta
[docs-plugin-api-preferences]: /api/variables/plugins__private_base.preferences
[mdn-private-features]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields
[mdn-CSSStylesheet]: https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet
[mdn-Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

## What can be extended?

Plugins should extend from [`BasePlugin`][docs-base-plugin] (which provides some helper utilities) where a plugin may implement the features described by the [`Plugin`][docs-plugin-interface] interface.

The key properties to look at are:

- modifiers -- for interacting with and providing behavior to specific elements
  - `containerModifier` - for the table's container div
  - `headerCellModifier` - for each `<th>`
  - `rowModifier` - for each `<tr>`
- `reset` -- a hook that the table will call on your plugin if you have state to revert to

With these capabilities, features for tables may be built in a way that relieves implementation complexity on the consumer, such as:

- grouped rows
- editing data
- pagination
- column resizing
- sticky columns / column pinning
- drag and droppable rows

## Managing state

A plugin may manage state for the whole table and/or for each column.
The state managed by your plugin must be declared as a class on the [`meta`][docs-plugin-meta] property:
```js
class MyPlugin {
  meta = {
    table: MyTableMeta,
    column: MyColumnMeta,
    row: MyRowMeta,
  }
}

class MyTableMeta {}
class MyColumnMeta {}
class MyRowMeta {}
```

The table itself will create instances of your meta classes for you, only when needed.
Column meta may also be discarded and/or re-created as columns are added or removed from the table.

## Managing API surface area

All of `ember-headless-table`'s public APIs are public for everyone, which end up allowing direct access to the instances of your Table and Column metas.
The best strategy for mitigating improper use of the data available on the metas is to use [private fields and methods][mdn-private-features] -- this allows only what is required to use your pluign to be accessible from the consumer's template or javascript contexts.

## Accessing data from other plugins

The easiest way to do this is to use the [meta][docs-plugin-api-meta] accessor tool, which provides a way to query for plugins that _provide features_ via `withFeature`.

For example:

```js
import { meta } from 'ember-headless-table/plugins';

// ...

meta.withFeature('columnVisibility').forColumn(columnInstance);
```

Note that this requires that the plugin you're trying to access declares [`features`][docs-plugin-features]


## Overriding behavior of an existing plugin

A plugin, if included in the [`plugins`][docs-table-option-plugins] array of `headlessTable`, may not be overridden.
But a plugin may provide the same (or similar) [`features`][docs-plugin-features] as the plugin being replaced.

## Changing the styles of elements

In your plugin, never set the `style` attribute, this will interfere with other plugins that also add to or remove styles.
Instead, working with a [`CSSStyleSheet`][mdn-CSSStylesheet] and setting specific properties is much more robust,
and can be done safely through some helper utilities provided by the plugin module:

```js
import { applyStyles, removeStyles } from 'ember-headless-table/plugins';

// ...

applyStyles(element, { /* ... styles ... */ });
removeStyles(element, [ /* style property names */ ]);
```

## Supporting preferences

It is up to the consumer of `ember-headless-table` to set their [`preferences`][docs-table-options-preferences]
key when calling `headlessTable`.
It's presently also up to the consumer to decide if they want to debounce or aggregate changes
to their preferences over time -- which would be useful if preferences are stored remotely,
but not as useful if a synchronous storage was used, such as `localStorage`.

As a plugin author, interaction with the consumer's preferences adapter is abstracted for you in a way that you can rely on auto-tracking and can be accessed via the [`preferences`][docs-plugin-api-preferences] accessor tool. This tool mimics the API of [`Map`][mdn-Map].

An example:
```js
import { preferences } from 'ember-headless-table/plugins';

// ...

let columnPreferences = preferences.forColumn(columnInstance, MyPlugin);

columnPreferences.get('some-key');
columnPreferences.set('some-key', 'someValue');
columnPreferences.delete('some-key');

let tablePreferences = preferences.forTable(tableInstance, MyPlugin);

tablePreferences.get('some-key');
tablePreferences.set('some-key', 'someValue');
tablePreferences.delete('some-key');
```

Note that the data in preferences must be serializable to JSON
via JSON.stringify -- so sticking to vanilla objects and arrays will result in the best compatibility between serialization and de-serialization.


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


-----------------------------------------------


<small>Note that the documentation generation tool includes the internal file path of each module, which is useful for finding where to contribute, but this file path does not represent the public/private visibility of the APIs within (the import paths would though)</small>

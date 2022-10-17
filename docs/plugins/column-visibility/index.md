# Column visibility

API Documentation available [here][api-docs]

[api-docs]: /api/modules/plugins_column_visibility

## Usage

### ColumnOptions

Columns can be individually configured

```js
table = headlessTable(this, {
  columns: () => [
    {
      name: 'column A',
      key: 'A',
      pluginOptions: [
        ColumnVisibility.forColumn(() => ({ isVisible: false }))
      ]
    },
    /* ... */
  ],
  /* ... */
})
```

See the API Documentation [here][api-docs] for the full list of options and descriptions.

### TableOptions

None

### Preferences

The visibility state will be stored in preferences, per column.

### Accessibility

It's recommended to use `<button>`s for changing the visibility of columns.
These buttons could be in a menu for the overall table settings,
but the important things to make sure exist are:

- buttons are focusable
- buttons can be navigated to and pressed via keyboard
- buttons can be navigated to and pressed via screen reader tool

### Helpers + StrictMode

There are convenience helpers for aiding in more ergonomic template usage when using this plugin.

```gjs
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { hide, show, isHidden, isVisible } from 'ember-headless-table/plugins/column-visibility';

export const VisibilityMenu = <template>
  {{#each @table.columns as |column|}}
    <span>
      {{column.name}}:
      <button {{on 'click' (fn hide column)}} disabled={{isHidden column}}>
        Hide
      </button>
      <button {{on 'click' (fn show column)}} disabled={{isVisible column}}>
        Show
      </button>
    </span>
  {{/each}}
</template>
```

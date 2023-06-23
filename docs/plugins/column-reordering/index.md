# Column reordering

API Documentation available [here][api-docs]

[api-docs]: /api/modules/plugins_column_reordering

## Usage

```js
import { headlessTable } from 'ember-headless-table';
import { ColumnReordering } from 'ember-headless-table/plugins/column-reordering';

// ...
// in a class
  table = headlessTable(this, {
    columns: () => [ /* ... */ ],
    data: () => [ /* ... */ ],
    plugins: [
      ColumnReordering,
    ],
  })
```

### ColumnOptions

None

### TableOptions

None

### Preferences

The order of columns will be represented in the preferences.

```js
"ColumnReordering": {
  "columns": {},
  "table": {
    "order": {
      "A": 1,
      "B": 2,
      "C": 3,
      "D": 4
    }
  }
}
```

### Accessibility

It's recommended to use `<button>`s for changing the order of columns.
These buttons could be in a menu for the overall table settings,
but the important things to make sure exist are:

- buttons are focusable
- buttons can be navigated to and pressed via keyboard
- buttons can be navigated to and pressed via screen reader tool

### Helpers + StrictMode

There are convenience helpers for aiding in more ergonomic template usage when using this plugin.

```gjs
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import {
  moveLeft, moveRight, cannotMoveLeft, cannotMoveRight
} from 'ember-headless-table/plugins/column-reordering';

export const THead = <template>
  <thead>
    <tr>
      {{#each @columns as |column|}}
        <th {{@table.modifiers.columnHeader column}}>
          <span>{{column.name}}</span><br>
          <button {{on 'click' (fn moveLeft column)}} disabled={{cannotMoveLeft column}}>
            ⇦
          </button>
          <button {{on 'click' (fn moveRight column)}} disabled={{cannotMoveRight column}}>
            ⇨
          </button>
        </th>
      {{/each}}
    </tr>
  </thead>
</template>
```

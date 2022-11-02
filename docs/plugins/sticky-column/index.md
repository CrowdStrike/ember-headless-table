# Sticky columns

API Documentation available [here][api-docs]

[api-docs]: /api/modules/plugins_sticky_columns

## Usage

```js
import { headlessTable } from 'ember-headless-table';
import { StickyColumns } from 'ember-headless-table/plugins/sticky-columns';
import { ColumnResizing } from 'ember-headless-table/plugins/column-resizing';

// ...
// in a class
  table = headlessTable(this, {
    columns: () => [
      /* ... */,
      {
        /* ... */
        pluginOptions: [
          StickyColumns.forColumn(() => ({ sticky: 'right' })),
        ]
      }
    ],
    data: () => [ /* ... */ ],
    plugins: [
      ColumnResizing,
      StickyColumns,
    ],
  })
```

Note that the `ColumnResizing` plugin is required because `StickyColumns` needs a guarantee
that a `columnWidth` implementation exists so that columns may become sticky beyond just the
far left and far right columns.

### ColumnOptions

- `sticky`
  - valid values: `"left"`, `"right"`, `false`
  - tells the plugin which columns to make sticky (and to which side of the table)
  - default value is `false`

### TableOptions

None

### Preferences

None

### Accessibility

If making sticky-columns a user-configurable feature,
it's recommended to use `<button>`s or radio inputs for configuring if a column sticks at all, or to the left or right side.

### Helpers + StrictMode

There are convenience helpers for aiding in more ergonomic template usage when using this plugin.

```gjs
import { StickyColumns, isSticky } from 'ember-headless-table/plugins/sticky-columns';

export const THead = <template>
  <thead>
    <tr>
      {{#each @columns as |column|}}
        <th data-sticky="{{isSticky column}}" {{this.table.modifiers.columnHeader column}}>
          <span>{{column.name}}</span><br>
        </th>
      {{/each}}
    </tr>
  </thead>
</template>
```

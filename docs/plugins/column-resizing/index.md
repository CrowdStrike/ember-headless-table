# Column resizing



API Documentation available [here][api-docs]

[api-docs]: link://tbd

## Usage

Because this plugin operates or visible columns,
the `ColumnVisibility` plugin is required.

```js
import { headlessTable } from 'ember-headless-table';
import { ColumnResizing, resizeHandle } from 'ember-headless-table/plugins/column-resizing';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';

// ...
// in a class
  table = headlessTable(this, {
    columns: () => [ /* ... */ ],
    data: () => [ /* ... */ ],
    plugins: [
      ColumnVisibility,
      ColumnResizing,
    ],
  })
```


### ColumnOptions

Columns can be individually configured

```js
table = headlessTable(this, {
  columns: () => [
    {
      name: 'column A',
      key: 'A',
      pluginOptions: [
        ColumnResizing.forColumn(() => ({ minWidth: 200 }))
      ]
    },
    /* ... */
  ],
  /* ... */
})
```

See the API Documentation [here][api-docs] for the full list of options and descriptions.

### TableOptions

```js
table = headlessTable(this, {
  columns: () => [ /* ... */ ],
  plugins: [
    ColumnVisibility,
    ColumnResizing.with(() => ({ handlePosition: 'right' })),
  ],
})
```

See the API Documentation [here][api-docs] for the full list of options and descriptions.

### Preferences

Nothing is present in the preferences object at this time.

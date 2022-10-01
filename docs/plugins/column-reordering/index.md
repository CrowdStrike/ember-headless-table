# Column reordering

API Documentation available [here][api-docs]

[api-docs]: link://tbd

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



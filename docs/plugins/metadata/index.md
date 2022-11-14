# Metadata

API Documentation available [here][api-docs]

[api-docs]: /api/modules/plugins_metadata

## Usage

Allows arbitrary data to be stored for each column as well as the whole table.
This can be useful eliminating prop-drilling in a UI Table implementation consuming the
headlessTable.

For example, setting up the table can be done like:

```js
import { headlessTable } from 'ember-headless-table';

class Example {
  /* ... */

  table = headlessTable(this, {
    columns: () => [
      { name: 'A', key: 'A' },
      {
        name: 'B',
        key: 'B',
        pluginOptions: [
          Metadata.forColumn(() => ({
            isBulkSelectable: false,
          })),
        ],
      },
      {
        name: 'D',
        key: 'D',
        pluginOptions: [Metadata.forColumn(() => ({ isRad: this.dRed }))],
      },
    ],
    data: () => DATA,
    plugins: [
      Metadata.with(() => ({
        onBulkSelectionChange: (...args) => this.doSomething(...args),
      })),
    ],
  });
}
```

To allow "bulk selection" behaviors to be integrated into how the Table is rendered --
which for fancier tables, my span multiple components.

For example: rows may be their own component

```gjs
// Two helpers are provided for accessing your Metadata
import { forColumn /*, forTable */ } from 'ember-headless-table/plugins/metadata';

const isBulkSelectable = (column) => forColumn(column, 'isBulkSelectable');

export const Row = <template>
  <tr>
    {{#each @table.columns as |column|}}
      {{#if (isBulkSelectable column)}}

        ... render some checkbox UI ...

      {{else}}
        <td>
          {{column.getValueForRow @datum}}
        </td>
      {{/if}}
    {{/each}}
  </tr>
</template>;
```

### ColumnOptions

Any / user-defined.


### TableOptions

Any / user-defined.

### Preferences

None

### Accessibility

Not applicable.

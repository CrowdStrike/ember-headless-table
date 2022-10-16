# Custom cells

Custom components may be used for each column via the [`ColumnConfig`'s `Cell` property][docs-column-Cell].

[docs-column-Cell]: /api/interfaces/index.ColumnConfig#Cell

## Using strict mode

In strict mode, using bespoke components has far greater ergonomics.

```js
import Component from '@glimmer/component';
import { headlessTable } from 'ember-headless-table';

const CustomBackground =
  <template>
    <span style="background-color: {{@row.data.backgroundColor}}">
      Hex: #{{@row.data.backgroundColor}}
    </span>
  </template>;

export default class Demo extends Component {
  table = headlessTable(this, {
    columns: () => [
      {
        name: 'Background color',
        Cell: CustomBackground,
      }
      /* ... */
    ],
    /* ... */
  });

  <template>
    {{#each this.table.rows as |row|}}
      <tr>
        {{#each this.table.columns as |column|}}
          <td>
            {{#if column.Cell}}
              <column.Cell @row={{row}} />
            {{else}}
              ...
            {{/if}}
          </td>

        {{/each}}
      </tr>
    {{/each}}
  </template>
}
```


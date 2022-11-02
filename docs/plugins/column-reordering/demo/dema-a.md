```hbs template
<div class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
    <thead>
      <tr>
        {{#each this.columns as |column|}}
          <th {{this.table.modifiers.columnHeader column}} class="relative group">
            <span class="name">{{column.name}}</span><br>
            <button class="left" {{on 'click' (fn this.moveLeft column)}}>
              ⇦
            </button>
            <button {{on 'click' (fn this.moveRight column)}}>
              ⇨
            </button>
          </th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      {{#each this.table.rows as |row|}}
        <tr>
          {{#each this.columns as |column|}}
            <td>
              {{column.getValueForRow row}}
            </td>
          {{/each}}
        </tr>
      {{/each}}
    </tbody>
  </table>
</div>
```
```js component
import Component from '@glimmer/component';

import { headlessTable } from 'ember-headless-table';
import { meta, columns } from 'ember-headless-table/plugins';
import {
  ColumnReordering,
  moveLeft, moveRight
} from 'ember-headless-table/plugins/column-reordering';

import { DATA } from 'docs-app/sample-data';

export default class extends Component {
  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A' },
      { name: 'column B', key: 'B' },
      { name: 'column C', key: 'C' },
      { name: 'column D', key: 'D' },
    ],
    data: () => DATA,
    plugins: [
      ColumnReordering,
    ],
  });

  get columns() {
    return columns.for(this.table);
  }

  /**
   * Plugin Integration - all of this can be removed in strict mode, gjs/gts
   *
   * This syntax looks weird, but it's read as:
   *   [property on this component] = [variable in scope]
   */
  moveLeft = moveLeft;
  moveRight = moveRight;
}

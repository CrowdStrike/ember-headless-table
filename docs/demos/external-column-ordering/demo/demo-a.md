```hbs template
{{#if this.pendingColumnOrder}}
  <div class="grid gap-4">
    {{#let this.pendingColumnOrder as |order|}}

      <div class="grid gap-4 grid-flow-col">
        {{#each order.orderedColumns as |column|}}
          <div class="flex gap-2">
            <button {{on 'click' (fn order.moveLeft column.key)}}> ⇦ </button>
            {{column.name}}
            <button {{on 'click' (fn order.moveRight column.key)}}> ⇨ </button>
          </div>
        {{/each}}
      </div>

      <button {{on 'click' this.handleReconfigure}}>Submit changes</button>
    {{/let}}
  </div>
{{else}}
  <button {{on 'click' this.changeColumnOrder}}>
    Configure columns
  </button>
{{/if}}

<hr />


The order of the columns in the table
(table not rendered for focusing on the configuration)

<pre>
  {{#each this.columns as |column|}}
    {{column.name}}
  {{/each}}
</pre>
```
```js component
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { headlessTable } from 'ember-headless-table';
import { meta, columns } from 'ember-headless-table/plugins';
import {
  ColumnReordering,
  ColumnOrder,
  setColumnOrder,
  moveLeft, moveRight
} from 'ember-headless-table/plugins/column-reordering';

import { DATA } from 'docs-app/sample-data';

export default class extends Component {
  @tracked pendingColumnOrder;

  changeColumnOrder = () => {
    this.pendingColumnOrder = new ColumnOrder({
      columns: () => this.columns,
    });
  }

  handleReconfigure = () => {
    setColumnOrder(this.table, this.pendingColumnOrder);
    this.pendingColumnOrder = null;
  }


  /**
   * Generic table code below
   */

  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A' },
      { name: 'column B', key: 'B' },
      { name: 'column C', key: 'C' },
    ],
    data: () => DATA,
    plugins: [ColumnReordering],
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

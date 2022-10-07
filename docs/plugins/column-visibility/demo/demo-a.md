```hbs template
<div class="flex flex-wrap gap-x-4 gap-y-2">
  {{#each this.table.columns as |column|}}
    <div>
      {{column.name}}:
      <button {{on 'click' (fn this.hide column)}}>
        Hide
      </button>
      <button {{on 'click' (fn this.show column)}}>
        Show
      </button>
    </div>
  {{/each}}
</div>
<div class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
    <thead>
      <tr>
        {{#each this.columns as |column|}}
          <th {{this.table.modifiers.columnHeader column}} class="relative group">
            {{column.name}}
          </th>
        {{else}}
          <th>
            No columns are visible
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
import { meta } from 'ember-headless-table/plugins';
import { ColumnVisibility, hide, show } from 'ember-headless-table/plugins/column-visibility';

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
      ColumnVisibility,
    ],
  });

  get columns() {
    return meta.forTable(this.table, ColumnVisibility).visibleColumns;
  }

  /**
   * Plugin Integration - all of this can be removed in strict mode, gjs/gts
   *
   * This syntax looks weird, but it's read as:
   *   [property on this component] = [variable in scope]
   */
  hide = hide;
  show = show;
}

```hbs template
<div class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
    <thead>
      <tr class="relative">
        {{#each this.table.columns as |column|}}
          <th
            class="{{if (this.isSticky column) 'bg-basement' 'bg-ground-floor'}}"
            style="{{this.styleStringFor column}}"
          >
            <span class="name">{{column.name}}</span><br>
          </th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      {{#each this.table.rows as |row|}}
        <tr class="relative">
          {{#each this.table.columns as |column|}}
            <td
              class="{{if (this.isSticky column) 'bg-basement' 'bg-ground-floor'}}"
              style="{{this.styleStringFor column}}"
            >
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
import { StickyColumns, isSticky, styleStringFor } from 'ember-headless-table/plugins/sticky-columns';
import { ColumnResizing } from 'ember-headless-table/plugins/column-resizing';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';

import { DATA } from 'docs-app/sample-data';

const minWidth = () => ColumnResizing.forColumn(() => ({ minWidth: 200 }));
const leftSticky = () => StickyColumns.forColumn(() => ({ sticky: 'left' }));
const rightSticky = () => StickyColumns.forColumn(() => ({ sticky: 'right' }));

export default class extends Component {
  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A', pluginOptions: [leftSticky(), minWidth()] },
      { name: 'column B', key: 'B', pluginOptions: [minWidth()] },
      { name: 'column C', key: 'C', pluginOptions: [minWidth()] },
      { name: 'column D', key: 'D', pluginOptions: [minWidth()] },
      { name: 'column E', key: 'E', pluginOptions: [minWidth()] },
      { name: 'column F', key: 'F', pluginOptions: [minWidth()] },
      { name: 'column G', key: 'G', pluginOptions: [rightSticky(), minWidth()] },
    ],
    data: () => DATA,
    plugins: [
      StickyColumns,
      ColumnResizing,
    ],
  });

  /**
   * Plugin Integration - all of this can be removed in strict mode, gjs/gts
   *
   * This syntax looks weird, but it's read as:
   *   [property on this component] = [variable in scope]
   */
  isSticky = isSticky;
  styleStringFor = styleStringFor;
}
```


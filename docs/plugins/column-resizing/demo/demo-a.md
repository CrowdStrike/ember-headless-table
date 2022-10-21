```hbs template
<div class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
    <thead>
      <tr>
        {{#each this.table.columns as |column|}}
          <th {{this.table.modifiers.columnHeader column}} class="relative group">
            <button {{this.resizeHandle column}} class="reset-styles absolute -left-4 cursor-col-resize focusable group-first:hidden">
              ↔
            </button>
            {{#if (this.isResizing column)}}
              <div
                class="absolute -left-3 -top-4 bg-focus w-0.5 transition duration-150"
                style="height: {{this.resizeHeight}}"></div>
            {{/if}}

            <span class="name">{{column.name}}</span><br>
          </th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      {{#each this.table.rows as |row|}}
        <tr>
          {{#each this.table.columns as |column|}}
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
import { htmlSafe } from '@ember/template';

import { headlessTable } from 'ember-headless-table';
import { meta } from 'ember-headless-table/plugins';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';
import { ColumnReordering } from 'ember-headless-table/plugins/column-reordering';
import { ColumnResizing, resizeHandle, isResizing } from 'ember-headless-table/plugins/column-resizing';

import { DATA } from 'docs-app/sample-data';

export default class extends Component {
  resizeHandle = resizeHandle;

  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 100 }))]
      },
      { name: 'column B', key: 'B',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 100 }))]
      },
      { name: 'column C', key: 'C',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 100 }))]
      },
    ],
    data: () => DATA,
    plugins: [
      ColumnVisibility,
      ColumnReordering,
      ColumnResizing,
    ],
  });

  get resizeHeight() {
    return htmlSafe(`${this.table.scrollContainerElement.clientHeight - 32}px`)
  }

  /**
   * Plugin Integration - all of this can be removed in strict mode, gjs/gts
   *
   * This syntax looks weird, but it's read as:
   *   [property on this component] = [variable in scope]
   */
  isResizing = isResizing;
}

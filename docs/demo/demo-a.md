In this example, the column reordering, visibility, resizing, and data sorting plugins are in use.

See the individual plugin pages for more scoped-down examples.

```hbs template
<div class="flex gap-2">
  {{#each this.table.columns as |column|}}
    <span>
      {{column.name}}:
      <button class="hide {{column.key}}" {{on 'click' (fn this.hide column)}}>
        Hide
      </button>
      <button class="show {{column.key}}" {{on 'click' (fn this.show column)}}>
        Show
      </button>
    </span>
  {{/each}}
</div>
<div class="theme-light h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
    <thead>
      <tr>
        {{#each this.columns as |column|}}
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
            <button class="left" {{on 'click' (fn this.moveLeft column)}}>
              ⇦
            </button>
            <button {{on 'click' (fn this.moveRight column)}}>
              ⇨
            </button>
            <button {{on 'click' (fn this.sort column)}}>
              ⇧
            </button>
            <button {{on 'click' (fn this.sort column)}}>
              ⇩
            </button>
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
              {{column.getValueForRow row}}</td>
          {{/each}}
        </tr>
      {{/each}}
    </tbody>
  </table>
</div>
```
```js component
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { htmlSafe } from '@ember/template';

import { headlessTable } from 'ember-headless-table';
import { meta } from 'ember-headless-table/plugins';
import { ColumnReordering } from 'ember-headless-table/plugins/column-reordering';
import { ColumnResizing, resizeHandle } from 'ember-headless-table/plugins/column-resizing';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';
import { DataSorting } from 'ember-headless-table/plugins/data-sorting';

import { DATA } from 'docs-app/sample-data';

export default class extends Component {
  resizeHandle = resizeHandle;

  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 200 }))]
      },
      { name: 'column B', key: 'B',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 200 }))]
      },
      { name: 'column C', key: 'C',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 200 }))]
      },
    ],
    data: () => this.data,
    plugins: [
      ColumnReordering,
      ColumnVisibility,
      ColumnResizing,
      DataSorting.with(() => ({
        sorts: this.sorts,
        onSort: (sorts) => this.sorts = sorts,
      })),
    ],
  });

  @tracked sorts = [];

  get columns() {
    return meta.forTable(this.table, ColumnReordering).columns;
  }

  get data() {
    return sort(DATA, this.sorts);
  }

  get resizeHeight() {
    return htmlSafe(`${this.table.scrollContainerElement.clientHeight - 32}px`)
  }


  /**
   * Plugin Integration
   */
  moveLeft = (column) => {
    return meta.forColumn(column, ColumnReordering).moveLeft();
  };

  moveRight = (column) => {
    return meta.forColumn(column, ColumnReordering).moveRight();
  };

  hide = (column) => {
    return meta.forColumn(column, ColumnVisibility).hide();
  };

  show = (column) => {
    return meta.forColumn(column, ColumnVisibility).show();
  };

  sortDirection = (column) => {
    return meta.forColumn(column, DataSorting).sortDirection;
  };

  sort = (column) => {
    meta.forTable(column.table, DataSorting).handleSort(column);
  };

  isResizing = (column) => {
    return meta.forColumn(column, ColumnResizing).isResizing;
  }
}

/**
 * Utils, not the focus of the demo.
 * but sorting does need to be handled by you.
 */

import { compare } from '@ember/utils';

function hasOwnProperty<T>(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function getValue<T>(obj, key) {
  if (hasOwnProperty(obj, key)) return obj[key];
}

export function sort(data, sorts) {
  // you'll want to sort a duplicate of the array, because Array.prototype.sort mutates.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  //
  // Beware though that if the array is reactive,
  //   this will lose the reactivity if copying this function.
  return [...data].sort((itemA, itemB) => {
    for (let { direction, property } of sorts) {
      let valueA = getValue(itemA, property);
      let valueB = getValue(itemB, property);

      let result = compare(valueA, valueB);

      if (result) {
        return direction === 'descending' ? -result : result;
      }
    }

    return 0;
  });
}
```


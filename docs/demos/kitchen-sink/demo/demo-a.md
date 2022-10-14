```hbs template
<div class="flex gap-2 flex-wrap">
  {{#each this.table.columns as |column|}}
    <span>
      {{column.name}}:
      <button {{on 'click' (fn this.hide column)}} disabled={{this.isHidden column}}>
        Hide
      </button>
      <button {{on 'click' (fn this.show column)}} disabled={{this.isVisible column}}>
        Show
      </button>
    </span>
  {{/each}}
</div>
<div class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table class="w-[150%]">
    <thead>
      <tr>
        {{#each this.columns as |column|}}
          <th
            {{this.table.modifiers.columnHeader column}}
            class="{{if (this.isSticky column) 'bg-basement' 'bg-ground-floor'}} relative group"
          >
            <button {{this.resizeHandle column}} class="reset-styles absolute -left-4 cursor-col-resize focusable group-first:hidden">
              ↔
            </button>
            {{#if (this.isResizing column)}}
              <div
                class="absolute -left-3 -top-4 bg-focus w-0.5 transition duration-150"
                style="height: {{this.resizeHeight}}"></div>
            {{/if}}

            <span class="name">{{column.name}}</span><br>
            <button {{on 'click' (fn this.moveLeft column)}} disabled={{this.cannotMoveLeft column}}>
              ⇦
            </button>
            <button {{on 'click' (fn this.moveRight column)}} disabled={{this.cannotMoveRight column}}>
              ⇨
            </button>
            <button {{on 'click' (fn this.sort column)}}>
              {{#if (this.isAscending column)}}
                × <span class="sr-only">remove sort</span>
              {{else if (this.isDescending column)}}
                ⇧ <span class="sr-only">switch to ascending sort</span>
              {{else}}
                ⇩ <span class="sr-only">switch to ascending sort</span>
              {{/if}}
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
            <td
              {{this.table.modifiers.columnHeader column}}
              class="{{if (this.isSticky column) 'bg-basement' 'bg-ground-floor'}}"
            >
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
import {
  ColumnResizing,
  isResizing, resizeHandle
} from 'ember-headless-table/plugins/column-resizing';
import {
  ColumnReordering,
  moveLeft, moveRight, cannotMoveLeft, cannotMoveRight
} from 'ember-headless-table/plugins/column-reordering';
import {
  ColumnVisibility,
  hide, show, isVisible, isHidden
} from 'ember-headless-table/plugins/column-visibility';
import {
  DataSorting, sort, isAscending, isDescending
} from 'ember-headless-table/plugins/data-sorting';
import {
  StickyColumns, isSticky
} from 'ember-headless-table/plugins/sticky-columns';

import { DATA } from 'docs-app/sample-data';

export default class extends Component {
  resizeHandle = resizeHandle;

  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A',
        pluginOptions: [
          ColumnResizing.forColumn(() => ({ minWidth: 200 })),
          StickyColumns.forColumn(() => ({ sticky: 'left' })),
        ]
      },
      { name: 'column B', key: 'B',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 200 }))]
      },
      { name: 'column C', key: 'C',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 200 }))]
      },
      { name: 'column D', key: 'D',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 200 }))]
      },
      { name: 'column E', key: 'E',
        pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 200 }))]
      },
    ],
    data: () => this.data,
    plugins: [
      ColumnReordering,
      ColumnVisibility,
      ColumnResizing,
      StickyColumns,
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
    return localSort(DATA, this.sorts);
  }

  get resizeHeight() {
    return htmlSafe(`${this.table.scrollContainerElement.clientHeight - 32}px`)
  }


  /**
   * Plugin Integration - all of this can be removed in strict mode, gjs/gts
   *
   * This syntax looks weird, but it's read as:
   *   [property on this component] = [variable in scope]
   */
  hide = hide;
  show = show;
  isVisible = isVisible;
  isHidden = isHidden;

  moveLeft = moveLeft;
  moveRight = moveRight;
  cannotMoveRight = cannotMoveRight;
  cannotMoveLeft = cannotMoveLeft;

  sort = sort;
  isAscending = isAscending;
  isDescending = isDescending;

  isResizing = isResizing;

  isSticky = isSticky;
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

export function localSort(data, sorts) {
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

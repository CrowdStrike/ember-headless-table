
```hbs template
<div data-container class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
    <thead>
      <tr>
        {{#each this.table.columns as |column|}}
          <th {{this.table.modifiers.columnHeader column}}>
            {{column.name}}
          </th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      <VerticalCollection
        @items={{this.table.rows}}
        @containerSelector="[data-container]"
        @key="key"
        @estimateHeight={{37}}
        @staticHeight={{true}}
        @bufferSize={{5}}
      as |row|>
        <tr>
          {{#each this.table.columns as |column|}}
            <td>
              {{column.getValueForRow row}}
            </td>
          {{/each}}
        </tr>
      </VerticalCollection>
    </tbody>
  </table>
</div>
```
```js component
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { headlessTable } from 'ember-headless-table';
import { meta } from 'ember-headless-table/plugins';
import {
  DataSorting,
  sortDescending, sortAscending, sortDirection
} from 'ember-headless-table/plugins/data-sorting';

import { DATA } from 'docs-app/sample-data';

export default class extends Component {
  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A' },
      { name: 'column B', key: 'B' },
      { name: 'column C', key: 'C' },
      { name: 'column D', key: 'D' },
    ],
    data: () => this.data,
    plugins: [
      DataSorting.with(() => ({
        sorts: this.sorts,
        onSort: (sorts) => this.sorts = sorts,
      })),
    ],
  });

  @tracked sorts = [];

  get data() {
    return sort(DATA, this.sorts);
  }

  /**
   * Plugin Integration
   */
  sortDirection = sortDirection;
  sortAscending = sortAscending;
  sortDescending = sortDescending;
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


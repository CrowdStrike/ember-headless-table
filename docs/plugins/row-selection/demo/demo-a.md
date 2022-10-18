This demonstrates how to use the RowSelection plugin to enable multiple row selection.
If single-row selection is desired, that can be handled in userspace, by managing the selection data differently (see other demos).

To select a row, click it. To deselect a row, click it again.

```hbs template
<div class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
    <thead>
      <tr>
        <td></td>
        {{#each this.table.columns as |column|}}
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
        <tr {{this.table.modifiers.row row}} class="{{if (this.isSelected row) 'bg-surface-inner'}}">
          <td>
            <button {{on 'click' (fn this.toggle row)}}>Toggle</button>
          </td>
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

import { headlessTable } from 'ember-headless-table';
import { meta } from 'ember-headless-table/plugins';
import { TrackedSet } from 'tracked-built-ins';
import { RowSelection, toggle, isSelected } from 'ember-headless-table/plugins/row-selection';

import { DATA } from 'docs-app/sample-data';

export default class extends Component {
  selection = new TrackedSet();

  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A' },
      { name: 'column B', key: 'B' },
      { name: 'column C', key: 'C' },
      { name: 'column D', key: 'D' },
    ],
    data: () => DATA,
    plugins: [
      RowSelection.with(() => {
        return {
          selection: this.selection,
          onSelect: (data) => this.selection.add(data),
          onDeselect: (data) => this.selection.delete(data),
        };
      }),
    ],
  });

  /**
   * Plugin Integration - all of this can be removed in strict mode, gjs/gts
   *
   * This syntax looks weird, but it's read as:
   *   [property on this component] = [variable in scope]
   */
  toggle = toggle;
  isSelected = isSelected;
}

```hbs template
<div class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
   <caption>{{ (this.caption) }}</caption>
    <thead>
      <tr>
        {{#each this.table.columns as |column|}}
          <th>
            {{column.name}}
          </th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      {{#each this.table.rows as |row|}}
        <tr>
          {{#each this.table.columns as |column|}}
            {{#if (this.isBold column)}}
              <td class="font-bold">
                This is a bold column.
              </td>
            {{else}}
              <td>
                {{column.getValueForRow row}}
              </td>
            {{/if}}
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
import { Metadata, forColumn, forTable } from 'ember-headless-table/plugins/metadata';

import { DATA } from 'docs-app/sample-data';

export default class extends Component {
  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A' },
      { name: 'column B', key: 'B',
        pluginOptions: [Metadata.forColumn(() => ({ bold: true }))]
      },
      { name: 'column C', key: 'C' },
    ],
    data: () => DATA,
    plugins: [
      Metadata.with(() => ({
        title: 'This is a table with custom metadata',
      }))
    ],
  });

  /**
   * Plugin Integration - all of this can be removed in strict mode, gjs/gts
   *
   * This syntax looks weird, but it's read as:
   *   [property on this component] = [variable in scope]
   */
  forColumn = forColumn;
  forTable = forTable;

  /**
   * these functions would normally live in "module space"
   * when using strict mode.
   */
   isBold = (column) => forColumn(column, 'bold');
   caption = () => forTable(this.table, 'title');
}

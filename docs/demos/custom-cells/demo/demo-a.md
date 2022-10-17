```hbs template
<div class="h-full overflow-auto" {{this.table.modifiers.container}}>
  <table>
    <thead>
      <tr>
        {{#each this.table.columns as |column|}}
          <th {{this.table.modifiers.columnHeader column}}>
            <span class="name">{{column.name}}</span><br>
          </th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      {{#each this.table.rows as |row|}}
        <tr>
          {{#each this.table.columns as |column|}}
            <td {{this.table.modifiers.columnHeader column}}>
              {{#if column.Cell}}
                <column.Cell @data={{row.data}} @column={{column}} />
              {{else}}
                {{column.getValueForRow row}}
              {{/if}}
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
import { DATA } from 'docs-app/sample-data';

// or import a component from elsewhere
// See strict-mode for a more ergonomic way to define inline components
// https://github.com/emberjs/rfcs/pull/779
import { hbs } from 'ember-cli-htmlbars';
import { setComponentTemplate } from '@ember/component';
class MyCustomComponent extends Component {
  // For demonstration only, converts a string to a color
  get color() {
    let key = this.args.data[this.args.column.key];
    let color = key.split('').map(char => char.charCodeAt(0).toString(16)).join('').slice(0, 6);

    return `#${color}`;
  }
};
setComponentTemplate(hbs`
  <span
    style="box-shadow: 0 2px 6px {{this.color}}"
    class="ml-2 p-1 rounded border border-white"
  >
    {{this.color}}
  </span>
`, MyCustomComponent);

export default class extends Component {
  table = headlessTable(this, {
    columns: () => [
      { name: 'Custom Cell', key: 'A', Cell: MyCustomComponent },
      { name: 'column B', key: 'B' },
      { name: 'column C', key: 'C' },
      { name: 'column D', key: 'D' },
      { name: 'column E', key: 'E' },
    ],
    data: () => DATA,
  });
}
```

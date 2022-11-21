```hbs template
<div {{this.table.modifiers.container}}>
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

import { headlessTable } from 'ember-headless-table';

export default class extends Component {
  table = headlessTable(this, {
    columns: () => [
      { name: 'column A', key: 'A' },
      { name: 'column B', key: 'B' },
      { name: 'column C', key: 'C' },
    ],
    data: () => [
      {
        A: 'Apple',
        B: 'Berry',
        C: 'Cranberry',
      },
      {
        A: 'Avocado',
        B: 'Plantain',
        C: 'Cucumber',
      },
      {
        A: 'A Squash',
        B: 'Banana',
        C: 'Corn',
      },
    ],
  });
}
```

# Default values

The default value can be changed in the column config.


## Using strict mode

In strict mode, specifying a default value can be done like this:
```js
import Component from '@glimmer/component';
import { headlessTable } from 'ember-headless-table';

export default class Demo extends Component {
  table = headlessTable(this, {
    columns: () => [
      {
        name: 'Background color',
        key: 'bgColor'
        options: () => {
          return {
            defaultValue: '???',
          };
        }
      }
      /* ... */
    ],
    /* ... */
  });

  <template>
    {{#each this.table.rows as |row|}}
      <tr>
        {{#each this.table.columns as |column|}}

          <td>
            {{column.getValueForRow row}}
          </td>

        {{/each}}
      </tr>
    {{/each}}
  </template>
}
```

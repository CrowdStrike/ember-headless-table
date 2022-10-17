# Data sorting

API Documentation available [here][api-docs]

[api-docs]: /api/modules/plugins_data_sorting

## Usage

### ColumnOptions

None

### TableOptions

None

### Preferences

None

### Accessibility

It's recommended to use `<button>`s for sorting columns.

- buttons are focusable
- buttons can be navigated to and pressed via keyboard
- buttons can be navigated to and pressed via screen reader tool

[aria-sort](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-sort)
will be added and updated for you, via the `columnHeader` modifiers.

### Helpers + StrictMode

There are convenience helpers for aiding in more ergonomic template usage when using this plugin.

```gjs
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { sortAscending, sortDescending, sort } from 'ember-headless-table/plugins/data-sorting';

export const THead = <template>
  <thead>
    <tr>
      {{#each @columns as |column|}}
        <th {{@table.modifiers.columnHeader column}}>
          <span>{{column.name}}</span><br>

          <button {{on 'click' (fn sortAscending column)}}>
            ⇧
          </button>
          <button {{on 'click' (fn sortDescending column)}}>
            ⇩
          </button>
          <button {{on 'click' (fn sort column)}}>
            Toggle Sort
          </button>
        </th>
      {{/each}}
    </tr>
  </thead>
</template>
```

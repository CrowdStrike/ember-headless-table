# Row selection

API Documentation available [here][api-docs]

[api-docs]: /api/modules/plugins_row_selection

## Usage

State for what is selected is managed by you, the consumer.
This plugin provides helpful utilities and automatically wires up event listeners for each row.

### ColumnOptions

None


### TableOptions

Required:
 - `selection` - a collection of what is already selected
 - `onSelect` - event handler for when a row is selected
 - `onDeselect` - event handler for when a row is deselected

Optional:
  - `key` - a function which will be passed to `onSelect` and `onDeselect` for helping manage "what" is selected. This should be the same data type as the individual elements within the `selection`


See the API Documentation [here][api-docs] for the full list of options and descriptions.

### Preferences

None

### Accessibility

Without a focusable element to trigger a row selection,
keyboard and screen reader users will not be able to select a row.
When using this plugin, ensure that each row has a focusable element that interacts with the selection APIs for that row.

### Helpers + StrictMode

There are convenience helpers for aiding in more ergonomic template usage when using this plugin.

```gjs
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { toggle, isSelected } from 'ember-headless-table/plugins/row-selection';

export const Rows =
<template>
  <tbody>
    {{#each @table.rows as |row|}}
      <tr {{@table.modifiers.row row}} class="{{if (isSelected row) 'bg-surface-inner'}}">
        <td>
          <button {{on 'click' (fn toggle row)}}>Toggle</button>
        </td>
        {{#each @table.columns as |column|}}
          <td>
            {{column.getValueForRow row}}
          </td>
        {{/each}}
      </tr>
    {{/each}}
  </tbody>
</template>
```

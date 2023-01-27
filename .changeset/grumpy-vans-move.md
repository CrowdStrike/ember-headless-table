---
'ember-headless-table': patch
---

Add new util for the resizing plugin to help styles cells in non-header rows in non-tables (such as grids).

To use it,

```gjs
import { styleStringFor } from 'ember-headless-table/plugins/column-resizing';

// ...

// rows.gjs
<template>
  {{#each @table.rows as |row|}}
    <div role="row">
      {{#each @table.columns as |column|}}
        <div role="cell" style={{styleStringFor column}}>{{column.getValueForRow row}}</div>
      {{/each}}
    </div>
  {{/each}}
</template>
```

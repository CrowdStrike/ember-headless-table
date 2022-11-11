---
'ember-headless-table': minor
---

Add a new API for the column-reordering plugin that allows for
managing column order independently of the table's column order,
for example, in a configuration UI / preview, one may want to
see how their changes will look before applying them to the table.

To use this new API, there are two relevant imports:

```js
import {
  ColumnOrder,
  setColumnOrder,
} from 'ember-headless-table/plugins/column-reordering';
```

To manage the "preview column order",
you'll want to instantiate the `ColumnOrder` class,
and then once your changes are done, call `setColumnOrder` and pass
both the table and the `ColumnOrder` instance:

```js
class Demo {
  @tracked pendingColumnOrder;

  changeColumnOrder = () => {
    this.pendingColumnOrder = new ColumnOrder({
      columns: () => this.columns,
    });
  };

  handleReconfigure = () => {
    setColumnOrder(this.table, this.pendingColumnOrder);
    this.pendingColumnOrder = null;
  };
}
```

In this example, when working with `this.pendingColumnOrder`, you may use
familiar "moveLeft" and "moveRight" behaviors,

```hbs
{{#let this.pendingColumnOrder as |order|}}

  {{#each order.orderedColumns as |column|}}

    <button {{on 'click' (fn order.moveLeft column.key)}}> ⇦ </button>

    {{column.name}}

    <button {{on 'click' (fn order.moveRight column.key)}}> ⇨ </button>

  {{/each}}

  <button {{on 'click' this.handleReconfigure}}>Submit changes</button>
{{/let}}
```

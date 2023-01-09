---
'ember-headless-table': minor
---

Add new "query" util: `hasPlugin`, allowing consumers of the headlessTable to
ask if a plugin is active and get a boolean response.

Example:

```js
import { headlessTable } from 'ember-headless-table';
import { hasPlugin } from 'ember-headless-table/plugins';
import { DataSorting } from 'ember-headless-table/plugins/data-sorting';

// ... ✂️ ...
let table = headlessTable(this, {
  columns: () => [],
  data: () => [],
  plugins: [DataSorting],
});

hasPlugin(table, DataSorting); // => true
```

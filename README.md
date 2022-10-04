# @crowdstrike/ember-headless-table

## Install

```
ember install @crowdstrike/ember-headless-table
```

### Compatibility

* ember-auto-import >= v2
* ember-source >= 3.25

### Usage

```js
import { headlessTable } from '@crowdstrike/ember-headless-table';

class Foo {
  table = headlessTable(this, {
    columns: [
      /* ... */
    ],
    data: [
      /* ... */
    ],
  });
}
```




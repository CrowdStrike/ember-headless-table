---
'ember-headless-table': patch
---

`deserializeSorts` now will gracefully return an empty array upon receiving empty input.

Example:

```js
import { deserializeSorts } from 'ember-headless-table';

deserializeSorts(''); // => []
```

Previously, an error would be reported:

```
No key found for input: `` using `.` as a separator
```

which wasn't all that helpful.

When using the data-sorting plugin with this util, it is perfectly safe to "deserialize sorts" to an empty array
and have that empty array be equivelant to no sorting being applied at all.

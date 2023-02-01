---
'ember-headless-table': patch
---

Address an issue where instances of plugins would be held on to after a Table is destroyed.

This caused a memory leak due how plugins, and their associated metadata, held on to
Table instances, which in turn, held on to the owner / container.

This was caused by the utility methods in `ember-headless-table/plugins`,

- `preferences`
- `meta`
- `options`

Because data was stored in (Weak)Maps in module-space.
This alone isn't a problem, but they were never cleaned up when the table was destroyed.

Cleanup of these objects could have occured via `associateDestroyableChild` and `registerDestructor`
from `@ember/destroyable`, but it was easier to instead have this happen automatically via hosting the
data needed for the "plugins utils" on the table itself. Since each plugin util requires "some instance of something",
be that a row, column, or table, there is a direct path to the table, and therefor a direct way to access
memory-scoped (Weak)Maps.

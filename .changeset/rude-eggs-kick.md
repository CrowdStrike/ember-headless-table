---
'ember-headless-table': patch
---

Fixes the issue reported in https://github.com/CrowdStrike/ember-headless-table/issues/60
Where the column reordering and visibility plugins were not integrating well together.
In short, moving column, then hiding that same column, then moving a column "over the gap"
between the columns resulted in all column reordering no longer working.
Using both of the plugins together should now work as intuitively expected.

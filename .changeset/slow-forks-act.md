---
'ember-headless-table': patch
---

Added toStyle helper in column-resizing plugin > helper. This should fix when a `minWidth` is passed in the column config and not getting converted to `min-width` for the style attribute string.

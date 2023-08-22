---
"ember-headless-table": patch
---

Column widths are saved and reset in a single call to the preferences service,
rather than on a per column basis, for improved UI performance

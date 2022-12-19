---
'ember-headless-table': patch
---

Prevent hard-to-debug issues that occur with incorrect column configs.
One such way problems can occur is when the `key` property is duplicated
for multiple column configs. 

This is now eagerly prevented via dev-time Error. 
All the column config validity checking code is removed in production builds
via `@embroider/macros` `macroCondition(isDevelopingApp())`.

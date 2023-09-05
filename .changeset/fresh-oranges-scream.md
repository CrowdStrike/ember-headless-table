---
'ember-headless-table': patch
---

Bugfix: the plugin for resize was not checking if the table was destroyed first.

This fixes that so the observer is not listening for a removed table, which was causing an error in the preferences (since it was trying to set preferences for a table which is not on screen)

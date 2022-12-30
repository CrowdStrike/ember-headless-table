---
'ember-headless-table': minor
---

An alternative, yet more verbose, option is now available for the sticky / pinnable columns plugin.

This is, in part, due to waiting on
[RFC#883: add new timing capabilities to modifier manager](https://github.com/emberjs/rfcs/pull/883).

But also, as an escape hatch for performance sensitive situations where one would want to avoid altering any style attributes during render (as is one of the primary use cases of RFC#883) as this causes repaint calculations and degraded performance in the browser.

This new technique for the sticky/pinnable colums plugin allows you to set the `style` attribute so that the browser can calculate layout in a single pass.

To opt in to this, two things must be done:

1. invoke the `styleStringFor` helper in the template, and set the result to the `style` attribute for the `th` and `td` cells.

   ```gjs
   import { styleStringFor } from 'ember-headless-table/plugins/sticky-columns'

   // ...

   <template>
       <div class="h-full overflow-auto">
         <table>
           <thead>
             <tr class="relative">
               {{#each @table.columns as |column|}}
                 <th style="{{styleStringFor column}}">
                   {{column.name}}
                 </th>
               {{/each}}
             </tr>
           </thead>
           <tbody>
             {{#each @table.rows as |row|}}
               <tr class="relative">
                 {{#each @table.columns as |column|}}
                   <td style="{{styleStringFor column}}">
                     {{column.getValueForRow row}}
                   </td>
                 {{/each}}
               </tr>
             {{/each}}
           </tbody>
         </table>
       </div>
   </template>
   ```

2. when configuring the `StickyColumns` plugin in `headlessTable`, configure the the `workaroundForModifierTimingUpdateRFC883` flag to `true`. This allows td and th cells to have modifiers without causing repaints due to style changes caused by the sticky columns plugin.

```js
class Example {
  table = headlessTable(this, {
    columns: () => [
      // ...
    ],
    // ...
    plugins: [
      StickyColumns.with(() => ({
        workaroundForModifierTimingUpdateRFC883: true,
      })),
    ],
  });
}
```

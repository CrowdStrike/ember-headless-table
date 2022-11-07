# Adding style

ember-headless-table supports any and all styling techniques.
- Traditional [CSS Stylesheets][css-stylesheets]
- [CSS Modules][css-modules]
- [Tailwind][css-tailwind]
- [CSS-in-JS][css-in-js]
- any combination of the above, or any styling technique not on this list

If you use embroider + tailwind, and maybe also want CSS Modules, we recommend [this guide on discuss.ember.js.com][guide-modern-css]

[css-stylesheets]: https://developer.mozilla.org/en-US/docs/Web/CSS
[css-modules]: https://github.com/css-modules/css-modules
[css-tailwind]: https://tailwindcss.com/
[css-in-js]: https://github.com/rajasegar/ember-csz

[guide-modern-css]: https://discuss.emberjs.com/t/ember-modern-css/19614

<hr />

Since ember-headless-table allows you to _bring your own markup_.
There is one caveat that we require a wrapper div so that the table can install a modifier that observes container resizes and other container-related events.


## Example using Tailwind

```gjs
import Component from '@glimmer/component';
import { headlessTable } from 'ember-headless-table';

export class TailwindDemo extends Component {
  table = headlessTable(this, {
    columns: () => [ /* ... */ ] ,
    data: () => [ /* ... */ ],
  });

  <template>
    {{! This wrapper div is required, along with applying of table.modifiers.container }}
    <div class="h-full overflow-auto" {{this.table.modifiers.container}}>
      <table>
        <thead>
          <tr>
            {{#each this.table.columns as |column|}}
              <th {{this.table.modifiers.columnHeader column}}>
                <span class="font-bold">{{column.name}}</span><br>
              </th>
            {{/each}}
          </tr>
        </thead>
        <tbody>
          {{#each this.table.rows as |row|}}
            <tr>
              {{#each this.table.columns as |column|}}
                <td>{{column.getValueForRow row}}</td>
              {{/each}}
            </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
  </template>
}
```

## Example using CSS


Using co-located CSS in embroider following [this guide on discuss.ember.js.com][guide-modern-css].

```css
/* c-s-s-demo/styles.css */
.my-table {
  height: 100%;
  overflow: auto;
}

.my-table th span {
  font-weight: bold;
}
```
```gjs
/* c-s-s-demo/index.gjs */
import Component from '@glimmer/component';
import { headlessTable } from 'ember-headless-table';

export class CSSDemo extends Component {
  table = headlessTable(this, {
    columns: () => [ /* ... */ ] ,
    data: () => [ /* ... */ ],
  });

  <template>
    <div class=".my-table" {{this.table.modifiers.container}}>
      <table>
        <thead>
          <tr>
            {{#each this.table.columns as |column|}}
              <th {{this.table.modifiers.columnHeader column}}>
                <span>{{column.name}}</span><br>
              </th>
            {{/each}}
          </tr>
        </thead>
        <tbody>
          {{#each this.table.rows as |row|}}
            <tr>
              {{#each this.table.columns as |column|}}
                <td>{{column.getValueForRow row}}</td>
              {{/each}}
            </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
  </template>
}
```

## Styling and UX

With CSS / Tailwind / etc, some styling of certain ui elements, such as a resize-handle, may be a smidge tricky.

All demos throughout the these docs will include the tailwind version of how to style these elements.

For example, in the [column resizing demo](/docs/plugins/column-resizing),
the way the resizing indicator is done requires a couple tricks:

```glimmer
<button
  {{! resizeHandle is provided by the column-resizing plugin }}
  {{resizeHandle column}}
  {{!--
    styling for this button to be slightly left of the column so that the button looks
    like it's the boundary between the columns
  --}}
  class="reset-styles absolute -left-4 cursor-col-resize focusable group-first:hidden"
>
  ↔
</button>

{{!--
  boolean whos return value is managed by the plugin, but used to optionally show a div
  when this particular column is being resized
--}}
{{#if (isResizing column)}}
  <div
    {{!--
      using absolute positioning requires *relative* positioning on the `th`
      that contains this div + button combo
    --}}
    class="absolute -left-3 -top-4 bg-focus w-0.5 transition duration-150"
    {{!--
      resizeHeight is the calculation of the container height (the div around the table)
      + some arbitrary value in pixels for visual offset of the line drawn by this div.
    --}}
    style="height: {{this.resizeHeight}}"></div>
{{/if}}
```

# Column visibility

API Documentation available [here][api-docs]

[api-docs]: link://tbd

## Usage

### ColumnOptions

### TableOptions

### Preferences

### Helpers + StrictMode

There are convenience helpers for aiding in more ergonomic template usage when using this plugin.

```gjs
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { hide, show, isHidden, isVisible } from 'ember-headless-table/plugins/column-visibility';

export const VisibilityMenu = <template>
  {{#each @table.columns as |column|}}
    <span>
      {{column.name}}:
      <button {{on 'click' (fn hide column)}} disabled={{isHidden column}}>
        Hide
      </button>
      <button {{on 'click' (fn show column)}} disabled={{isVisible column}}>
        Show
      </button>
    </span>
  {{/each}}
</template>
```

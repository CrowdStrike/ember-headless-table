---

title: TypeScript/Glint

---
# Using with TypeScript/Glint

This library is written in TypeScript, but it is still new and the shape of the types may only improve with time as we add type tests using [expect-type][gh-expect-type].

While this library adheres and strives for [SemVer][docs-semver], TypeScript does not.
Type changes during minor upgrades may be considered breaking changes to some.
Today, the type-tests in this library are few, so we cannot guarantee SemVer with our types _yet_.
The goal, is to follow the advice of [Semantic Versioning for TypeScript Types][rfc-730] -- but to do so,
requires more type tests. Until noted in the Changelog that our TypeScript types fall under SemVer,
consider type changes to "bugfixes" for patch releases.

If any bugs (or confusion) are encountered with the type inference, whether in JS, TS, or templates, please [open an issue][self-issue].

[rfc-730]: https://github.com/emberjs/rfcs/pull/730
[gh-expect-type]: https://github.com/mmkal/expect-type
[docs-semver]: https://semver.org/
[docs-glint]: https://typed-ember.gitbook.io/glint/
[self-issue]: https://github.com/CrowdStrike/ember-headless-table/issues

## In JavaScript and TypeScript

When defining all parameters within the `headlessTable` function, all type inference should "just work",
but all relavant types are available manual usage for creating reactive data within your config.

For example

```ts
import {
  headlessTable,
  type ColumnConfig,
} from 'ember-headless-table';

class Demo {
  table = headlessTable(this, {
    columns: () => [ /* ... */ ], // ColumnConfig<DataType>[]
    data: () => [ /* ... */ ], // DataType[] - generic, inferred from whatever is passed here
  });
}
```
could be written as (for swapping out both columns and data)

```ts
import { tracked } from '@glimmer/tracking';

import {
  headlessTable,
  type ColumnConfig,
} from 'ember-headless-table';

interface MyData {
  foo: string;
  bar: number;
}

class Demo {
  @tracked columns: ColumnConfig<MyData>[] = [ /* ... */ ]

  @tracked data: MyData[] = [ /* ... */ ];

  table = headlessTable(this, {
    columns: () => this.columns,
    data: () => this.data,
  });
}
```


## In Templates

[Glint][docs-glint] is still young, and pre-release, but it's proved it's worth -- and for new projects,
it can be a great choice to help ensure that your code is as bug-free as possible.
Glint was the missing for TypeScript to truely shine in Ember, and this library strives to make sure that
inference of all public APIs (properties, plugin-configs, etc) _works by default_.

Here are a couple screenshots from our own tests showing that Glint provides intellisense and JSDoc documentation in VSCode:

![Glint in VSCode providing intillesense](/glint-example-intellisense.png)
![Glint in VSCode providing inline API documentation](/glint-example-jsdoc.png)

### Editor integration

The Glint [getting started docs][docs-glint-start] cover some of this, but for quick access, you may be interested in these links:

- Glint [VS Code Extension][glint-ext-vscode]
- Glint [Language Server][glint-ls]
- Example usage with native LSP w/ [neovim][example-neovim-lsp]


[example-neovim-lsp]: https://github.com/NullVoxPopuli/dotfiles/blob/0df85d633f978cf67c7df9d36d21ce6820d4b419/home/.config/nvim/lua/plugin-config/lsp.lua#L25
[glint-ls]: https://typed-ember.gitbook.io/glint/getting-started
[glint-ext-vscode]: https://marketplace.visualstudio.com/items?itemName=typed-ember.glint-vscode
[docs-glint-start]: https://typed-ember.gitbook.io/glint/getting-started

import Component from '@glimmer/component';
// @ts-ignore
import { on } from '@ember/modifier';
// @ts-ignore
import { fn } from '@ember/helper';
import { assert } from '@ember/debug';
import { click, render, findAll, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { meta, columns } from 'ember-headless-table/plugins';
import { ColumnVisibility, hide, show } from 'ember-headless-table/plugins/column-visibility';
import { ColumnReordering, moveLeft, moveRight } from 'ember-headless-table/plugins/column-reordering';

import { DATA } from 'test-app/data';
import type { Table, PreferencesData } from 'ember-headless-table';
import { setOwner } from '@ember/application';

module('Plugins | columnVisibility', function (hooks) {
  setupRenderingTest(hooks);

  let ctx: Context;

  class Context {
    columns = [
      { name: 'A', key: 'A' },
      { name: 'B', key: 'B' },
      { name: 'C', key: 'C' },
      { name: 'D', key: 'D' },
    ];

    table = headlessTable(this, {
      columns: () => this.columns,
      data: () => DATA,
      plugins: [ColumnVisibility],
    });
  }

  class TestComponentA extends Component<{ ctx: { table: Table<typeof DATA[0]> } }> {
    get table() {
      return this.args.ctx.table;
    }

    <template>
      <style>
        [data-scroll-container] {
          height: 100%;
          overflow: auto;
        }

        th {
          position: relative;
          border: 1px solid #999;
        }
      </style>
      <div>
        {{#each this.table.columns as |column|}}
          {{column.name}}:
          <button class="hide {{column.key}}" {{on 'click' (fn hide column)}}>
            Hide
          </button>
          <button class="show {{column.key}}" {{on 'click' (fn show column)}}>
            Show
          </button>
          <br>
        {{/each}}
      </div>
      <div class="theme-light" data-scroll-container {{this.table.modifiers.container}}>
        <table>
          <thead>
            <tr>
              {{#each (columns.for this.table) as |column|}}
                <th class="{{column.key}}" {{this.table.modifiers.columnHeader column}}>
                  {{column.name}}
                </th>
              {{else}}
                <th>
                  No columns are visible
                </th>
              {{/each}}
            </tr>
          </thead>
          <tbody>
            {{#each this.table.rows as |row|}}
              <tr>
                {{#each (columns.for this.table) as |column|}}
                  <td>{{column.getValueForRow row}}</td>
                {{/each}}
              </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
    </template>
  }

  module('with no options specified', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => DATA,
        plugins: [ColumnVisibility],
      });
    }

    hooks.beforeEach(function () {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);
    });

    test('everything is visible', async function (assert) {
      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      // all columns are visible (because we configured it that way)
      assert.dom('th').exists({ count: 4 });
      assert.dom(`th.${ctx.columns[0]?.key}`).exists();
      assert.dom(`th.${ctx.columns[1]?.key}`).exists();
      assert.dom(`th.${ctx.columns[2]?.key}`).exists();
      assert.dom(`th.${ctx.columns[3]?.key}`).exists();
    });

    test('each column can be toggled', async function (assert) {
      assert.expect(17);

      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('th').exists({ count: 4 });

      for (let column of ctx.columns) {
        await click(`.hide.${column.key}`);
        assert.dom('th').exists({ count: 3 });
        assert.dom('thead tr').doesNotContainText(column.name);

        await click(`.show.${column.key}`);
        assert.dom('th').exists({ count: 4 });
        assert.dom('thead tr').containsText(column.name);
      }
    });

    test('all columns can be hidden', async function (assert) {
      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('th').exists({ count: 4 });
      assert.dom('thead').doesNotContainText('No columns are visible');

      for (let column of ctx.columns) {
        await click(`.hide.${column.key}`);
      }

      assert.dom('thead').containsText('No columns are visible');
    });

    test('columns re-appear in the same order they were left in', async function (assert) {
      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('thead tr').hasText('A B C D');

      for (let column of ctx.columns) {
        await click(`.hide.${column.key}`);
      }

      assert.dom('thead tr').doesNotContainText('ABCD');

      await click(`.show.${ctx.columns[2]?.key}`)
      await click(`.show.${ctx.columns[0]?.key}`)
      await click(`.show.${ctx.columns[3]?.key}`)
      await click(`.show.${ctx.columns[1]?.key}`)

      assert.dom('thead tr').hasText('A B C D');
    });
  });


  module('Columns can be hidden by default', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => [
          {
            name: 'A',
            key: 'A',
            pluginOptions: [
              [ColumnVisibility, () => ({ isVisible: false }) ]
            ]
          },
          {
            name: 'B',
            key: 'B',
            pluginOptions: [
              [ColumnVisibility, () => ({ isVisible: true }) ]
            ]
          },
          {
            name: 'C',
            key: 'C',
            pluginOptions: [
              [ColumnVisibility, () => ({ isVisible: false }) ]
            ]
          },
          { name: 'D', key: 'D' },
        ],
        data: () => DATA,
        plugins: [ColumnVisibility],
      });
    }

    hooks.beforeEach(async function (assert) {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);

      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('th').exists({ count: 2 });
      assert.dom(`th.A`).doesNotExist();
      assert.dom(`th.B`).exists();
      assert.dom(`th.C`).doesNotExist();
      assert.dom(`th.D`).exists();
    });

    test('a column configured to be hidden can be toggled', async function(assert) {
      await click(`.show.A`);
      assert.dom('th').exists({ count: 3 });
      assert.dom('thead tr').containsText('A');

      await click(`.hide.A`);
      assert.dom('th').exists({ count: 2 });
      assert.dom('thead tr').doesNotContainText('A');
    });

    test('a column configured to be visible can be toggled', async function (assert) {
      await click(`.hide.B`);
      assert.dom('th').exists({ count: 1 });
      assert.dom('thead tr').doesNotContainText('B');

      await click(`.show.B`);
      assert.dom('th').exists({ count: 2 });
      assert.dom('thead tr').containsText('B');
    });

    test('a column not configured at all has default behavior', async function (assert) {
      await click(`.hide.D`);
      assert.dom('th').exists({ count: 1 });
      assert.dom('thead tr').doesNotContainText('D');

      await click(`.show.D`);
      assert.dom('th').exists({ count: 2 });
      assert.dom('thead tr').containsText('D');
    });
  });

  module('interaction with other plugins', function () {
    module('ColumnReordering', function (hooks) {

      let getColumnOrder = () => findAll('thead tr th').map(x => {
        assert('expected element to exist and have innerText', x instanceof HTMLElement);

        return x.innerText.trim()
      }).join(' ').trim();

      /**
        * https://github.com/CrowdStrike/ember-headless-table/issues/60
        *
        * When moving a column over a hidden column, all columns become hidden.
        * This shouldn't happen.
        *
        * These two tests are the same, but it matters if moving would swap end-cap columns
        * or not
        */
      module('#60, move -> hide -> move works as expected', function (hooks) {
        test('for 4 columns', async function (assert) {
          class DefaultOptions {
            columns = [
              { name: 'A', key: 'A' },
              { name: 'B', key: 'B' },
              { name: 'C', key: 'C' },
              { name: 'D', key: 'D' },
            ];

            table = headlessTable(this, {
              columns: () => this.columns,
              data: () => [] as typeof DATA[0][],
              plugins: [ColumnReordering, ColumnVisibility],
            });
          }

          let ctx = new DefaultOptions();
          setOwner(ctx, this.owner);

          await render(
            <template>
              {{#each ctx.table.columns as |column|}}
                <button id="{{column.key}}-left" {{on 'click' (fn moveLeft column)}}>move {{column.key}} left</button>
                <button id="{{column.key}}-right" {{on 'click' (fn moveRight column)}}>move {{column.key}} right</button>
                <br>
              {{/each}}

              <TestComponentA @ctx={{ctx}} />
            </template>
          );

          assert.strictEqual(getColumnOrder(), 'A B C D', 'initial state');

          await click('#A-right');

          assert.strictEqual(getColumnOrder(), 'B A C D', 'A and B swapped');

          await click('.hide.A');

          assert.strictEqual(getColumnOrder(), 'B C D', 'A is hidden');

          await click('#B-right');

          assert.strictEqual(getColumnOrder(), 'C B D', 'B and C swapped');
        });

        test('for 3 columns', async function (assert) {
          class DefaultOptions {
            columns = [
              { name: 'A', key: 'A' },
              { name: 'B', key: 'B' },
              { name: 'C', key: 'C' },
            ];

            table = headlessTable(this, {
              columns: () => this.columns,
              data: () => [] as typeof DATA[0][],
              plugins: [ColumnReordering, ColumnVisibility],
            });
          }

          let ctx = new DefaultOptions();
          setOwner(ctx, this.owner);

          await render(
            <template>
              {{#each ctx.table.columns as |column|}}
                <button id="{{column.key}}-left" {{on 'click' (fn moveLeft column)}}>move {{column.key}} left</button>
                <button id="{{column.key}}-right" {{on 'click' (fn moveRight column)}}>move {{column.key}} right</button>
                <br>
              {{/each}}

              <TestComponentA @ctx={{ctx}} />
            </template>
          );

          assert.strictEqual(getColumnOrder(), 'A B C', 'initial state');

          await click('#A-right');

          assert.strictEqual(getColumnOrder(), 'B A C', 'A is now in the middle');

          await click('.hide.A');

          assert.strictEqual(getColumnOrder(), 'B C', 'A is hidden');

          await click('#B-right');

          assert.strictEqual(getColumnOrder(), 'C B', 'columns are swapped');
        });
      });
    });
  });

  module('with a preferences adapter', function (hooks) {
    let preferences: null | PreferencesData = {};

    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => DATA,
        plugins: [ColumnVisibility],
        preferences: {
          key: 'test-preferences',
          adapter: {
            persist: (_key: string, data: PreferencesData) => {
              preferences = data;
            },
            restore: (key: string) => {
              return {
                "plugins": {
                  "column-visibility": {
                    "columns": {
                      "A": {},
                      "B":{ "isVisible": false },
                      "C": { "isVisible": false },
                      "D": {},
                    },
                    "table": {},
                  },
                }
              };
            }
          }
        }
      });
    }

  hooks.beforeEach(async function () {
    preferences = null;
    ctx = new DefaultOptions();
    setOwner(ctx, this.owner);

    await render(
      // @ts-ignore
      <template>
        <TestComponentA @ctx={{ctx}} />
      </template>
    );
  });

  test('column visibility is set from preferences', async function (assert) {
    assert.dom('th').exists({ count: 2 });
    assert.dom(`th.A`).exists();
    assert.dom(`th.B`).doesNotExist();
    assert.dom(`th.C`).doesNotExist();
    assert.dom(`th.D`).exists();
  });

  test('resetting clears preferences, and restores the original column order', async function (assert) {
    assert.dom(`th.B`).doesNotExist('column B initially hidden');
    assert.dom(`th.C`).doesNotExist('column C initially hidden');

    ctx.table.resetToDefaults();
    await settled();

    assert.dom(`th.B`).exists('column B visible after preferences reset');
    assert.dom(`th.C`).exists('column C visible after preferences reset');
    assert.deepEqual(preferences, {
      "plugins": {
        "column-visibility": {
          "columns": {
            "A": {},
            "B": {},
            "C": {},
            "D": {}
          },
          "table": {}
        }
      }
    }, 'All column preferences reset');
  });
  });
});

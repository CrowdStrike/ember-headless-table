import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setOwner } from '@ember/application';
// @ts-expect-error
import { on } from '@ember/modifier';
// @ts-expect-error
import { fn } from '@ember/helper';
import { assert, assert as debugAssert } from '@ember/debug';
import { click, findAll, render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { columns } from 'ember-headless-table/plugins';
import { ColumnOrder, ColumnReordering, moveLeft, moveRight, setColumnOrder } from 'ember-headless-table/plugins/column-reordering';
import { ColumnVisibility, hide, show } from 'ember-headless-table/plugins/column-visibility';
import { DATA } from 'test-app/data';

import type { Column, PreferencesData } from 'ember-headless-table';

/**
  * NOTE: these tests depend on the columnVisibility stuff working.
  *       so if something has gone wrong everywhere, check there first.
  */
module('Plugins | columnReordering', function (hooks) {
  setupRenderingTest(hooks);

  let ctx: Context;
  let getColumnOrder = () => findAll('thead tr .name').map(x => {
    assert('expected element to exist and have innerText', x instanceof HTMLElement);

    return x.innerText.trim()
  }).join(' ').trim();

  class Context {
    @tracked columns = [
      { name: 'A', key: 'A' },
      { name: 'B', key: 'B' },
      { name: 'C', key: 'C' },
      { name: 'D', key: 'D' },
    ];

    table = headlessTable(this, {
      columns: () => this.columns,
      data: () => DATA,
      plugins: [ColumnReordering],
    });
  }

  class TestComponentA extends Component<{ ctx: Context }> {
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
        {{#each (columns.for this.table ColumnVisibility) as |column|}}
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
                  <button class="left" {{on 'click' (fn moveLeft column)}}>
                    Move Left
                  </button>
                  <button class="right" {{on 'click' (fn moveRight column)}}>
                    Move Right
                  </button>
                  <br>

                  <span class="name">{{column.name}}</span>
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
                  <td>
                    {{column.getValueForRow row}}
                  </td>
                {{/each}}
              </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
    </template>
  }

  module('as a solo plugin', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => DATA,
        plugins: [ColumnReordering],
      });
    }

    hooks.beforeEach(async function () {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);

      await render(
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
          <div class="theme-light" data-scroll-container {{ctx.table.modifiers.container}}>
            <table>
              <thead>
                <tr>
                  {{#each (columns.for ctx.table) as |column|}}
                    <th class="{{column.key}}" {{ctx.table.modifiers.columnHeader column}}>
                      <button class="left" {{on 'click' (fn moveLeft column)}}>
                        Move Left
                      </button>
                      <button class="right" {{on 'click' (fn moveRight column)}}>
                        Move Right
                      </button>
                      <br>

                      <span class="name">{{column.name}}</span>
                    </th>
                  {{/each}}
                </tr>
              </thead>
              <tbody>
                {{#each ctx.table.rows as |row|}}
                  <tr>
                    {{#each (columns.for ctx.table) as |column|}}
                      <td>
                        {{column.getValueForRow row}}
                      </td>
                    {{/each}}
                  </tr>
                {{/each}}
              </tbody>
            </table>
          </div>
        </template>
      );
    });

    test('everything is visible and in the original order', async function (assert) {
      assert.dom('th').exists({ count: 4 });
      assert.dom(`th.A`).exists();
      assert.dom(`th.B`).exists();
      assert.dom(`th.C`).exists();
      assert.dom(`th.D`).exists();
      assert.dom('thead tr').containsText('A');
      assert.dom('thead tr').containsText('B');
      assert.dom('thead tr').containsText('C');
      assert.dom('thead tr').containsText('D');
      assert.strictEqual(
        getColumnOrder(),
        'A B C D',
        'Initial order'
      );
    });

    test('a column in the middle can be moved to the left', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D');

      await click('th.B .left');

      assert.strictEqual(getColumnOrder(), 'B A C D');
    });

    test('a column in the middle can be moved to the right', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D');

      await click('th.B .right');

      assert.strictEqual(getColumnOrder(), 'A C B D');
    });
  });

  module('with no options specified', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => DATA,
        plugins: [ColumnReordering, ColumnVisibility],
      });
    }

    hooks.beforeEach(async function () {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);

      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );
    });

    test('everything is visible and in the original order', async function (assert) {
      assert.dom('th').exists({ count: 4 });
      assert.dom(`th.A`).exists();
      assert.dom(`th.B`).exists();
      assert.dom(`th.C`).exists();
      assert.dom(`th.D`).exists();
      assert.dom('thead tr').containsText('A');
      assert.dom('thead tr').containsText('B');
      assert.dom('thead tr').containsText('C');
      assert.dom('thead tr').containsText('D');
      assert.strictEqual(
        getColumnOrder(),
        'A B C D',
        'Initial order'
      );
    });

    test('a column in the middle can be moved to the left', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D');

      await click('th.B .left');

      assert.strictEqual(getColumnOrder(), 'B A C D');
    });

    test('a column in the middle can be moved to the right', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D');

      await click('th.B .right');

      assert.strictEqual(getColumnOrder(), 'A C B D');
    });

    test('a column on the left can be moved to the right', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D');

      await click('th.A .right');

      assert.strictEqual(getColumnOrder(), 'B A C D');
    });

    test('a column on the right can be moved to the left', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D');

      await click('th.D .left');

      assert.strictEqual(getColumnOrder(), 'A B D C');
    });

    test('a column on the right, moved to the right, does not move', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D');

      await click('th.D .right');

      assert.strictEqual(getColumnOrder(), 'A B C D');
    });

    test('a column on the left, moved to the left, does not move', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D');

      await click('th.A .left');

      assert.strictEqual(getColumnOrder(), 'A B C D');
    });

    test('without setting the order of anything, we cannot retain the order of the columns when they are added or removed', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D', 'test scenario is set up');

      let columnC = ctx.columns.find(column => column.key === 'C');
      debugAssert('Column C is missing!', columnC);
      ctx.columns = ctx.columns.filter(column => column !== columnC);
      await settled();

      assert.strictEqual(getColumnOrder(), 'A B D', 'column C is removed');

      ctx.columns = [...ctx.columns, columnC];
      await settled();

      assert.strictEqual(getColumnOrder(), 'A B D C', 'column C is restored, but at the end');
    });

    test('we can remove and add a column, and a previously set order is retained', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D', 'pre-test setup');

      await click('th.B .left');
      await click('th.D .left');

      assert.strictEqual(getColumnOrder(), 'B A D C', 'test scenario is set up');

      let columnC = ctx.columns.find(column => column.key === 'C');
      debugAssert('Column C is missing!', columnC);
      ctx.columns = ctx.columns.filter(column => column !== columnC);
      await settled();

      assert.strictEqual(getColumnOrder(), 'B A D', 'column C is removed');

      ctx.columns = [...ctx.columns, columnC];
      await settled();

      assert.strictEqual(getColumnOrder(), 'B A D C', 'column C is restored');
    });

    test('hiding and showing a column preserves order', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D', 'initially, columns exist as defined');

      await click('th.A .right');
      assert.strictEqual(getColumnOrder(), 'B A C D', 'column A was moved to the right');

      await click('.B.hide')
      assert.strictEqual(getColumnOrder(), 'A C D', 'column B is no longer shown, and the order of the remaining columns is retained');

      await click('.B.show');
      assert.strictEqual(getColumnOrder(), 'B A C D', 'column B is now shown');

      await click('.B.hide');
      assert.strictEqual(getColumnOrder(), 'A C D', 'column B is hidden again');

      await click('.C.hide');
      assert.strictEqual(getColumnOrder(), 'A D', 'column C and B are hidden');

      await click('.D.hide');
      assert.strictEqual(getColumnOrder(), 'A', 'only column A remains, both first and last');

      await click('.B.show');
      assert.strictEqual(getColumnOrder(), 'B A', 'column B has returned, and it is first');

      await click('.C.show');
      assert.strictEqual(getColumnOrder(), 'B A C', 'column C has returned');

      await click('.D.show');
      assert.strictEqual(getColumnOrder(), 'B A C D', 'all columns are visible in the correct order');
    });
  });

  module('with a preferences adapter and previously saved preferences', function (hooks) {
    let preferences: null | PreferencesData = {};

    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => DATA,
        plugins: [ColumnReordering, ColumnVisibility],
        preferences: {
          key: 'test-preferences',
          adapter: {
            persist: (_key: string, data: PreferencesData) => {
              preferences = data;
            },
            restore: (key: string) => {
              return {
                "plugins": {
                  "column-reordering": {
                    "columns": {},
                    "table": {
                      "order": {
                        "A": 2,
                        "B": 0,
                        "C": 1,
                        "D": 3
                      }
                    }
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

    test('column order is restored from preferences', async function (assert) {
      assert.strictEqual(
        getColumnOrder(),
        'B C A D',
        'order declared in preferences is displayed'
      );
    });

    test('resetting will clear preferences, and restore the original column order', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'B C A D', 'pre-test setup');

      ctx.table.resetToDefaults();
      await settled();

      assert.strictEqual(getColumnOrder(), 'A B C D');
      assert.deepEqual(preferences, {
        "plugins": {
          "column-reordering": {
            columns: {},
            table: {},
          },
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
      });
    });

    test('changing column order with `move left` updates preferences', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'B C A D', 'pre-test setup');

      await click('th.C .left');
      await click('th.A .left');

      assert.strictEqual(getColumnOrder(), 'C A B D', 'reordered');

      assert.deepEqual(preferences, {
        "plugins": {
          "column-reordering": {
            "columns": {},
            "table": {
              "order": {
                "A": 1,
                "B": 2,
                "C": 0,
                "D": 3
              }
            }
          },
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
      });
    });

    test('changing column order with `set all` updates preferences', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'B C A D', 'pre-test setup');

      let order = new ColumnOrder({
        columns: () =>
          [
            { key: 'D' },
            { key: 'C' },
            { key: 'B' },
            { key: 'A' },
          ] as Column[],
        existingOrder: new Map([
          ['A', 3],
          ['B', 2],
          ['C', 1],
          ['D', 0],
        ]),
      });

      // @ts-expect-error
      setColumnOrder(ctx.table, order);

      assert.deepEqual(preferences, {
        "plugins": {
          "column-reordering": {
            "columns": {},
            "table": {
              "order": {
                "A": 3,
                "B": 2,
                "C": 1,
                "D": 0
              }
            }
          },
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
      });
    });
  });

  module('with a preferences adapter and no previously saved preferences', function (hooks) {
    let preferences: null | PreferencesData = {};

    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => DATA,
        plugins: [ColumnReordering, ColumnVisibility],
        preferences: {
          key: 'test-preferences',
          adapter: {
            persist: (_key: string, data: PreferencesData) => {
              preferences = data;
            },
            restore: (key: string) => ({})
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

    test('changing column order with `set all` updates preferences', async function (assert) {
      assert.strictEqual(getColumnOrder(), 'A B C D', 'pre-test setup');

      let order = new ColumnOrder({
        columns: () =>
          [
            { key: 'D' },
            { key: 'C' },
            { key: 'B' },
            { key: 'A' },
          ] as Column[],
        existingOrder: new Map([
          ['A', 3],
          ['B', 2],
          ['C', 1],
          ['D', 0],
        ]),
      });

      // @ts-expect-error
      setColumnOrder(ctx.table, order);

      assert.deepEqual(preferences, {
        "plugins": {
          "column-reordering": {
            "columns": {},
            "table": {
              "order": {
                "A": 3,
                "B": 2,
                "C": 1,
                "D": 0
              }
            }
          },
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
      });
    });
  });
});

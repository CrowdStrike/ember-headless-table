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
import { meta } from 'ember-headless-table/plugins';
import { ColumnReordering } from 'ember-headless-table/plugins/column-reordering';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';

import type { Column } from 'ember-headless-table';

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

  const DATA = [
    {
      // Red stuff
      A: 'Apple',
      B: 'Berry',
      C: 'Cranberry',
      D: 'Da Chile Pepper',
    },
    {
      // Green stuff
      A: 'Avocado',
      B: 'Plantain',
      C: 'Cucumber',
      D: 'Dill',
    },
    {
      // Yellow stuff
      A: 'A Squash',
      B: 'Banana',
      C: 'Corn',
      D: 'Durian',
    },
  ];

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

    get columns() {
      return meta.forTable(this.table, ColumnReordering).columns;
    }

    moveLeft = (column: Column) => {
      return meta.forColumn(column, ColumnReordering).moveLeft();
    };

    moveRight = (column: Column) => {
      return meta.forColumn(column, ColumnReordering).moveRight();
    };

    hide = (column: Column) => {
      return meta.forColumn(column, ColumnVisibility).hide();
    };

    show = (column: Column) => {
      return meta.forColumn(column, ColumnVisibility).show();
    };

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
          <button class="hide {{column.key}}" {{on 'click' (fn this.hide column)}}>
            Hide
          </button>
          <button class="show {{column.key}}" {{on 'click' (fn this.show column)}}>
            Show
          </button>
          <br>
        {{/each}}
      </div>
      <div class="theme-light" data-scroll-container {{this.table.modifiers.container}}>
        <table>
          <thead>
            <tr>
              {{#each this.columns as |column|}}
                <th class="{{column.key}}" {{this.table.modifiers.columnHeader column}}>
                  <button class="left" {{on 'click' (fn this.moveLeft column)}}>
                    Move Left
                  </button>
                  <button class="right" {{on 'click' (fn this.moveRight column)}}>
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
                {{#each this.columns as |column|}}
                  <td>{{column.getValueForRow row}}</td>
                {{/each}}
              </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
    </template>
  }

  module('with unmet requirements', function () {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => DATA,
        plugins: [ColumnReordering],
      });
    }

    test('cannot create a table', async function (assert) {
      assert.throws(
        () => {
          ctx = new DefaultOptions();
          // plugins are lazily instantiated
          ctx.table.plugins;
        },
        /Configuration is missing requirement: columnVisibility, And is requested by ColumnReordering. Please add a plugin with the columnVisibility feature/,
        'Error was thrown about missing a plugin that provides "column visibility features'
      );
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
      await this.pauseTest();
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
});

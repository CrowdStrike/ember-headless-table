import Component from '@glimmer/component';
import { setOwner } from '@ember/application';
// @ts-expect-error
import { on } from '@ember/modifier';
// @ts-expect-error
import { fn } from '@ember/helper';
import { assert } from '@ember/debug';
import { click, findAll, render } from '@ember/test-helpers';
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
  let getColumnOrder = () => findAll('thead tr .name').map(x => x.innerText.trim()).join(' ');

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
    columns = [
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

    });

    test('a column on the right can be moved to the left', async function (assert) {

    });

    test('a column on the right, moved to the right, does not move', async function (assert) {

    });

    test('a column on the left, moved to the left, does not move', async function (assert) {

    });

    test('we can remove a column, and order is retained', async function (assert) {

    });

    test('we can add a column, and order is retained', async function (assert) {

    });

    test('hiding a column preserves order', async function (assert) {

    });

    test('showing a hidden column preserves order', async function (assert) {

    });
  });
});

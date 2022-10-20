import { setOwner } from '@ember/application';
import { assert as debugAssert } from '@ember/debug';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { type ColumnConfig, type Table, headlessTable } from 'ember-headless-table';
import { columns, meta } from 'ember-headless-table/plugins';
import { ColumnReordering } from 'ember-headless-table/plugins/column-reordering';
import { ColumnResizing } from 'ember-headless-table/plugins/column-resizing';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';
import { DataSorting } from 'ember-headless-table/plugins/data-sorting';
import { StickyColumns } from 'ember-headless-table/plugins/sticky-columns';
import { DATA } from 'test-app/data';

import type Owner from '@ember/owner';

interface Constructable<T> {
  new (...args: unknown[]): T;
}

/**
 * NOTE: the bulk of the column functionality is implemented by columns.for
 *
 * columns.for should be tested heavily, as it returns the columns that everything else uses.
 * everything else (next, previous, before, after) can assume that they have the correct set up columns,
 * and can focus on their specific behaviors
 */
module('Plugins | Queries | columns', function (hooks) {
  setupTest(hooks);

  const ALL_COLUMNS: ColumnConfig[] = [
    { name: 'A', key: 'A' },
    { name: 'B', key: 'B' },
    { name: 'C', key: 'C' },
    { name: 'D', key: 'D' },
    { name: 'E', key: 'E' },
    { name: 'F', key: 'F' },
    { name: 'G', key: 'G' },
  ];

  function create<T>(Klass: Constructable<T>, owner: Owner) {
    let instance = new Klass();

    setOwner(instance, owner);

    return instance;
  }

  function keysOf(columns: Array<{ key: string }>) {
    return columns.map((column) => column.key);
  }

  /**
   * SCENARIO: with one plugin
   */
  const ONE_HIDDEN_COLUMN: ColumnConfig[] = [
    { name: 'A', key: 'A' },
    { name: 'B', key: 'B' },
    { name: 'C', key: 'C' },
    {
      name: 'D',
      key: 'D',
      pluginOptions: [ColumnVisibility.forColumn(() => ({ isVisible: false }))],
    },
    { name: 'E', key: 'E' },
    { name: 'F', key: 'F' },
    { name: 'G', key: 'G' },
  ];

  class OnePlugin {
    table = headlessTable(this, {
      columns: () => ONE_HIDDEN_COLUMN,
      data: () => DATA,
      plugins: [ColumnVisibility],
    });
  }

  const ONE_PLUGIN_EXPECTED_VISIBLE = ONE_HIDDEN_COLUMN.filter((column) => column.key !== 'D');

  module('columns.for', function () {
    /**
     * SCENARIO: with no plugins
     */
    class NoPlugins {
      table = headlessTable(this, {
        columns: () => ALL_COLUMNS,
        data: () => DATA,
      });
    }

    module('table has no plugins', function () {
      test('without a requesting plugin, returns all columns', async function (assert) {
        let context = create(NoPlugins, this.owner);
        let result = columns.for(context.table);

        assert.strictEqual(result.length, ALL_COLUMNS.length);
        assert.deepEqual(keysOf(result), keysOf(ALL_COLUMNS), 'order is preserved');
      });

      test('with a requesting plugin, an error is thrown', async function (assert) {
        assert.throws(
          () => {
            let context = create(NoPlugins, this.owner);

            columns.for(context.table, ColumnResizing);
          },
          /\[ColumnResizing\] requested columns from the table, but the plugin, ColumnResizing, is not used in this table/,
          'correct error message is used'
        );
      });
    });

    module('with a single plugin', function () {
      test('without a requesting plugin, returns the columns as declared by the plugin that implements the .columns API', async function (assert) {
        let context = create(OnePlugin, this.owner);
        let result = columns.for(context.table);

        assert.strictEqual(result.length, ONE_PLUGIN_EXPECTED_VISIBLE.length);
        assert.strictEqual(result.length, ONE_HIDDEN_COLUMN.length - 1, 'one column is hidden');
        assert.deepEqual(
          keysOf(result),
          keysOf(ONE_PLUGIN_EXPECTED_VISIBLE),
          'columns from ColumnVisibility are used'
        );
      });

      test('with a requesting plugin, returns all columns', async function (assert) {
        let context = create(OnePlugin, this.owner);
        let result = columns.for(context.table, ColumnVisibility);

        assert.strictEqual(result.length, ALL_COLUMNS.length, 'one column is hidden');
        assert.deepEqual(keysOf(result), keysOf(ALL_COLUMNS));
      });

      test('requesting plugin is not present in this table, and an error is thrown', async function (assert) {
        assert.throws(
          () => {
            let context = create(OnePlugin, this.owner);

            columns.for(context.table, ColumnResizing);
          },
          /\[ColumnResizing\] requested columns from the table, but the plugin, ColumnResizing, is not used in this table/,
          'correct error message is used'
        );
      });
    });

    module('Using many of the plugins provided by ember-headless-table', function (hooks) {
      /**
       * SCENARIO: with plugins
       * This plugin graph looks like:
       *
       * [raw table columns]
       *       ^
       *       |
       *  ColumnVisibility
       *      ^
       *      |
       *  ColumnReordering
       *      ^          /-------> columns requests with no requirements get shoved to the bottom of the graph
       *      \ > ------/
       *      ^\           ---- ColumnResizing
       *      | \        /      ^
       *      |  ^------       / via `requires`
       *     |    \           /
       *    |      StickyColumns
       *   |
       *  DataSorting -- does not define requirements, so it gets shoved to the bottom of the graph
       */
      class Plugins {
        table = headlessTable(this, {
          columns: () => ALL_COLUMNS,
          data: () => DATA,
          plugins: [ColumnReordering, ColumnVisibility, ColumnResizing, StickyColumns, DataSorting],
        });
      }

      let table: Table;

      hooks.beforeEach(function (assert) {
        table = create(Plugins, this.owner).table;

        /**
         * Perform some operations on the columns so that we can know
         * which set of columsn we're getting
         */
        let [first, second, third] = table.columns;

        debugAssert(`Missing columns`, first && second && third);

        meta.forColumn(first, ColumnVisibility).hide();

        assert.deepEqual(
          keysOf(meta.forTable(table, ColumnVisibility).visibleColumns),
          ['B', 'C', 'D', 'E', 'F', 'G'],
          'setup: the first column is hidden'
        );
        meta.forColumn(third, ColumnReordering).moveLeft();

        assert.deepEqual(
          keysOf(meta.forTable(table, ColumnReordering).columns),
          ['C', 'B', 'D', 'E', 'F', 'G'],
          'setup: column C (the third), has moved to the left'
        );

        meta.forColumn(second, ColumnReordering).moveRight();

        assert.deepEqual(
          keysOf(meta.forTable(table, ColumnReordering).columns),
          ['C', 'D', 'B', 'E', 'F', 'G'],
          'setup: column B (the second, originally), has moved to the right'
        );
      });

      test(`the root plugin gets the table's columns`, function (assert) {
        assert.deepEqual(keysOf(columns.for(table, ColumnVisibility)), [
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
        ]);
      });

      test(`The second plugin in the hierarchy gets the columns from the root Plugin`, function (assert) {
        assert.deepEqual(keysOf(columns.for(table, ColumnReordering)), [
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
        ]);
      });

      test('ColumnResizing: all other plugins get the same column set', function (assert) {
        assert.deepEqual(keysOf(columns.for(table, ColumnResizing)), [
          'C',
          'D',
          'B',
          'E',
          'F',
          'G',
        ]);
      });

      test('DataSorting: all other plugins get the same column set', function (assert) {
        assert.deepEqual(keysOf(columns.for(table, DataSorting)), ['C', 'D', 'B', 'E', 'F', 'G']);
      });

      test('StickyColumns: all other plugins get the same column set', function (assert) {
        assert.deepEqual(keysOf(columns.for(table, StickyColumns)), ['C', 'D', 'B', 'E', 'F', 'G']);
      });

      test(`Without a requesting plugin, the columns are the same as the leaf-plugins' columns`, function (assert) {
        assert.deepEqual(keysOf(columns.for(table)), ['C', 'D', 'B', 'E', 'F', 'G']);
      });
    });
  });

  module('columns.next', function (hooks) {
    let table: Table;

    hooks.beforeEach(function () {
      let context = create(OnePlugin, this.owner);

      table = context.table;
    });

    test('second column is returned when the reference column is the first column', function (assert) {
      let [first, second] = table.columns;

      debugAssert('first and second columns are missing', first && second);

      let result = columns.next(first);

      assert.strictEqual(result?.key, second.key);
    });

    test('third column is returned when the reference column is the second column', function (assert) {
      let [, second, third] = table.columns;

      debugAssert('second and third columns are missing', second && third);

      let result = columns.next(second);

      assert.strictEqual(result?.key, third.key);
    });

    test('plugin hierarchy is respected', function (assert) {
      let [, , third, , fifth] = table.columns;

      debugAssert('third and fifth columns are missing', third && fifth);

      let result = columns.next(third);

      assert.strictEqual(result?.key, fifth.key);
    });

    test('undefined is returned when the reference column is the last column', function (assert) {
      let [last] = table.columns.values().reverse();

      debugAssert('last column is missing', last);

      let result = columns.next(last);

      assert.strictEqual(result, undefined);
    });
  });

  module('columns.previous', function (hooks) {
    let table: Table;

    hooks.beforeEach(function () {
      let context = create(OnePlugin, this.owner);

      table = context.table;
    });

    test('second to last column is returned when the reference column is the last column', function (assert) {
      let [last, secondToLast] = table.columns.values().reverse();

      debugAssert('last and second to last columns are missing', last && secondToLast);

      let result = columns.previous(last);

      assert.strictEqual(result?.key, secondToLast.key);
    });

    test('plugin hierarchy is respected', function (assert) {
      let [, , third, , fifth] = table.columns;

      debugAssert('third and fifth columns are missing', third && fifth);

      let result = columns.previous(fifth);

      assert.strictEqual(result?.key, third.key);
    });

    test('second column is returned when the reference column is the third column', function (assert) {
      let [, second, third] = table.columns;

      debugAssert('second and third columns are missing', second && third);

      let result = columns.previous(third);

      assert.strictEqual(result?.key, second.key);
    });

    test('undefined is returned when the reference column is the first column', function (assert) {
      let [first] = table.columns;

      debugAssert('first column is missing', first);

      let result = columns.previous(first);

      assert.strictEqual(result, undefined);
    });
  });

  module('columns.before', function (hooks) {
    let table: Table;

    hooks.beforeEach(function () {
      let context = create(OnePlugin, this.owner);

      table = context.table;
    });

    test('empty array is returned when the reference column is the first column', function (assert) {
      let [first] = table.columns;

      debugAssert('first column is missing', first);

      let result = columns.before(first);

      assert.deepEqual(result.length, 0);
      assert.deepEqual(result, []);
    });

    test('plugin hierarchy is respected', function (assert) {
      let fifth = table.columns[4];

      debugAssert('fifth column is missing', fifth);

      let result = columns.before(fifth);

      assert.deepEqual(keysOf(result), ['A', 'B', 'C'], 'column D is excluded');
    });

    test('for a requesting plugin, columns to the left/before of the reference column are returned', function (assert) {
      let fifth = table.columns[4];

      debugAssert('fifth column is missing', fifth);

      let result = columns.before(fifth, ColumnVisibility);

      assert.deepEqual(keysOf(result), ['A', 'B', 'C', 'D'], 'column D is included');
    });

    test('all but the last column is returned when the reference column is the last column', function (assert) {
      let [last] = table.columns.values().reverse();

      debugAssert('last column is missing', last);

      let result = columns.before(last);

      assert.deepEqual(keysOf(result), ['A', 'B', 'C', 'E', 'F']);
    });
  });

  module('columns.after', function (hooks) {
    let table: Table;

    hooks.beforeEach(function () {
      let context = create(OnePlugin, this.owner);

      table = context.table;
    });

    test('empty array is returned when the reference column is the last column', function (assert) {
      let [last] = table.columns.values().reverse();

      debugAssert('last column is missing', last);

      let result = columns.after(last);

      assert.deepEqual(result.length, 0);
      assert.deepEqual(result, []);
    });

    test('plugin hierarchy is respected', function (assert) {
      let third = table.columns[2];

      debugAssert('third column is missing', third);

      let result = columns.after(third);

      assert.deepEqual(keysOf(result), ['E', 'F', 'G'], 'column D is skipped, due to plugins');
    });

    test('for a requesting plugin, columns to the right/after of the reference column are returned', function (assert) {
      let third = table.columns[2];

      debugAssert('third column is missing', third);

      let result = columns.after(third, ColumnVisibility);

      assert.deepEqual(keysOf(result), ['D', 'E', 'F', 'G'], 'column D is included');
    });

    test('all but the first column is returned when the reference column is the first column', function (assert) {
      let first = table.columns[0];

      debugAssert('first column is missing', first);

      let result = columns.after(first);

      assert.deepEqual(keysOf(result), ['B', 'C', 'E', 'F', 'G']);
    });
  });
});

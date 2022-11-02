import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { options } from 'ember-headless-table/plugins';
import { ColumnResizing } from 'ember-headless-table/plugins/column-resizing';
import { DataSorting } from 'ember-headless-table/plugins/data-sorting';
import { StickyColumns } from 'ember-headless-table/plugins/sticky-columns';

import type { Sort } from 'ember-headless-table/plugins/data-sorting';

module('Plugins | consumption', function (hooks) {
  setupTest(hooks);

  module('When a plugin has required config', function () {
    test('supports explicit options', async function (assert) {
      let sorts: Sort[] = [];
      let onSort = (_sorts: Sort[]) => {};
      let table = headlessTable<unknown>(this, {
        columns: () => [],
        data: () => [],
        plugins: [[DataSorting, () => ({ sorts, onSort })]],
      });

      assert.ok(
        table.pluginOf(DataSorting) instanceof DataSorting,
        'DataSorting plugin successfully instantiated'
      );

      assert.deepEqual(
        options.forTable(table, DataSorting),
        {
          sorts,
          onSort,
        },
        'options used'
      );
    });
  });

  module('When a plugin has optional config', function () {
    test('supports shorthand', async function (assert) {
      let table = headlessTable<unknown>(this, {
        columns: () => [],
        data: () => [],
        plugins: [ColumnResizing],
      });

      assert.ok(
        table.pluginOf(ColumnResizing) instanceof ColumnResizing,
        'Resizing plugin successfully instantiating'
      );

      assert.deepEqual(options.forTable(table, ColumnResizing), {}, 'default options used');
    });

    test('supports what people should use', async function (assert) {
      let table = headlessTable<unknown>(this, {
        columns: () => [],
        data: () => [],
        plugins: [ColumnResizing.with(() => ({ enabled: false }))],
      });

      assert.ok(
        table.pluginOf(ColumnResizing) instanceof ColumnResizing,
        'Resizing plugin successfully instantiating'
      );

      assert.deepEqual(
        options.forTable(table, ColumnResizing),
        {
          enabled: false,
        },
        'options used'
      );
    });

    test('supports explicit options', async function (assert) {
      let table = headlessTable<unknown>(this, {
        columns: () => [],
        data: () => [],
        plugins: [[ColumnResizing, () => ({ enabled: false })]],
      });

      assert.ok(
        table.pluginOf(ColumnResizing) instanceof ColumnResizing,
        'Resizing plugin successfully instantiating'
      );

      assert.deepEqual(
        options.forTable(table, ColumnResizing),
        {
          enabled: false,
        },
        'options used'
      );
    });
  });

  module('When a plugin has a requirement', function () {
    test('and the requirement is met', function (assert) {
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [ColumnResizing, StickyColumns],
      });

      assert.ok(
        table.pluginOf(ColumnResizing) instanceof ColumnResizing,
        'ColumnResizing plugin successfully instantiated'
      );
    });

    test('and the requirement is not met', function (assert) {
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [StickyColumns],
      });

      assert.throws(() => {
        table.pluginOf(StickyColumns);
      }, 'Configuration is missing requirement: columnWidth, And is requested by StickyColumns. Please add a plugin with the columnWidth feature');
    });
  });
});

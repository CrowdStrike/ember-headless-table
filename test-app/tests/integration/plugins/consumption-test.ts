import { module, test } from 'qunit';

import { headlessTable } from '@crowdstrike/ember-headless-table';
import { options } from '@crowdstrike/ember-headless-table/plugins';
import { ColumnReordering } from '@crowdstrike/ember-headless-table/plugins/column-reordering';
import { ColumnResizing } from '@crowdstrike/ember-headless-table/plugins/column-resizing';
import { ColumnVisibility } from '@crowdstrike/ember-headless-table/plugins/column-visibility';
import { DataSorting } from '@crowdstrike/ember-headless-table/plugins/data-sorting';

import type { Sort } from '@crowdstrike/ember-headless-table/plugins/data-sorting';

module('Plugins | consumption', function () {
  module('When a plugin has required config', function () {
    test('supports explicit options', async function (assert) {
      let sorts: Sort[] = [];
      let onSort = (_sorts: Sort[]) => {};
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [[DataSorting, () => ({ sorts, onSort })]],
      });

      assert.ok(
        table.pluginOf(DataSorting) instanceof DataSorting,
        'DataSorting plugin successfully instantiated',
      );

      assert.deepEqual(
        options.forTable(table, DataSorting),
        {
          sorts,
          onSort,
        },
        'options used',
      );
    });
  });

  module('When a plugin has optional config', function () {
    test('supports shorthand', async function (assert) {
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [ColumnResizing],
      });

      assert.ok(
        table.pluginOf(ColumnResizing) instanceof ColumnResizing,
        'Resizing plugin successfully instantiating',
      );

      assert.deepEqual(options.forTable(table, ColumnResizing), {}, 'default options used');
    });

    test('supports what people should use', async function (assert) {
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [ColumnResizing.with(() => ({ enabled: false }))],
      });

      assert.ok(
        table.pluginOf(ColumnResizing) instanceof ColumnResizing,
        'Resizing plugin successfully instantiating',
      );

      assert.deepEqual(
        options.forTable(table, ColumnResizing),
        {
          enabled: false,
        },
        'options used',
      );
    });

    test('supports explicit options', async function (assert) {
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [[ColumnResizing, () => ({ enabled: false })]],
      });

      assert.ok(
        table.pluginOf(ColumnResizing) instanceof ColumnResizing,
        'Resizing plugin successfully instantiating',
      );

      assert.deepEqual(
        options.forTable(table, ColumnResizing),
        {
          enabled: false,
        },
        'options used',
      );
    });
  });

  module('When a plugin has a requirement', function () {
    test('and the requirement is met', function (assert) {
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [ColumnReordering, ColumnVisibility],
      });

      assert.ok(
        table.pluginOf(ColumnReordering) instanceof ColumnReordering,
        'DataSorting plugin successfully instantiated',
      );
    });

    test('and the requirement is not met', function (assert) {
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [ColumnReordering],
      });

      assert.throws(() => {
        table.pluginOf(ColumnReordering);
      }, 'Configuration is missing requirement: columnVisibility, And is requested by ColumnReordering. Please add a plugin with the columnVisibility feature');
    });
  });
});

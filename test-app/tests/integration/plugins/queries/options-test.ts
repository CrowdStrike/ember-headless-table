import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { expectTypeOf } from 'expect-type';

import { headlessTable } from '@crowdstrike/ember-headless-table';
import { options } from '@crowdstrike/ember-headless-table/plugins';
import { DataSorting } from '@crowdstrike/ember-headless-table/plugins/data-sorting';

import type { SortItem } from '@crowdstrike/ember-headless-table/plugins/data-sorting';

module('Plugins | Queries | options', function (hooks) {
  setupTest(hooks);

  /**
   * exists to help abstract details of internal column access while refactoring happens
   */
  function columnAt(table: ReturnType<typeof headlessTable>, index: number) {
    // return table.columns.values()[index];
    return table.columns[index];
  }

  module('forColumn', function () {
    test('options were provided', function (assert) {
      let table = headlessTable(this, {
        columns: () => [
          {
            key: 'first!',
            pluginOptions: [
              [
                DataSorting,
                () => ({
                  isSortable: true,
                  sortProperty: 'foo',
                }),
              ],
            ],
          },
        ],
        data: () => [],
        plugins: [DataSorting],
      });

      let columnOptions = options.forColumn(columnAt(table, 0), DataSorting);

      expectTypeOf(columnOptions?.sortProperty).toEqualTypeOf<string | undefined>();
      expectTypeOf(columnOptions?.isSortable).toEqualTypeOf<boolean | undefined>();

      assert.strictEqual(columnOptions?.isSortable, true, 'option matches: isSortable');
      assert.strictEqual(columnOptions?.sortProperty, 'foo', 'option matches: sortProperty');
    });

    test('options were not provided', function (assert) {
      let table = headlessTable(this, {
        columns: () => [
          {
            key: 'first!',
            pluginOptions: [],
          },
        ],
        data: () => [],
        plugins: [DataSorting],
      });

      assert.strictEqual(
        options.forColumn(columnAt(table, 0), DataSorting)?.sortProperty,
        undefined,
        'no user-provided option',
      );
    });

    test('plugin is not used', function (assert) {
      let table = headlessTable(this, {
        columns: () => [
          {
            key: 'first!',
            pluginOptions: [
              [
                DataSorting,
                () => ({
                  isSortable: true,
                  sortProperty: 'foo',
                }),
              ],
            ],
          },
        ],
        data: () => [],
        plugins: [],
      });

      assert.strictEqual(
        options.forColumn(columnAt(table, 0), DataSorting)?.sortProperty,
        'foo',
        'property exists',
      );
    });
  });

  module('forTable', function () {
    test('options were provided', function (assert) {
      let sortingOptions = {
        onSort: () => {},
        sorts: [],
      };
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [[DataSorting, () => sortingOptions]],
      });

      let tableOptions = options.forTable(table, DataSorting);

      expectTypeOf(tableOptions?.onSort).toEqualTypeOf<
        ((sorts: SortItem<unknown>[]) => void) | undefined
      >();
      expectTypeOf(tableOptions?.sorts).toEqualTypeOf<SortItem<unknown>[] | undefined>();

      assert.strictEqual(tableOptions?.sorts, sortingOptions.sorts, 'option data matches');
      assert.strictEqual(tableOptions?.onSort, sortingOptions.onSort, 'option function matches');
    });

    test('options were not provided', function (assert) {
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [DataSorting],
      });

      assert.strictEqual(
        options.forTable(table, DataSorting)?.sorts,
        undefined,
        'no user-provided option',
      );
    });

    test('plugin is not used', function (assert) {
      let table = headlessTable(this, {
        columns: () => [],
        data: () => [],
        plugins: [],
      });

      assert.strictEqual(
        options.forTable(table, DataSorting)?.sorts,
        undefined,
        'no options to get',
      );
    });
  });
});

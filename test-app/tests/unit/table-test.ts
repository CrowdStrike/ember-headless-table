import { getOwner } from '@ember/application';
import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { headlessTable } from '@crowdstrike/ember-headless-table';

import type {
  Column,
  ColumnConfig,
  TableConfig,
  TableMeta,
} from '@crowdstrike/ember-headless-table';

type Args = Omit<TableConfig<unknown>, 'meta' | 'preferences'> &
  TableMeta & { preferencesKey?: string; title?: string };

// TODO: Change from any
function findColumnByKey(table: any, key: string) {
  return table.columns.find((column: Column) => column.key === key);
}

function withTestDefaults(args: Args, extra: Partial<TableConfig<unknown>> = {}) {
  return {
    columns: args.columns,
    data: args.data,

    ...extra,
  };
}

module('Unit | -private | table', function (hooks) {
  setupTest(hooks);

  test('columns: is empty by default when no data is passed', async function (assert) {
    const args: Args = {
      columns: () => [],
      data: () => [],
    };

    const table = headlessTable(getOwner(this), withTestDefaults(args, {}));

    assert.deepEqual(table.columns, []);
  });

  test('columns: is at default values', async function (assert) {
    const args: Args = {
      columns: () =>
        [
          { key: 'firstName', name: 'First name' },
          { key: 'lastName', name: 'Last name' },
          { key: 'role', name: 'Role' },
          { key: 'favouritePet', name: 'Favourite Pet' },
        ] as ColumnConfig[],
      data: () => [],
    };

    const table = headlessTable(getOwner(this), withTestDefaults(args, {}));

    assert.expect(8);

    ['firstName', 'lastName', 'role', 'favouritePet'].forEach((key, position) => {
      assert.strictEqual(table.columns[position].key, key);
      assert.strictEqual(table.columns[position].position, position);
    });
  });

  test('columns: can update sort order', async function (assert) {
    const args: Args = {
      columns: () =>
        [
          { key: 'firstName', name: 'First name' },
          { key: 'lastName', name: 'Last name' },
          { key: 'role', name: 'Role' },
        ] as ColumnConfig[],
      data: () => [],
    };

    const table = headlessTable(getOwner(this), withTestDefaults(args, {}));

    assert.strictEqual(table.columns[0].key, 'firstName');
    assert.strictEqual(table.columns[2].key, 'role');

    const updatedColumnOrder = [
      findColumnByKey(table, 'role'),
      findColumnByKey(table, 'firstName'),
      findColumnByKey(table, 'lastName'),
    ] as Column[];

    table.setColumnOrder(updatedColumnOrder);

    assert.strictEqual(table.columns[0].key, 'role');
    assert.strictEqual(table.columns[1].key, 'firstName');
    assert.strictEqual(table.columns[2].key, 'lastName');
  });

  test('columns: can update and reset to defaults', async function (assert) {
    const args: Args = {
      columns: () =>
        [
          { key: 'firstName', name: 'First name' },
          { key: 'lastName', name: 'Last name' },
          { key: 'role', name: 'Role' },
        ] as ColumnConfig[],
      data: () => [],
    };

    const table = headlessTable(getOwner(this), withTestDefaults(args, {}));

    assert.strictEqual(table.columns[0].key, 'firstName');
    assert.strictEqual(table.columns[2].key, 'role');

    const updatedColumnOrder = [
      findColumnByKey(table, 'role'),
      findColumnByKey(table, 'firstName'),
      findColumnByKey(table, 'lastName'),
    ] as Column[];

    table.setColumnOrder(updatedColumnOrder);

    assert.strictEqual(table.columns[0].key, 'role');
    assert.strictEqual(table.columns[2].key, 'lastName');

    table.resetToDefaults();

    assert.strictEqual(table.columns[0].key, 'firstName');
  });
});

import { setOwner } from '@ember/application';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { use } from 'ember-resources';

import type { ColumnConfig, TableConfig, TableMeta } from 'ember-headless-table';

type Args = Omit<TableConfig<unknown>, 'meta' | 'preferences'> &
  TableMeta & { preferencesKey?: string; title?: string };

function withTestDefaults(args: Args, extra: Partial<TableConfig<unknown>> = {}) {
  return {
    columns: args.columns,
    data: args.data,

    ...extra,
  };
}

module('Unit | -private | table', function (hooks) {
  setupTest(hooks);

  test('supports @use', async function (assert) {
    class TestObject {
      @use table = headlessTable({
        columns: () => [
          { key: 'firstName', name: 'First name' },
          { key: 'lastName', name: 'Last name' },
        ],
        data: () => [],
      });
    }

    let instance = new TestObject();

    setOwner(instance, this.owner);

    assert.expect(2);

    ['firstName', 'lastName'].forEach((key, position) => {
      assert.strictEqual(instance.table.columns[position]?.key, key);
    });
  });

  test('columns: is empty by default when no data is passed', async function (assert) {
    const args: Args = {
      columns: () => [],
      data: () => [],
    };

    const table = headlessTable(this, withTestDefaults(args, {}));

    assert.deepEqual(table.columns.values(), []);
  });

  test('columns: each have a key', async function (assert) {
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

    const table = headlessTable(this, withTestDefaults(args, {}));

    assert.expect(4);

    ['firstName', 'lastName', 'role', 'favouritePet'].forEach((key, position) => {
      assert.strictEqual(table.columns[position]?.key, key);
    });
  });

  test('columns: each key must be unique', async function (assert) {
    const table = headlessTable(this, {
      columns: () =>
        [
          { key: 'firstName', name: 'First name' },
          { key: 'role', name: 'Role' },
          { key: 'favouritePet', name: 'Favourite Pet' },
          { key: 'firstName', name: 'Last name (typo)' },
        ] as ColumnConfig[],
      data: () => [],
    });

    assert.throws(
      () => {
        table.columns.values();
      },
      /Every column key in the table's column config must be unique. Found duplicate entry: firstName/,
      'expected error received'
    );
  });
});

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';

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
});

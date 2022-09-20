import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { preferences } from 'ember-headless-table/plugins';
import { DataSorting } from 'ember-headless-table/plugins/data-sorting';

import type { ColumnConfig, PreferencesData } from 'ember-headless-table';

module('Plugins | Queries | preferences', function (hooks) {
  setupTest(hooks);

  /**
   * exists to help abstract details of internal column access while refactoring happens
   */
  function columnAt(table: ReturnType<typeof headlessTable>, index: number) {
    // return table.columns.values()[index];
    return table.columns[index];
  }

  function createTable(
    ctx: object,
    {
      columns = [],
      data = {},
      onPersist = () => ({}),
      restoreFrom = () => data,
    }: {
      columns?: ColumnConfig[];
      data?: PreferencesData;
      onPersist?: (key: string, data: unknown) => void;
      restoreFrom?: (key: string) => PreferencesData;
    }
  ) {
    return headlessTable(ctx, {
      columns: () => columns || [],
      data: () => [],
      preferences: {
        key: 'test-preferences',
        adapter: {
          persist: (key: string, data: PreferencesData) => onPersist(key, data),
          restore: (key: string) => restoreFrom(key),
        },
      },
    });
  }

  module('plugin', function () {
    module('table', function () {
      test('preference exists', function (assert) {
        let table = createTable(this, {
          onPersist: (key, _data) => {
            assert.step(`persist: ${key}`);
          },
          restoreFrom: (key) => {
            assert.step(`restore: ${key}`);

            return {
              plugins: {
                Sorting: {
                  columns: {},
                  table: {
                    'some-key': 2,
                  },
                },
              },
            };
          },
        });

        let prefs = preferences.forTable(table, DataSorting);

        assert.false(
          table.preferences.storage.isAtDefault,
          'preferences storage is not at default'
        );

        assert.strictEqual(prefs.get('some-key'), 2, `some-key's value restored`);

        assert.verifySteps(['restore: test-preferences']);
      });

      test('preference does not exist', function (assert) {
        let table = createTable(this, {
          onPersist: (key, _data) => assert.step(`persist: ${key}`),
          restoreFrom: (key) => {
            assert.step(`restore: ${key}`);

            return {};
          },
        });

        let prefs = preferences.forTable(table, DataSorting);

        assert.true(table.preferences.storage.isAtDefault, 'preferences storage is at default');

        assert.strictEqual(prefs.get('some-key'), undefined, 'some-key has no value');

        prefs.delete('some-key');
        assert.strictEqual(prefs.get('some-key'), undefined, 'deleting does not set a value');

        prefs.set('some-key', 2);
        assert.strictEqual(prefs.get('some-key'), 2, 'a stored value is retreived');

        assert.verifySteps([
          'restore: test-preferences',
          'persist: test-preferences',
          'persist: test-preferences',
        ]);
      });
    });

    module('column', function () {
      test('preference exists', function (assert) {
        let preferencesData: PreferencesData = {};

        let table = createTable(this, {
          columns: [{ key: 'first!' }, { key: 'the-column-key' }, { key: 'third?' }],
          onPersist: (key, data: PreferencesData) => {
            assert.step(`persist: ${key}`);
            preferencesData = data;
          },
          restoreFrom: (key) => {
            assert.step(`restore: ${key}`);

            return {
              plugins: {
                Sorting: {
                  columns: {
                    'the-column-key': {
                      'some-preference': 2,
                    },
                  },
                  table: {},
                },
              },
            };
          },
        });

        assert.deepEqual(
          table.preferences.storage.serialize(),
          {
            plugins: {
              Sorting: {
                columns: {
                  'the-column-key': {
                    'some-preference': 2,
                  },
                },
                table: {},
              },
            },
          },
          'the persisted preferences structure is restored'
        );

        assert.false(
          table.preferences.storage.isAtDefault,
          'preferences storage is not at default'
        );

        let prefs = preferences.forColumn(columnAt(table, 1), DataSorting);

        assert.strictEqual(prefs.get('some-preference'), 2, 'stored value is accessible');

        prefs.set('some-key', 3);
        prefs.set('some-preference', 4);

        assert.deepEqual(
          preferencesData,
          {
            plugins: {
              Sorting: {
                columns: {
                  'the-column-key': {
                    'some-preference': 4,
                    'some-key': 3,
                  },
                },
                table: {},
              },
            },
          },
          'persisted data matches with our updates'
        );

        assert.verifySteps([
          'restore: test-preferences',
          'persist: test-preferences',
          'persist: test-preferences',
        ]);

        prefs.delete('some-preference');

        assert.deepEqual(
          preferencesData,
          {
            plugins: {
              Sorting: {
                columns: {
                  'the-column-key': {
                    'some-key': 3,
                  },
                },
                table: {},
              },
            },
          },
          'persisted data matches with our deletion'
        );

        assert.verifySteps(['persist: test-preferences']);
      });

      test('preference does not exist', function (assert) {
        let preferencesData: PreferencesData = {};

        let table = createTable(this, {
          columns: [{ key: 'first!' }, { key: 'the-column-key' }, { key: 'third?' }],
          onPersist: (key, data: PreferencesData) => {
            assert.step(`persist: ${key}`);
            preferencesData = data;
          },
          restoreFrom: (key) => {
            assert.step(`restore: ${key}`);

            return {};
          },
        });

        assert.true(table.preferences.storage.isAtDefault, 'empty preferences is "at default"');
        assert.deepEqual(
          table.preferences.storage.serialize(),
          { plugins: {} },
          'empty preferences are empty'
        );

        let prefs = preferences.forColumn(columnAt(table, 1), DataSorting);

        assert.true(table.preferences.storage.isAtDefault, 'preferences storage is at default');
        assert.strictEqual(
          prefs.get('some-preference'),
          undefined,
          'when at default, getting data should be undefined'
        );

        prefs.set('some-key', 3);
        prefs.set('some-preference', 4);

        assert.deepEqual(
          preferencesData,
          {
            plugins: {
              Sorting: {
                columns: {
                  'the-column-key': {
                    'some-preference': 4,
                    'some-key': 3,
                  },
                },
                table: {},
              },
            },
          },
          'persisted structure contains the data we set earlier'
        );

        assert.verifySteps([
          'restore: test-preferences',
          'persist: test-preferences',
          'persist: test-preferences',
        ]);
      });
    });
  });
});

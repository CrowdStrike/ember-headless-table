import { module, test } from 'qunit';
import { assert } from '@ember/debug';
import { setupRenderingTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { preferences } from 'ember-headless-table/plugins';
import { DataSorting } from 'ember-headless-table/plugins/data-sorting';

import type { ColumnConfig, PreferencesData } from 'ember-headless-table';
import { render, settled } from '@ember/test-helpers';

module('Rendering | Plugins | Queries | preferences', function (hooks) {
  setupRenderingTest(hooks);

  /**
   * exists to help abstract details of internal column access while refactoring happens
   */
  function columnAt(table: ReturnType<typeof headlessTable>, index: number) {
    // return table.columns.values()[index];
    let column = table.columns[index];

    assert(`Column not found at ${index}`, column);

    return column;
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
      onPersist?: (key: string, data: PreferencesData) => void;
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

  module('plugin', function (hooks) {
    module('table', function () {
      test('preference exists', async function (assert) {
        let table = createTable(this, {
          onPersist: (_key, _data) => {},
          restoreFrom: (key) => {
            return {
              plugins: {
                'data-sorting': {
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

        await render(
          // @ts-ignore
          <template>
            {{! @glint-ignore }}
            {{prefs.get 'some-key'}}
          </template>
        );

        assert.dom().hasText('2', `some-key's value is correct`)
      });

      test('preference does not exist', async function (assert) {
        let table = createTable(this, {
          onPersist: (key, _data) => {},
          restoreFrom: (key) => {
            return {};
          },
        });

        let prefs = preferences.forTable(table, DataSorting);

        await render(
          // @ts-ignore
          <template>
            {{! @glint-ignore }}
            {{prefs.get 'some-key'}}
          </template>
        );

        assert.dom().hasNoText(`some-key has no value`)

        prefs.delete('some-key');
        await settled();
        assert.dom().hasNoText(`deleting does not set a value`);

        prefs.set('some-key', 2);
        await settled();

        assert.dom().hasText('2', `a stored value is retreived`);
      });
    });
  });


  module('column', function () {
    test('preference exists', async function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first!' }, { key: 'the-column-key' }, { key: 'third?' }],
        onPersist: (key, data: PreferencesData) => {},
        restoreFrom: (key) => {
          return {
            plugins: {
              'data-sorting': {
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

      let prefs = preferences.forColumn(columnAt(table, 1), DataSorting);

      await render(
        // @ts-ignore
        <template>
          {{! @glint-ignore }}
          <out id='a'>{{prefs.get 'some-preference'}}</out>
          {{! @glint-ignore }}
          <out id='b'>{{prefs.get 'some-key'}}</out>
        </template>
      );

      assert.dom('#a').hasText('2', '(some-preference) stored value is accessible');
      assert.dom('#b').hasNoText('(some-key) stored value is accessible');

      prefs.set('some-key', 3);
      prefs.set('some-preference', 4);
      await settled();

      assert.dom('#a').hasText('4', '(some-preference) stored value is updated');
      assert.dom('#b').hasText('3', '(some-key) stored value is updated');

      prefs.delete('some-preference');
      await settled();

      assert.dom('#a').hasNoText('(some-preference) stored value is deleted');
      assert.dom('#b').hasText('3', '(some-key) stored value has not changed');
    });

    test('preference does not exist', async function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first!' }, { key: 'the-column-key' }, { key: 'third?' }],
        onPersist: (key, data: PreferencesData) => {},
        restoreFrom: (key) => {
          return {};
        },
      });

      let prefs = preferences.forColumn(columnAt(table, 1), DataSorting);

      await render(
        // @ts-ignore
        <template>
          {{! @glint-ignore }}
          <out id='a'>{{prefs.get 'some-preference'}}</out>
          {{! @glint-ignore }}
          <out id='b'>{{prefs.get 'some-key'}}</out>
        </template>
      );

      assert.dom('#a').hasNoText('(some-preference) when at default, getting data should be undefined');

      prefs.set('some-preference', 4);
      prefs.set('some-key', 3);
      await settled();

      assert.dom('#a').hasText('4', '(some-preference) a value appears');
      assert.dom('#b').hasText('3', '(some-key) stored value has not changed');
    });
  });
});


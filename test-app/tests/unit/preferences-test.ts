/* eslint-disable qunit/no-commented-tests */
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest, setupTest } from 'ember-qunit';

import { TablePreferences } from 'ember-headless-table';
// import sinon from 'sinon';
import { BasePlugin } from 'ember-headless-table/plugins';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';

import type { PreferencesData } from 'ember-headless-table';

module('Unit | -private | table-preferences', function (hooks) {
  setupTest(hooks);

  class TestColumnMeta {}
  class TestTableMeta {}

  class TestPlugin extends BasePlugin<{ Meta: { Column: TestColumnMeta; Table: TestTableMeta } }> {
    name = 'test-plugin';
    meta = {
      column: TestColumnMeta,
      table: TestTableMeta,
    };
  }

  class OldPlugin extends BasePlugin<{ Meta: { Column: TestColumnMeta; Table: TestTableMeta } }> {
    name = 'old-plugin';
    meta = {
      column: TestColumnMeta,
      table: TestTableMeta,
    };
  }

  module('#restore', function () {
    test('@adapter#restore(): returns initial data for table preferences', async function (assert) {
      assert.expect(1);

      let preferences = new TablePreferences('preferences-key', {
        // Deliberately testing incorrect type
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        restore: () => ({
          columns: {
            foo: { isVisible: true },
            bar: { isVisible: false },
          },
        }),
        persist: (_key, data) => {
          assert.deepEqual(data, {
            plugins: {},
          });
        },
      });

      preferences.persist();
    });
  });

  module('#restore and #persist are inverses', function () {
    test('with plugin data', async function (assert) {
      assert.expect(2);

      let data: PreferencesData = {
        plugins: {
          'column-visibility': {
            table: {
              foo: 2,
            },
            columns: {
              foo: { isVilable: true },
              bar: { isVilable: true },
            },
          },
        },
      };

      let preferences = new TablePreferences('preferences-key', {
        restore: () => data,
        persist: (key, toPersist) => {
          assert.strictEqual(key, 'preferences-key');
          assert.deepEqual(toPersist, data);
        },
      });

      preferences.persist();
    });

    test('unexpected keys are omitted from persist', async function (assert) {
      assert.expect(2);

      let data = {
        foo: 1,
        bar: 2,
      };

      let preferences = new TablePreferences('preferences-key', {
        // Deliberately testing incorrect type
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        restore: () => data,
        persist: (key, toPersist) => {
          assert.strictEqual(key, 'preferences-key');
          assert.deepEqual(toPersist, { plugins: {} });
        },
      });

      preferences.persist();
    });
  });

  module('plugins', function () {
    test('can interact with the TrackedMaps (get and set)', async function (assert) {
      assert.expect(5);

      let data: PreferencesData = {
        plugins: {
          'column-visibility': {
            table: {
              foo: 2,
            },
            columns: {
              foo: { woop: false },
              bar: { woop: true },
            },
          },
        },
      };
      let preferences = new TablePreferences('preferences-key', {
        restore: () => data,
        persist: (key, toPersist) => {
          assert.deepEqual(toPersist, {
            plugins: {
              'column-visibility': {
                table: { foo: 3 },
                columns: {
                  bar: { woop: true },
                  foo: { woop: true },
                },
              },
            },
          });
        },
      });

      let foo = preferences.storage.forPlugin(ColumnVisibility).table.get('foo');
      let woop = preferences.storage.forPlugin(ColumnVisibility).forColumn('foo').get('woop');

      assert.strictEqual(foo, 2);
      assert.false(woop);

      preferences.storage.forPlugin(ColumnVisibility).forColumn('foo').set('woop', true);
      preferences.storage.forPlugin(ColumnVisibility).table.set('foo', 3);

      foo = preferences.storage.forPlugin(ColumnVisibility).table.get('foo');
      woop = preferences.storage.forPlugin(ColumnVisibility).forColumn('foo').get('woop');

      assert.strictEqual(foo, 3);
      assert.true(woop);
      preferences.persist();
    });

    test('can be deleted', async function (assert) {
      assert.expect(3);

      let data: PreferencesData = {
        plugins: {
          'column-visibility': {
            table: {
              foo: 2,
            },
            columns: {
              foo: { woop: false },
              bar: { woop: true },
            },
          },
        },
      };
      let preferences = new TablePreferences('preferences-key', {
        restore: () => data,
        persist: (key, toPersist) => {
          assert.deepEqual(toPersist, {
            plugins: {
              'column-visibility': {
                table: {},
                columns: {
                  foo: {},
                  bar: { woop: true },
                },
              },
            },
          });
        },
      });

      preferences.storage.forPlugin(ColumnVisibility).table.delete('foo');
      preferences.storage.forPlugin(ColumnVisibility).forColumn('foo').delete('woop');

      let foo = preferences.storage.forPlugin(ColumnVisibility).table.get('foo');
      let woop = preferences.storage.forPlugin(ColumnVisibility).forColumn('foo').get('woop');

      assert.strictEqual(foo, undefined);
      assert.strictEqual(woop, undefined);
      preferences.persist();
    });

    test(`do not interfere with other plugin's data`, async function (assert) {
      assert.expect(1);

      let data: PreferencesData = {
        plugins: {
          'column-visibility': {
            table: {
              foo: 2,
            },
            columns: {
              foo: { woop: false },
              bar: { woop: true },
            },
          },
        },
      };

      let preferences = new TablePreferences('preferences-key', {
        restore: () => data,
        persist: (key, toPersist) => {
          assert.deepEqual(toPersist, {
            plugins: {
              'column-visibility': {
                table: { foo: 2 },
                columns: {
                  bar: { woop: true },
                  foo: { woop: true },
                },
              },
              'old-plugin': {
                table: {},
                columns: {
                  foo: {
                    woop: 2,
                  },
                },
              },
              'test-plugin': {
                table: {},
                columns: {
                  foo: {
                    woop: '1',
                  },
                },
              },
            },
          });
        },
      });

      preferences.storage.forPlugin(ColumnVisibility).forColumn('foo').set('woop', true);
      preferences.storage.forPlugin(TestPlugin).forColumn('foo').set('woop', '1');
      preferences.storage.forPlugin(OldPlugin).forColumn('foo').set('woop', 2);
      preferences.persist();
    });
  });
});

module('Preferences | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('restored preferences are reactive', async function (assert) {
    let data: PreferencesData = {
      plugins: {
        'column-visibility': {
          table: {
            foo: 2,
          },
          columns: {
            foo: { woop: false },
            bar: { woop: true },
          },
        },
      },
    };

    let preferences = new TablePreferences('preferences-key', {
      restore: () => data,
    });

    class Context {
      get tableInfo() {
        return preferences.storage.forPlugin(ColumnVisibility).table.get('foo');
      }

      get columnInfo() {
        return preferences.storage.forPlugin(ColumnVisibility).forColumn('foo').get('woop');
      }
    }

    let ctx = new Context();

    this.setProperties({ ctx });

    await render(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      hbs`
      {{! @glint-ignore }}
      <out id="table">{{this.ctx.tableInfo}}</out>
      {{! @glint-ignore }}
      <out id="column">{{this.ctx.columnInfo}}</out>
    `
    );

    assert.dom('#table').hasText('2');
    assert.dom('#column').hasText('false');

    preferences.storage.forPlugin(ColumnVisibility).forColumn('foo').set('woop', true);
    preferences.storage.forPlugin(ColumnVisibility).table.set('foo', 3);

    await settled();

    assert.dom('#table').hasText('3');
    assert.dom('#column').hasText('true');
  });
});

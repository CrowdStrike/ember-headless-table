import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest, setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

import sinon from 'sinon';

import { TablePreferences } from 'ember-headless-table';

import type { PreferencesData } from 'ember-headless-table';

module('Unit | -private | table-preferences', function (hooks) {
  setupTest(hooks);

  module('deprecated APIs', function () {
    test('#columnPreferences: is empty by default', async function (assert) {
      assert.strictEqual(new TablePreferences('preferences-key').columnPreferences.size, 0);
    });

    test('#getColumnPreferences: returns preferences for a column by key', async function (assert) {
      let preferences = new TablePreferences('preferences-key');

      preferences.setColumnPreferences('foo', { isVisible: true });
      preferences.setColumnPreferences('bar', { isVisible: false });

      assert.deepEqual(preferences.getColumnPreferences('foo'), { isVisible: true });
      assert.deepEqual(preferences.getColumnPreferences('bar'), { isVisible: false });
    });

    test('#getColumnPreferences: returns {} when column does not have any preferences', async function (assert) {
      let preferences = new TablePreferences('preferences-key');

      preferences.setColumnPreferences('foo', { isVisible: true });
      preferences.setColumnPreferences('bar', { isVisible: false });

      assert.deepEqual(preferences.getColumnPreferences('baz'), {});
    });

    test('#setColumnPreferences: sets preferences for a column', async function (assert) {
      let preferences = new TablePreferences('preferences-key');

      preferences.setColumnPreferences('foo', { isVisible: true });

      assert.deepEqual(preferences.getColumnPreferences('foo'), { isVisible: true });
    });

    test('#setColumnPreferences: replaces existing preferences for a column', async function (assert) {
      let preferences = new TablePreferences('preferences-key');

      preferences.setColumnPreferences('foo', { isVisible: false });

      preferences.setColumnPreferences('foo', { isVisible: true });

      assert.deepEqual(preferences.getColumnPreferences('foo'), { isVisible: true });
    });

    test('#setColumnPreference: sets a single preference for a column', async function (assert) {
      let preferences = new TablePreferences('preferences-key');

      preferences.setColumnPreferences('foo', { isVisible: false });

      preferences.setColumnPreference('foo', 'isVisible', true);

      assert.deepEqual(
        preferences.getColumnPreferences('foo'),
        { isVisible: true },
        'existing preference updated succesfully',
      );

      preferences.setColumnPreference('bar', 'isVisible', false);

      assert.deepEqual(
        preferences.getColumnPreferences('bar'),
        { isVisible: false },
        'preference for column without previous preferences set correctly',
      );
    });

    test('#deleteColumnPreference: deletes a single preference for a column', async function (assert) {
      let preferences = new TablePreferences('preferences-key');

      preferences.setColumnPreferences('foo', { isVisible: true });

      let result = preferences.deleteColumnPreference('foo', 'isVisible');

      assert.strictEqual(result, true, 'returns true when preference is successfully deleted');

      assert.deepEqual(
        preferences.getColumnPreferences('foo'),
        {},
        'preference was successfully deleted',
      );

      assert.strictEqual(
        preferences.deleteColumnPreference('bar', 'isVisible'),
        false,
        'returns false when preference for column does not exist',
      );
    });

    test('#toTablePreferencesData: returns preferences in shape of TablePreferencesData', async function (assert) {
      let preferences = new TablePreferences('preferences-key');

      preferences.setColumnPreferences('foo', { isVisible: false });
      preferences.setColumnPreferences('bar', { isVisible: true });

      let result: PreferencesData = preferences.toTablePreferencesData();

      assert.deepEqual(result, {
        columns: {
          foo: { isVisible: false },
          bar: { isVisible: true },
        },
      });
    });

    test('#toTablePreferencesData: excludes empty column preferences', async function (assert) {
      let preferences = new TablePreferences('preferences-key');

      preferences.setColumnPreferences('foo', { isVisible: true });
      preferences.setColumnPreferences('bar', {});
      preferences.setColumnPreferences('baz', {});

      let result: PreferencesData = preferences.toTablePreferencesData();

      assert.deepEqual(result, {
        columns: {
          foo: { isVisible: true },
        },
      });
    });
  });

  module('#restore', function () {
    test('@adapter#restore(): returns initial data for table preferences', async function (assert) {
      let adapter = {
        restore: () => ({
          columns: {
            foo: { isVisible: true },
            bar: { isVisible: false },
          },
        }),
      };

      let preferences = new TablePreferences('preferences-key', adapter);

      assert.deepEqual(Object.fromEntries(preferences.columnPreferences), {
        foo: { isVisible: true },
        bar: { isVisible: false },
      });
    });
  });

  module('#restore and #persist are inverses', function () {
    test('mixed top-level keys along with plugin data', async function (assert) {
      let persist = sinon.fake();
      let data: PreferencesData = {
        columns: {
          foo: { isVisible: true },
          bar: { isVisible: false },
        },
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
        persist,
      });

      preferences.persist();

      assert.deepEqual(persist.getCall(0).args[1], data);
    });

    test('unexpected keys are omitted from persist', async function (assert) {
      let persist = sinon.fake();
      let data = {
        foo: 1,
        bar: 2,
      };
      let preferences = new TablePreferences('preferences-key', {
        // Deliberately testing incorrect type
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        restore: () => data,
        persist,
      });

      preferences.persist();

      assert.deepEqual(persist.getCall(0).args[1], { plugins: {} });
    });
  });

  module('#persist', function () {
    test('@adapter#persist(): is called when deleteColumnPreference', async function (assert) {
      let persist = sinon.fake();
      let preferences = new TablePreferences('preferences-key', {
        restore: () => ({
          columns: {
            foo: { isVisible: true },
            bar: { isVisible: false },
            baz: { isVisible: true },
          },
        }),
        persist,
      });

      preferences.deleteColumnPreference('foo', 'isVisible');
      preferences.deleteColumnPreference('bar', 'isVisible');
      preferences.deleteColumnPreference('baz', 'isVisible');

      assert.strictEqual(persist.callCount, 3, 'persist was called 3 times');

      assert.deepEqual(persist.getCall(0).args, [
        'preferences-key',
        {
          columns: {
            bar: { isVisible: false },
            baz: { isVisible: true },
          },
          plugins: {},
        },
      ]);

      assert.deepEqual(persist.getCall(1).args, [
        'preferences-key',
        {
          columns: {
            baz: { isVisible: true },
          },
          plugins: {},
        },
      ]);

      assert.deepEqual(persist.getCall(2).args, ['preferences-key', { plugins: {} }]);
    });

    test('@adapter#persist(): is not called when deleteColumnPreference for non-existant preference', async function (assert) {
      let persist = sinon.fake();
      let preferences = new TablePreferences('preferences-key', {
        restore: () => ({
          columns: {
            foo: { isVisible: true },
            bar: { isVisible: false },
          },
        }),
        persist,
      });

      preferences.deleteColumnPreference('baz', 'isVisible');

      assert.strictEqual(persist.notCalled, true, 'persist was not called');
    });

    test('@adapter#persist(): is called when setColumnPreference', async function (assert) {
      let persist = sinon.fake();
      let preferences = new TablePreferences('preferences-key', { persist });

      preferences.setColumnPreference('foo', 'isVisible', true);
      preferences.setColumnPreference('bar', 'isVisible', false);
      preferences.setColumnPreference('baz', 'isVisible', true);

      assert.strictEqual(persist.callCount, 3, 'persist was called 3 times');

      assert.deepEqual(persist.getCall(0).args, [
        'preferences-key',
        {
          columns: {
            foo: { isVisible: true },
          },
          plugins: {},
        },
      ]);

      assert.deepEqual(persist.getCall(1).args, [
        'preferences-key',
        {
          columns: {
            foo: { isVisible: true },
            bar: { isVisible: false },
          },
          plugins: {},
        },
      ]);

      assert.deepEqual(persist.getCall(2).args, [
        'preferences-key',
        {
          columns: {
            foo: { isVisible: true },
            bar: { isVisible: false },
            baz: { isVisible: true },
          },
          plugins: {},
        },
      ]);
    });

    test('@adapter#persist(): is called when setColumnPreferences', async function (assert) {
      let persist = sinon.fake();
      let preferences = new TablePreferences('preferences-key', { persist });

      preferences.setColumnPreferences('foo', { isVisible: true });
      preferences.setColumnPreferences('bar', { isVisible: false });
      preferences.setColumnPreferences('baz', { isVisible: true });

      assert.strictEqual(persist.callCount, 3, 'persist was called 3 times');

      assert.deepEqual(persist.getCall(0).args, [
        'preferences-key',
        {
          columns: {
            foo: { isVisible: true },
          },
          plugins: {},
        },
      ]);

      assert.deepEqual(persist.getCall(1).args, [
        'preferences-key',
        {
          columns: {
            foo: { isVisible: true },
            bar: { isVisible: false },
          },
          plugins: {},
        },
      ]);

      assert.deepEqual(persist.getCall(2).args, [
        'preferences-key',
        {
          columns: {
            foo: { isVisible: true },
            bar: { isVisible: false },
            baz: { isVisible: true },
          },
          plugins: {},
        },
      ]);
    });
  });

  module('plugins', function () {
    test('can interact with the TrackedMaps (get and set)', async function (assert) {
      let persist = sinon.fake();
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
        persist,
      });

      let foo = preferences.storage.forPlugin('column-visibility').table.get('foo');
      let woop = preferences.storage.forPlugin('column-visibility').forColumn('foo').get('woop');

      assert.strictEqual(foo, 2);
      assert.strictEqual(woop, false);

      preferences.storage.forPlugin('column-visibility').forColumn('foo').set('woop', true);
      preferences.storage.forPlugin('column-visibility').table.set('foo', 3);

      foo = preferences.storage.forPlugin('column-visibility').table.get('foo');
      woop = preferences.storage.forPlugin('column-visibility').forColumn('foo').get('woop');

      assert.strictEqual(foo, 3);
      assert.strictEqual(woop, true);

      preferences.persist();

      assert.deepEqual(persist.getCall(0).args[1], {
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
    });

    test('can be deleted', async function (assert) {
      let persist = sinon.fake();
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
        persist,
      });

      preferences.storage.forPlugin('column-visibility').table.delete('foo');
      preferences.storage.forPlugin('column-visibility').forColumn('foo').delete('woop');

      let foo = preferences.storage.forPlugin('column-visibility').table.get('foo');
      let woop = preferences.storage.forPlugin('column-visibility').forColumn('foo').get('woop');

      assert.strictEqual(foo, undefined);
      assert.strictEqual(woop, undefined);

      preferences.persist();

      assert.deepEqual(persist.getCall(0).args[1], {
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
    });

    test(`do not interfere with other plugin's data`, async function (assert) {
      let persist = sinon.fake();
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
        persist,
      });

      preferences.storage.forPlugin('column-visibility').forColumn('foo').set('woop', true);
      preferences.storage.forPlugin('test-plugin').forColumn('foo').set('woop', '1');
      preferences.storage.forPlugin('old-plugin').forColumn('foo').set('woop', 2);

      preferences.persist();

      assert.deepEqual(persist.getCall(0).args[1], {
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
    });
  });
});

module('Preferences | rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('restored preferences are reactive', async function (assert) {
    let data: PreferencesData = {
      columns: {
        foo: { isVisible: true },
        bar: { isVisible: false },
      },
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
      get deprecatedInfo() {
        return preferences.getColumnPreferences('foo').isVisible;
      }

      get tableInfo() {
        return preferences.storage.forPlugin('column-visibility').table.get('foo');
      }

      get columnInfo() {
        return preferences.storage.forPlugin('column-visibility').forColumn('foo').get('woop');
      }
    }

    let ctx = new Context();

    this.setProperties({ ctx });

    await render(hbs`
      <out id="deprecated">{{this.ctx.deprecatedInfo}}</out>
      <out id="table">{{this.ctx.tableInfo}}</out>
      <out id="column">{{this.ctx.columnInfo}}</out>
    `);

    assert.dom('#deprecated').hasText('true');
    assert.dom('#table').hasText('2');
    assert.dom('#column').hasText('false');

    preferences.setColumnPreference('foo', 'isVisible', false);
    preferences.storage.forPlugin('column-visibility').forColumn('foo').set('woop', true);
    preferences.storage.forPlugin('column-visibility').table.set('foo', 3);

    await settled();

    assert.dom('#deprecated').hasText('false');
    assert.dom('#table').hasText('3');
    assert.dom('#column').hasText('true');
  });
});

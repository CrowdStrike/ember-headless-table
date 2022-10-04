import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { headlessTable } from '@crowdstrike/ember-headless-table';
import { BasePlugin, meta } from '@crowdstrike/ember-headless-table/plugins';
import { DataSorting } from '@crowdstrike/ember-headless-table/plugins/data-sorting';

import type { ColumnConfig } from '@crowdstrike/ember-headless-table';
import type { Plugin } from '@crowdstrike/ember-headless-table/plugins';

module('Plugins | Queries | meta', function (hooks) {
  setupTest(hooks);

  class TestColumnMeta {}
  class TestTableMeta {}

  class PluginIncompleteMeta extends BasePlugin {
    name = 'queries-incomplete-meta-test-plugin';
    // Normally we wouldn't TS-ignore, but plugins could be authored in
    // non-TS environements. We need to have appropriate errors for the situation.
    //
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    meta = {};
  }

  // Normally we wouldn't TS-ignore, but plugins could be authored in
  // non-TS environements. We need to have appropriate errors for the situation.
  //
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  class PluginNoMeta extends BasePlugin {
    name = 'queries-no-meta-test-plugin';
  }

  class TestPlugin extends BasePlugin {
    name = 'queries-meta-test-plugin';
    meta = {
      column: TestColumnMeta,
      table: TestTableMeta,
    };
  }

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
      extraPlugins = [],
    }: {
      columns?: ColumnConfig[];
      data?: unknown[];
      extraPlugins?: Plugin[];
    },
  ) {
    return headlessTable(ctx, {
      columns: () => columns || [],
      data: () => [],
      plugins: [DataSorting, ...extraPlugins],
    });
  }

  module('forColumn', function () {
    test('plugin exists', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
        extraPlugins: [TestPlugin],
      });

      let columnMeta = meta.forColumn(columnAt(table, 0), TestPlugin);

      assert.true(columnMeta instanceof TestColumnMeta, `instance of the Plugin's meta.column`);
    });

    test('plugin does not exist', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
      });

      assert.throws(
        () => {
          meta.forColumn(columnAt(table, 0), TestPlugin);
        },
        /\[TestPlugin\] cannot get plugin instance of unregistered plugin/,
        'plugin is unregistered',
      );
    });

    test('different metas for differest tables, same column keys', function (assert) {
      let table1 = createTable(this, {
        columns: [{ key: 'first' }],
      });
      let table2 = createTable(this, {
        columns: [{ key: 'first' }],
      });

      let meta1 = meta.forColumn(columnAt(table1, 0), DataSorting);
      let meta2 = meta.forColumn(columnAt(table2, 0), DataSorting);

      assert.ok(meta1, 'meta exists for first table');
      assert.ok(meta2, 'meta exists for second table');
      assert.notStrictEqual(meta1, meta2, 'the metas are different');
    });

    test('meta is not defined', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
        extraPlugins: [PluginNoMeta],
      });

      assert.throws(
        () => {
          meta.forColumn(columnAt(table, 0), PluginNoMeta);
        },
        /<#queries-no-meta-test-plugin> plugin does not have meta specified/,
        'plugin has no meta',
      );
    });

    test('meta is incomplete', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
        extraPlugins: [PluginIncompleteMeta],
      });

      assert.throws(
        () => {
          meta.forColumn(columnAt(table, 0), PluginIncompleteMeta);
        },
        /<#queries-incomplete-meta-test-plugin> plugin does not specify column meta/,
        'plugin has incomplete meta',
      );
    });

    test('meta is singleton', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
        extraPlugins: [TestPlugin],
      });

      let meta1 = meta.forColumn(columnAt(table, 0), TestPlugin);
      let meta2 = meta.forColumn(columnAt(table, 0), TestPlugin);

      assert.ok(meta1, 'meta exists for first query');
      assert.ok(meta2, 'meta exists for second query');
      assert.strictEqual(meta1, meta2, 'the metas are the same');
    });
  });

  module('forTable', function () {
    test('plugin exists', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
        extraPlugins: [TestPlugin],
      });

      let tableMeta = meta.forTable(table, TestPlugin);

      assert.true(tableMeta instanceof TestTableMeta, `instance of the Plugin's meta.table`);
    });

    test('plugin does not exist', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
      });

      assert.throws(
        () => {
          meta.forTable(table, TestPlugin);
        },
        /\[TestPlugin\] cannot get plugin instance of unregistered plugin/,
        'plugin is unregistered',
      );
    });

    test('meta is not defined', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
        extraPlugins: [PluginNoMeta],
      });

      assert.throws(
        () => {
          meta.forTable(table, PluginNoMeta);
        },
        /<#queries-no-meta-test-plugin> plugin does not have meta specified/,
        'plugin has no meta',
      );
    });

    test('meta is incomplete', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
        extraPlugins: [PluginIncompleteMeta],
      });

      assert.throws(
        () => {
          meta.forTable(table, PluginIncompleteMeta);
        },
        /<#queries-incomplete-meta-test-plugin> plugin does not specify table meta/,
        'plugin has incomplete meta',
      );
    });

    test('meta is singleton', function (assert) {
      let table = createTable(this, {
        columns: [{ key: 'first' }],
        extraPlugins: [TestPlugin],
      });

      let meta1 = meta.forTable(table, TestPlugin);
      let meta2 = meta.forTable(table, TestPlugin);

      assert.ok(meta1, 'meta exists for first query');
      assert.ok(meta2, 'meta exists for second query');
      assert.strictEqual(meta1, meta2, 'the metas are the same');
    });
  });

  module('withFeature', function () {
    class FeatureProvidingPlugin extends BasePlugin {
      static features = ['feature-a'];
      name = 'queries-feature-a-test-plugin';
      meta = { column: TestColumnMeta, table: TestTableMeta };
    }

    class FeatureProvidingPlugin2 extends BasePlugin {
      static features = ['feature-b'];
      name = 'queries-feature-b-test-plugin';
      meta = { column: TestColumnMeta, table: TestTableMeta };
    }

    module('forColumn', function () {
      test('feature exists', function (assert) {
        let table = createTable(this, {
          columns: [{ key: 'first' }],
          extraPlugins: [FeatureProvidingPlugin],
        });

        let tableMeta = meta.withFeature.forColumn(columnAt(table, 0), 'feature-a');

        assert.true(tableMeta instanceof TestColumnMeta, `instance of the Plugin's meta.column`);
      });

      test('feature does not exist', function (assert) {
        let table = createTable(this, {
          columns: [{ key: 'first' }],
        });

        assert.throws(
          () => {
            meta.withFeature.forColumn(columnAt(table, 0), 'feature-a');
          },
          /Could not find plugin with feature: feature-a. Available features: \[none\]/,
          'feature not found',
        );
      });

      test('feature does not exist, but others are available', function (assert) {
        let table = createTable(this, {
          columns: [{ key: 'first' }],
          extraPlugins: [FeatureProvidingPlugin2],
        });

        assert.throws(
          () => {
            meta.withFeature.forColumn(columnAt(table, 0), 'feature-a');
          },
          /Could not find plugin with feature: feature-a. Available features: feature-b/,
          'feature not found',
        );
      });

      test('meta is singleton (uses meta.forColumn)', function (assert) {
        let table = createTable(this, {
          columns: [{ key: 'first' }],
          extraPlugins: [FeatureProvidingPlugin],
        });

        let meta1 = meta.withFeature.forColumn(columnAt(table, 0), 'feature-a');
        let meta2 = meta.withFeature.forColumn(columnAt(table, 0), 'feature-a');

        assert.ok(meta1, 'meta exists for first query');
        assert.ok(meta2, 'meta exists for second query');
        assert.strictEqual(meta1, meta2, 'the metas are the same');
      });
    });

    module('forTable', function () {
      test('feature exists', function (assert) {
        let table = createTable(this, {
          extraPlugins: [FeatureProvidingPlugin],
        });

        let tableMeta = meta.withFeature.forTable(table, 'feature-a');

        assert.true(tableMeta instanceof TestTableMeta, `instance of the Plugin's meta.table`);
      });

      test('feature does not exist', function (assert) {
        let table = createTable(this, {});

        assert.throws(
          () => {
            meta.withFeature.forTable(table, 'feature-a');
          },
          /Could not find plugin with feature: feature-a. Available features: \[none\]/,
          'feature not found',
        );
      });

      test('feature does not exist, but others are available', function (assert) {
        let table = createTable(this, {
          extraPlugins: [FeatureProvidingPlugin2],
        });

        assert.throws(
          () => {
            meta.withFeature.forTable(table, 'feature-a');
          },
          /Could not find plugin with feature: feature-a. Available features: feature-b/,
          'feature not found',
        );
      });

      test('meta is singleton (uses meta.forTable)', function (assert) {
        let table = createTable(this, {
          extraPlugins: [FeatureProvidingPlugin],
        });

        let meta1 = meta.withFeature.forTable(table, 'feature-a');
        let meta2 = meta.withFeature.forTable(table, 'feature-a');

        assert.ok(meta1, 'meta exists for first query');
        assert.ok(meta2, 'meta exists for second query');
        assert.strictEqual(meta1, meta2, 'the metas are the same');
      });
    });
  });
});

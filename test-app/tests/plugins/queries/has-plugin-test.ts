import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { hasPlugin } from 'ember-headless-table/plugins';
import { ColumnResizing } from 'ember-headless-table/plugins/column-resizing';
import { DataSorting } from 'ember-headless-table/plugins/data-sorting';

module('Plugins | Queries | hasPlugin', function (hooks) {
  setupTest(hooks);

  test('it works', function (assert) {
    let table = headlessTable(this, {
      columns: () => [],
      data: () => [],
      plugins: [DataSorting],
    });

    assert.strictEqual(hasPlugin(table, DataSorting), 'has DataSorting');
    assert.strictEqual(hasPlugin(table, ColumnResizing), 'does not have ColumnResizing');
  });
});

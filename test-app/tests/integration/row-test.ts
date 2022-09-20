import { tracked } from '@glimmer/tracking';
import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';

import { headlessTable } from 'ember-headless-table';

module('Integration | Row', function () {
  test('row references to the table are stable', async function (assert) {
    type Datum = Record<string, string>;
    type Data = Array<Datum>;

    let stableObject = { key: 'keyA' };

    class Context {
      @tracked data: Data = [];

      @tracked columns = [stableObject];

      table = headlessTable(this, {
        data: () => this.data,
        columns: () => this.columns,
      });
    }

    let ctx = new Context();

    assert.strictEqual(ctx.table.rows.length, 0);

    ctx.data = [stableObject];
    ctx.table.rows;
    await settled();

    assert.strictEqual(ctx.table.rows.length, 1);

    let firstRow = ctx.table.rows[0];

    ctx.table.rows;
    await settled();

    assert.strictEqual(ctx.table.rows[0], firstRow);
  });
});

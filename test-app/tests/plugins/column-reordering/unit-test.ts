import { module, test } from 'qunit';

import { orderOf } from 'ember-headless-table/plugins/column-reordering';

module('Plugin | column-reordering | orderOf', function () {
  test('with no customizations, the original order is retained', function (assert) {
    let result = orderOf(
      [{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }],
      new Map<string, number>()
    );

    assert.strictEqual(result.size, 4);
    assert.deepEqual(
      [...result.entries()],
      [
        ['A', 0],
        ['B', 1],
        ['C', 2],
        ['D', 3],
      ]
    );
  });

  test('with 1 custom position, columns are merged appropriately', function (assert) {
    let customized = new Map<string, number>([['B', 0]]);

    let result = orderOf([{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }], customized);

    assert.strictEqual(result.size, 4);
    assert.deepEqual(
      [...result.entries()],
      [
        ['B', 0],
        ['A', 1],
        ['C', 2],
        ['D', 3],
      ]
    );
  });

  test('with middle columns moved to the outside', function (assert) {
    let customized = new Map<string, number>([
      ['B', 0],
      ['C', 3],
    ]);

    let result = orderOf([{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }], customized);

    assert.strictEqual(result.size, 4);
    assert.deepEqual(
      [...result.entries()],
      [
        ['B', 0],
        ['A', 1],
        ['D', 2],
        ['C', 3],
      ]
    );
  });

  test('with outer columns moved inward', function (assert) {
    let customized = new Map<string, number>([
      ['A', 1],
      ['D', 2],
    ]);

    let result = orderOf([{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }], customized);

    assert.strictEqual(result.size, 4);
    assert.deepEqual(
      [...result.entries()],
      [
        ['B', 0],
        ['A', 1],
        ['D', 2],
        ['C', 3],
      ]
    );
  });
});

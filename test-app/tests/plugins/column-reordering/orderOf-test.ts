import { module, test } from 'qunit';

import { orderOf } from 'ember-headless-table/plugins/column-reordering';

module('Plugin | column-reordering | orderOf', function () {
  test('expected order when unchanged', function (assert) {
    let result = orderOf(
      [{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }],
      new Map([
        ['A', 0],
        ['B', 1],
        ['C', 2],
        ['D', 3],
      ])
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

  test('expected order when changed', function (assert) {
    let result = orderOf(
      [{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }],
      new Map([
        ['A', 3],
        ['B', 2],
        ['C', 1],
        ['D', 0],
      ])
    );

    assert.strictEqual(result.size, 4);
    assert.deepEqual(
      [...result.entries()],
      [
        ['D', 0],
        ['C', 1],
        ['B', 2],
        ['A', 3],
      ]
    );
  });

  test('coerces to zero based', function (assert) {
    let result = orderOf(
      [{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }],
      new Map([
        ['A', 1],
        ['B', 2],
        ['C', 3],
        ['D', 4],
      ])
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

  test('throws with missing column', function (assert) {
    assert.throws(
      () =>
        orderOf(
          [{ key: 'A' }],
          new Map([
            ['A', 0],
            ['B', 1],
          ])
        ),
      /orderOf must be called with order of all columns specified/
    );
  });

  test('throws with missing column', function (assert) {
    assert.throws(
      () => orderOf([{ key: 'A' }, { key: 'B' }], new Map([['A', 0]])),
      /orderOf must be called with order of all columns specified/
    );
  });
});

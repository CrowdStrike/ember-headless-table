import { module, test } from 'qunit';

import { ColumnOrder } from 'ember-headless-table/plugins/column-reordering';

import type { Column } from 'ember-headless-table';

module('Plugin | column-reordering | ColumnOrder', function () {
  const toEntries = (map: ReadonlyMap<unknown, unknown>) => [...map.entries()];

  module('#set', function (hooks) {
    let order: ColumnOrder;

    hooks.beforeEach(function (assert) {
      order = new ColumnOrder({
        save: () => {},
        columns: () =>
          [
            { key: 'A' },
            { key: 'B' },
            { key: 'C' },
            { key: 'D' },
            { key: 'E' },
            { key: 'F' },
            /**
             * This cast is a lie, but a useful one, as these #set
             * tests don't actually care about the Column structure
             * of this data -- only that a key exists
             */
          ] as Column[],
      });

      assert.deepEqual(
        toEntries(order.orderedMap),
        [
          ['A', 0],
          ['B', 1],
          ['C', 2],
          ['D', 3],
          ['E', 4],
          ['F', 5],
        ],
        'test is set up'
      );
    });

    test('when the same position is set', function (assert) {
      order.set('C', 2);

      assert.deepEqual(
        toEntries(order.orderedMap),
        [
          ['A', 0],
          ['B', 1],
          ['C', 2],
          ['D', 3],
          ['E', 4],
          ['F', 5],
        ],
        'order is unchanged'
      );
    });

    module('when a column is moved to the left', function () {
      test('decrementing position swaps columns', function (assert) {
        order.set('C', 1);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['A', 0],
          ['C', 1],
          ['B', 2],
          ['D', 3],
          ['E', 4],
          ['F', 5],
        ]);
      });

      test('moving a few positions causes a shift in many columns', function (assert) {
        order.set('E', 1);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['A', 0],
          ['E', 1],
          ['B', 2],
          ['C', 3],
          ['D', 4],
          ['F', 5],
        ]);
      });

      test('every other is moved to the left', function (assert) {
        order.set('B', 0);
        order.set('D', 2);
        order.set('F', 4);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['B', 0],
          ['A', 1],
          ['D', 2],
          ['C', 3],
          ['F', 4],
          ['E', 5],
        ]);
      });
    });

    module('when a column is moved to the right', function () {
      test('incrementing position swaps columns', function (assert) {
        order.set('C', 3);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['A', 0],
          ['B', 1],
          ['D', 2],
          ['C', 3],
          ['E', 4],
          ['F', 5],
        ]);
      });

      test('moving a few positions causes a shift in many columns', function (assert) {
        order.set('B', 4);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['A', 0],
          ['C', 1],
          ['D', 2],
          ['E', 3],
          ['B', 4],
          ['F', 5],
        ]);
      });

      test('every other is moved to the right', function (assert) {
        order.set('A', 1);
        order.set('C', 3);
        order.set('E', 5);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['B', 0],
          ['A', 1],
          ['D', 2],
          ['C', 3],
          ['F', 4],
          ['E', 5],
        ]);
      });
    });
  });
});

import { module, test } from 'qunit';

import { ColumnOrder } from 'ember-headless-table/plugins/column-reordering';

import type { Column } from 'ember-headless-table';

module('Plugin | column-reordering | ColumnOrder', function () {
  const toEntries = (map: ReadonlyMap<unknown, unknown>) => [...map.entries()];

  module('#setAll', function (hooks) {
    let order: ColumnOrder;

    hooks.beforeEach(function (assert) {
      const COLUMNS = [
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
      ] as Column[];

      order = new ColumnOrder({
        allColumns: () => COLUMNS,
        availableColumns: () =>
          COLUMNS.reduce<Record<string, boolean>>((acc, c) => {
            acc[c.key] = true;

            return acc;
          }, {}),
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

    test('can change the order of all columns at once', function (assert) {
      let newOrder = new Map<string, number>([
        ['E', 5],
        ['C', 1],
        ['F', 0],
        ['B', 3],
        ['D', 2],
        ['A', 4],
      ]);

      order.setAll(newOrder);

      assert.deepEqual(
        toEntries(order.orderedMap),
        [
          ['F', 0],
          ['C', 1],
          ['D', 2],
          ['B', 3],
          ['A', 4],
          ['E', 5],
        ],
        'columns are in the correct order'
      );
    });
  });

  module('#moveRight', function (hooks) {
    let order: ColumnOrder;

    hooks.beforeEach(function (assert) {
      const COLUMNS = [
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
      ] as Column[];

      order = new ColumnOrder({
        allColumns: () => COLUMNS,
        availableColumns: () =>
          COLUMNS.reduce<Record<string, boolean>>((acc, c) => {
            acc[c.key] = true;

            return acc;
          }, {}),
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

    test('a column is shifted', function (assert) {
      order.moveRight('B');

      assert.deepEqual(toEntries(order.orderedMap), [
        ['A', 0],
        ['C', 1],
        ['B', 2],
        ['D', 3],
        ['E', 4],
        ['F', 5],
      ]);
    });

    test('a column at the end, cannot move further', function (assert) {
      order.moveRight('F');

      assert.deepEqual(toEntries(order.orderedMap), [
        ['A', 0],
        ['B', 1],
        ['C', 2],
        ['D', 3],
        ['E', 4],
        ['F', 5],
      ]);
    });
  });

  module('#moveLeft', function (hooks) {
    let order: ColumnOrder;

    hooks.beforeEach(function (assert) {
      const COLUMNS = [
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
      ] as Column[];

      order = new ColumnOrder({
        allColumns: () => COLUMNS,
        availableColumns: () =>
          COLUMNS.reduce<Record<string, boolean>>((acc, c) => {
            acc[c.key] = true;

            return acc;
          }, {}),
        save: () => {},
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

    test('a column is shifted', function (assert) {
      order.moveLeft('B');

      assert.deepEqual(toEntries(order.orderedMap), [
        ['B', 0],
        ['A', 1],
        ['C', 2],
        ['D', 3],
        ['E', 4],
        ['F', 5],
      ]);
    });

    test('a column at the end, cannot move further', function (assert) {
      order.moveLeft('A');

      assert.deepEqual(toEntries(order.orderedMap), [
        ['A', 0],
        ['B', 1],
        ['C', 2],
        ['D', 3],
        ['E', 4],
        ['F', 5],
      ]);
    });
  });

  module('#swapWith', function (hooks) {
    let order: ColumnOrder;

    hooks.beforeEach(function (assert) {
      const COLUMNS = [
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
      ] as Column[];

      order = new ColumnOrder({
        allColumns: () => COLUMNS,
        availableColumns: () =>
          COLUMNS.reduce<Record<string, boolean>>((acc, c) => {
            acc[c.key] = true;

            return acc;
          }, {}),
        save: () => {},
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
      order.swapWith('C', 2);

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
        order.swapWith('C', 1);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['A', 0],
          ['C', 1],
          ['B', 2],
          ['D', 3],
          ['E', 4],
          ['F', 5],
        ]);
      });

      test('moving a few positions swaps with the target position', function (assert) {
        order.swapWith('E', 1);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['A', 0],
          ['E', 1],
          ['C', 2],
          ['D', 3],
          ['B', 4],
          ['F', 5],
        ]);
      });

      test('multiple swaps in a row', function (assert) {
        order.swapWith('B', 0);
        order.swapWith('D', 2);
        order.swapWith('F', 4);

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
        order.swapWith('C', 3);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['A', 0],
          ['B', 1],
          ['D', 2],
          ['C', 3],
          ['E', 4],
          ['F', 5],
        ]);
      });

      test('moving a few positions swaps with the target position', function (assert) {
        order.swapWith('B', 4);

        assert.deepEqual(toEntries(order.orderedMap), [
          ['A', 0],
          ['E', 1],
          ['C', 2],
          ['D', 3],
          ['B', 4],
          ['F', 5],
        ]);
      });

      test('multiple swaps in a row', function (assert) {
        order.swapWith('A', 1);
        order.swapWith('C', 3);
        order.swapWith('E', 5);

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

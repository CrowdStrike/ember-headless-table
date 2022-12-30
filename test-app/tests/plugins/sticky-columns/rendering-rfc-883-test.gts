import Component from '@glimmer/component';
import { setOwner } from '@ember/application';
import { assert, assert as debugAssert } from '@ember/debug';
import { render, find } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { headlessTable, type ColumnConfig } from 'ember-headless-table';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';
import { StickyColumns, isSticky, styleStringFor } from 'ember-headless-table/plugins/sticky-columns';
import { ColumnReordering } from 'ember-headless-table/plugins/column-reordering';
import { ColumnResizing } from 'ember-headless-table/plugins/column-resizing';
import { createHelpers } from 'ember-headless-table/test-support';
import { DATA } from 'test-app/data';

const minWidth = () => ColumnResizing.forColumn(() => ({ minWidth: 200 }));
const leftSticky = () => StickyColumns.forColumn(() => ({ sticky: 'left' }));
const rightSticky = () => StickyColumns.forColumn(() => ({ sticky: 'right' }));

module('Plugins | StickyColumns', function (hooks) {
  setupRenderingTest(hooks);

  let ctx: TestSetup;
  let helpers = createHelpers({
    scrollContainer: '[data-container]',
  });

  /**
    * Used to account for pixel math rounding errors due to browser zoom, or other off-by-a-px errors
    */
  let isAbout = (testNumber: number, num: number, slop: number = 2) => {
    return (testNumber <= num + slop) &&  (testNumber >= num - slop);
  }

  let leftPositionOf = (key: string) => {
    let container = find('[data-container]');

    assert(`[data-container] not found`, container instanceof HTMLElement);

    let column = find(`[data-key=${key}]`);

    assert(`[data-key=${key}] not found`, column instanceof HTMLElement);

    let containerRect = container.getBoundingClientRect();
    let columnRect = column.getBoundingClientRect();

    let delta = columnRect.left - containerRect.left;

    return delta;
  }

  let rightPositionOf = (key: string) => {
    let container = find('[data-container]');

    assert(`[data-container] not found`, container instanceof HTMLElement);

    let column = find(`[data-key=${key}]`);

    assert(`[data-key=${key}] not found`, column instanceof HTMLElement);

    let containerRect = container.getBoundingClientRect();
    let columnRect = column.getBoundingClientRect();
    let delta = columnRect.right - containerRect.right;

    return delta;
  }

  class TestSetup {
    /**
      * All columns set to min-width of 200 for easier math
      * 7 columns @ 200px min is 1400px
      */
    columns: ColumnConfig<typeof DATA[number]>[] = [
      { name: 'A', key: 'A', pluginOptions: [minWidth()] },
      { name: 'B', key: 'B', pluginOptions: [minWidth()] },
      { name: 'C', key: 'C', pluginOptions: [minWidth()] },
      { name: 'D', key: 'D', pluginOptions: [minWidth()] },
      { name: 'E', key: 'E', pluginOptions: [minWidth()] },
      { name: 'F', key: 'F', pluginOptions: [minWidth()] },
      { name: 'G', key: 'G', pluginOptions: [minWidth()] },
    ];

    table = headlessTable(this, {
      columns: () => this.columns,
      data: () => DATA,
      plugins: [ColumnVisibility, ColumnReordering, ColumnResizing, StickyColumns.with(() => ({ workaroundForModifierTimingUpdateRFC883: true }))],
    });
  }

  const TestStyles = <template>
    <style>
      #ember-testing { width: initial; height: initial; transform: initial; }
      #ember-testing-container { width: 1000px; }

      /*
        * both of these are needed to get rid of browser-specific spacing
        * so that we can do math easier
        **/
      table {
        border-collapse: collapse;
      }
      table, table * {
        box-sizing: border-box;
      }

      [data-sticky="true"] {
        background: white;
        z-index: 8;
      }
    </style>
  </template>;

  class TestComponent extends Component<{ Args: { ctx: TestSetup } }> {
    get table() {
      return this.args.ctx.table;
    }

    <template>
      {{! with min-column @ 200px, this is 4 columns }}
      <div data-container style="width: 800px; overflow: auto;" {{this.table.modifiers.container}}>
        <table>
          <thead>
            <tr class="relative">
              {{#each this.table.columns as |column|}}
                <th
                  data-sticky="{{isSticky column}}"
                  data-key={{column.key}}
                  style={{styleStringFor column}}
                  {{this.table.modifiers.columnHeader column}}
                >
                  <span class="name">{{column.name}}</span><br>
                </th>
              {{/each}}
            </tr>
          </thead>
          <tbody>
            {{#each this.table.rows as |row|}}
              <tr class="relative">
                {{#each this.table.columns as |column|}}
                  <td
                    data-sticky="{{isSticky column}}"
                    style={{styleStringFor column}}
                    {{this.table.modifiers.columnHeader column}}
                  >
                    {{column.getValueForRow row}}
                  </td>
                {{/each}}
              </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
    </template>
  }

  module('with default options', function (hooks) {
    hooks.beforeEach(function() {
      ctx = new TestSetup();
      setOwner(ctx, this.owner);
    });

    test('no columns are sticky', async function (assert) {
      await render(<template>
        <TestStyles />
        <TestComponent @ctx={{ctx}} />
      </template>);

      /**
        * If we haven't scrolled, the left column should share a left boundary at most within 1 pixel of
        * its container
        */
      let left = leftPositionOf('A');
      assert.ok(isAbout(left, 1), `A's left edge (@ ${left}) matches the left edge of the container`);

      await helpers.scrollRight(200);

      /**
        * Because we only scrolled the distance of one column for this test,
        * it doesn't make sense to check the other columns.
        */
      left = leftPositionOf('A');
      assert.ok(isAbout(left, -200), `A's left edge (@ ${left}) moved, so it's not sticky`);
    });
  });

  module('the left column can be sticky', function (hooks) {
    class LeftColumn extends TestSetup {
      columns = [
        { name: 'column A', key: 'A', pluginOptions: [leftSticky(), minWidth()] },
        { name: 'column B', key: 'B', pluginOptions: [minWidth()] },
        { name: 'column C', key: 'C', pluginOptions: [minWidth()] },
        { name: 'column D', key: 'D', pluginOptions: [minWidth()] },
        { name: 'column E', key: 'E', pluginOptions: [minWidth()] },
        { name: 'column F', key: 'F', pluginOptions: [minWidth()] },
        { name: 'column G', key: 'G', pluginOptions: [minWidth()] },
      ]
    }

    hooks.beforeEach(function() {
      ctx = new LeftColumn();
      setOwner(ctx, this.owner);
    });

    test('the left column does not change position during scrolling', async function (assert) {
      await render(<template>
        <TestStyles />
        <TestComponent @ctx={{ctx}} />
      </template>);

      /**
        * If we haven't scrolled, the left column should share a left boundary at most within 1 pixel of
        * its container
        */
      let leftA = leftPositionOf('A');
      assert.ok(isAbout(leftA, 1), `A's left edge (@ ${leftA}) matches the left edge of the container`);

      let leftB = leftPositionOf('B');
      assert.ok(isAbout(leftB, 201), `B's left edge (@ ${leftB}) is one column's width right of A`);

      await helpers.scrollRight(200);

      leftA = leftPositionOf('A');
      assert.ok(isAbout(leftA, 0), `A's left edge (@ ${leftA}) is stuck to the left`);
      leftB = leftPositionOf('B');
      assert.ok(isAbout(leftB, 1), `B's left edge (@ ${leftB}) now shares an edge with A, due to scrolling`);
    });

  });

  module('the right column can be sticky', function (hooks) {
    class RightColumn extends TestSetup {
      columns = [
        { name: 'column A', key: 'A', pluginOptions: [minWidth()] },
        { name: 'column B', key: 'B', pluginOptions: [minWidth()] },
        { name: 'column C', key: 'C', pluginOptions: [minWidth()] },
        { name: 'column D', key: 'D', pluginOptions: [minWidth()] },
        { name: 'column E', key: 'E', pluginOptions: [minWidth()] },
        { name: 'column F', key: 'F', pluginOptions: [minWidth()] },
        { name: 'column G', key: 'G', pluginOptions: [minWidth(), rightSticky()] },
      ]
    }

    hooks.beforeEach(function() {
      ctx = new RightColumn();
      setOwner(ctx, this.owner);
    });

    test('the right column does not change position during scrolling', async function (assert) {
      await render(<template>
        <TestStyles />
        <TestComponent @ctx={{ctx}} />
      </template>);

      /**
        * If we haven't scrolled, the right column should share a right boundary at most within 1 pixel of
        * its container
        */
      let rightG = rightPositionOf('G');
      assert.ok(isAbout(rightG, 0), `G's right edge (@ ${rightG}) matches the right edge of the container`);

      let rightD = rightPositionOf('D');
      assert.ok(isAbout(rightD, 0), `D's right edge (@ ${rightD}) matches the right edge of the container`);

      let rightF = rightPositionOf('F');
      assert.ok(
        isAbout(rightF, 400),
        `F's right edge (@ ${rightF}) is beyond the boundary of the container, as only 4 columns are visible at a time`
      );

      await helpers.swipeLeft(200);

      rightG = rightPositionOf('G');
      assert.ok(isAbout(rightG, 0), `G's right edge (@ ${rightG}) is stuck to the right`);

      rightD = rightPositionOf('D');
      assert.ok(isAbout(rightD, -200), `D's right edge (@ ${rightD}) now shares an edge with G, due to scrolling`);

      await helpers.swipeLeft(2000);
      rightG = rightPositionOf('G');
      assert.ok(isAbout(rightG, 0), `G's right edge (@ ${rightG}) hasn't moved`);

      rightF = rightPositionOf('F');
      assert.ok(isAbout(rightF, -200), `F's right edge (@ ${rightF}) now shares an edge with G, due to scrolling`);
    });
  });

  module('2 left columns can be sticky', function (hooks) {
    class LeftColumn extends TestSetup {
      columns = [
        { name: 'column A', key: 'A', pluginOptions: [leftSticky(), minWidth()] },
        { name: 'column B', key: 'B', pluginOptions: [leftSticky(), minWidth()] },
        { name: 'column C', key: 'C', pluginOptions: [minWidth()] },
        { name: 'column D', key: 'D', pluginOptions: [minWidth()] },
        { name: 'column E', key: 'E', pluginOptions: [minWidth()] },
        { name: 'column F', key: 'F', pluginOptions: [minWidth()] },
        { name: 'column G', key: 'G', pluginOptions: [minWidth()] },
      ]
    }

    hooks.beforeEach(function() {
      ctx = new LeftColumn();
      setOwner(ctx, this.owner);
    });

    test('the 2 left columns do not change position during scrolling', async function (assert) {
      await render(<template>
        <TestStyles />
        <TestComponent @ctx={{ctx}} />
      </template>);

      /**
        * If we haven't scrolled, the left column should share a left boundary at most within 1 pixel of
        * its container
        */
      let leftA = leftPositionOf('A');
      assert.ok(isAbout(leftA, 1), `A's left edge (@ ${leftA}) matches the left edge of the container`);

      let leftB = leftPositionOf('B');
      assert.ok(isAbout(leftB, 200), `B's left edge (@ ${leftB}) is one column's width right of A`);

      let leftC = leftPositionOf('C');
      assert.ok(isAbout(leftC, 400), `C's left edge (@ ${leftC}) is two column's width right of A`);

      let leftD = leftPositionOf('D');
      assert.ok(isAbout(leftD, 600), `D's left edge (@ ${leftD}) is three column's width right of A`);

      await helpers.scrollRight(200);

      leftA = leftPositionOf('A');
      assert.ok(isAbout(leftA, 0), `A's left edge (@ ${leftA}) is stuck to the left`);
      leftB = leftPositionOf('B');
      assert.ok(isAbout(leftB, 200), `B's left edge (@ ${leftB}) is stuck to the left, but right of A`);

      leftC = leftPositionOf('C');
      assert.ok(isAbout(leftC, 200), `C's left edge (@ ${leftC}) has almost scrolled all the way to A's right edge`);

      leftD = leftPositionOf('D');
      assert.ok(isAbout(leftD, 400), `D's left edge (@ ${leftD}) is now where C's left edge used to be`);

      await helpers.swipeLeft(200);

      leftA = leftPositionOf('A');
      assert.ok(isAbout(leftA, 0), `A's left edge (@ ${leftA}) has not moved.`);
      leftB = leftPositionOf('B');
      assert.ok(isAbout(leftB, 200), `B's left edge (@ ${leftB}) has not moved.`);

      leftC = leftPositionOf('C');
      assert.ok(isAbout(leftC, 0), `C's left edge (@ ${leftC}) is almost as left as it can go`);

      leftD = leftPositionOf('D');
      assert.ok(isAbout(leftD, 200), `D's left edge (@ ${leftD}) is now where C's left edge used to be (again)`);
    });
  });

  module('2 right columns can be sticky', function (hooks) {
    class RightColumn extends TestSetup {
      columns = [
        { name: 'column A', key: 'A', pluginOptions: [minWidth()] },
        { name: 'column B', key: 'B', pluginOptions: [minWidth()] },
        { name: 'column C', key: 'C', pluginOptions: [minWidth()] },
        { name: 'column D', key: 'D', pluginOptions: [minWidth()] },
        { name: 'column E', key: 'E', pluginOptions: [minWidth()] },
        { name: 'column F', key: 'F', pluginOptions: [minWidth(), rightSticky()] },
        { name: 'column G', key: 'G', pluginOptions: [minWidth(), rightSticky()] },
      ]
    }

    hooks.beforeEach(function() {
      ctx = new RightColumn();
      setOwner(ctx, this.owner);
    });


    test('the 2 right columns do not change position during scrolling', async function (assert) {
      await render(<template>
        <TestStyles />
        <TestComponent @ctx={{ctx}} />
      </template>);

      /**
        * If we haven't scrolled, the right two columns should share a right boundary at most within 1 pixel of
        * its neighbor / container
        */
      let rightG = rightPositionOf('G');
      assert.ok(isAbout(rightG, 0), `G's right edge (@ ${rightG}) matches the right edge of the container`);

      let rightF = rightPositionOf('F');
      assert.ok(
        isAbout(rightF, -200),
        `F's right edge (@ ${rightF}) is one column's width to the left container`);

      let rightE = rightPositionOf('E');
      assert.ok(isAbout(rightE, 200), `E's right edge (@ ${rightE}) is one column's width beyond the container's right edge`);

      let rightD = rightPositionOf('D');
      assert.ok(
        isAbout(rightD, 0),
        `D's right edge (@ ${rightD}) matches the right edge of the container, `
        + `and would be hidden by being underneath column G`
      );

      await helpers.swipeLeft(200);

      rightG = rightPositionOf('G');
      assert.ok(isAbout(rightG, 0), `G's right edge (@ ${rightG}) is stuck to the right`);

      rightF = rightPositionOf('F');
      assert.ok(isAbout(rightF, -200), `F's right edge (@ ${rightF}) has not moved`);

      rightE = rightPositionOf('E');
      assert.ok(isAbout(rightE, 0), `E's right edge (@ ${rightE}) now matches the boundary, but is covered by G`);

      rightD = rightPositionOf('D');
      assert.ok(
        isAbout(rightD, -200),
        `D's right edge (@ ${rightD}) now shares an edge with G, due to scrolling. `
        + `This column should be underneath column F`
      );

      await helpers.swipeLeft(2000);
      rightG = rightPositionOf('G');
      assert.ok(isAbout(rightG, 0), `G's right edge (@ ${rightG}) hasn't moved`);

      rightF = rightPositionOf('F');
      assert.ok(isAbout(rightF, -200), `F's right edge (@ ${rightF}) hasn't moved`);

      rightE = rightPositionOf('E');
      assert.ok(isAbout(rightE, -400), `E's right edge (@ ${rightE}) is now shared with sticky column F's left edge`);

      rightD = rightPositionOf('D');
      assert.ok(isAbout(rightD, -600), `D's right edge (@ ${rightD}) is all the way on the left`);
    });
  });

  module('columns on both ends can be sticky', function (hooks) {
    class EndColumns extends TestSetup {
      columns = [
        { name: 'column A', key: 'A', pluginOptions: [minWidth(), leftSticky()] },
        { name: 'column B', key: 'B', pluginOptions: [minWidth()] },
        { name: 'column C', key: 'C', pluginOptions: [minWidth()] },
        { name: 'column D', key: 'D', pluginOptions: [minWidth()] },
        { name: 'column E', key: 'E', pluginOptions: [minWidth()] },
        { name: 'column F', key: 'F', pluginOptions: [minWidth()] },
        { name: 'column G', key: 'G', pluginOptions: [minWidth(), rightSticky()] },
      ]
    }

    hooks.beforeEach(function() {
      ctx = new EndColumns();
      setOwner(ctx, this.owner);
    });


    test('both sticky columns do not change position during scrolling', async function (assert) {
      await render(<template>
        <TestStyles />
        <TestComponent @ctx={{ctx}} />
      </template>);

      /**
        * The sticky columns
        */
      let leftA = leftPositionOf('A');
      assert.ok(isAbout(leftA, 1), `A's left edge (@ ${leftA}) matches the left edge of the container`);

      let rightG = rightPositionOf('G');
      assert.ok(isAbout(rightG, 0), `G's right edge (@ ${rightG}) matches the right edge of the container`);

      /**
        * The columns immediately adjacent to the sticky columns
        */
      let leftB = leftPositionOf('B');
      assert.ok(isAbout(leftB, 201), `B's left edge (@ ${leftB}) is one column's width right of A`);

      let rightF = rightPositionOf('F');
      assert.ok(
        isAbout(rightF, 400),
        `F's right edge (@ ${rightF}) is beyond the boundary of the container, as only 4 columns are visible at a time`
      );

      await helpers.swipeLeft(200);


      /**
        * The sticky columns
        */
      leftA = leftPositionOf('A');
      assert.ok(isAbout(leftA, 0), `A's left edge (@ ${leftA}) is stuck to the left`);

      rightG = rightPositionOf('G');
      assert.ok(isAbout(rightG, 0), `G's right edge (@ ${rightG}) is stuck to the right`);

      /**
        * The columns immediately adjacent to the sticky columns
        */
      leftB = leftPositionOf('B');
      assert.ok(isAbout(leftB, 1), `B's left edge (@ ${leftB}) now shares an edge with A, due to scrolling`);

      rightF = rightPositionOf('F');
      assert.ok(isAbout(rightF, 200), `F's right edge (@ ${rightF}) is still beyond the boundary of the container, but less so`);
    });
  });
});

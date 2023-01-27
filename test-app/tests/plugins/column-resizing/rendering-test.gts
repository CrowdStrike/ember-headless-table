import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { assert, assert as debugAssert } from '@ember/debug';
import { htmlSafe } from '@ember/template';
import { click, render, settled } from '@ember/test-helpers';
import * as QUnit from 'qunit';
import { module, test, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setOwner } from '@ember/application';
// @ts-ignore
import { on } from '@ember/modifier';
// @ts-ignore
import { fn } from '@ember/helper';

import { headlessTable, type ColumnConfig } from 'ember-headless-table';
import { ColumnResizing, resizeHandle, hasResizeHandle } from 'ember-headless-table/plugins/column-resizing';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';
import { ColumnReordering, moveLeft, moveRight } from 'ember-headless-table/plugins/column-reordering';
import { createHelpers, requestAnimationFrameSettled } from 'ember-headless-table/test-support';

import {
  TestStyles,
  getColumns,
  assertChanges,
  width,
} from './utils';

module('Plugins | resizing', function (hooks) {
  setupRenderingTest(hooks);

  let ctx: Context;
  let { dragLeft, dragRight } = createHelpers({ resizeHandle: '[data-handle]' });

  function roomToShrink(element: Element) {
    assert('element must be an HTML element', element instanceof HTMLElement);

    let minWidth = parseInt(element.style.minWidth.replace('px', ''), 10) || 0;

    return width(element) - minWidth;
  }

  class Context {
    @tracked containerWidth = 1000;

    columns: ColumnConfig[]  = [
      { name: 'A', key: 'A' },
      { name: 'B', key: 'B' },
      { name: 'C', key: 'C' },
      { name: 'D', key: 'D' },
    ];

    setContainerWidth = async (width: number) => {
      this.containerWidth = width;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    };

    table = headlessTable(this, {
      columns: () => this.columns,
      data: () => [] as unknown[],
      plugins: [ColumnResizing],
    });
  }

  class TestComponentA extends Component<{ ctx: Context }> {
    get table() {
      return this.args.ctx.table;
    }

    get modifiers() {
      return this.table.modifiers;
    }

    get testContainerStyle() {
      return htmlSafe(`width: ${this.args.ctx.containerWidth}px`);
    }

    <template>
      <TestStyles />
      <div data-container style={{this.testContainerStyle}}>
        <div data-scroll-container {{this.modifiers.container}}>
          <table>
            <thead>
              <tr>
                {{#each this.table.columns as |column|}}
                  <th {{this.modifiers.columnHeader column}}>
                    <span>{{column.name}}</span>

                    {{#if (hasResizeHandle column)}}
                      <div data-handle {{resizeHandle column}}>|</div>
                    {{/if}}
                  </th>
                {{/each}}
              </tr>
            </thead>
          </table>
        </div>
      </div>
    </template>
  }

  class TestComponentB extends Component<{ ctx: Context }> {
    resizeHandle = resizeHandle;

    get table() {
      return this.args.ctx.table;
    }

    get modifiers() {
      return this.table.modifiers;
    }

    get testContainerStyle() {
      return htmlSafe(`width: ${this.args.ctx.containerWidth}px`);
    }

    <template>
      <TestStyles />
      <div data-container style={{this.testContainerStyle}}>
        <div data-scroll-container {{this.modifiers.container}}>
          <table>
            <thead>
              <tr>
                {{#each this.table.columns as |column|}}
                  <th {{this.modifiers.columnHeader column}}>
                    <span>{{column.name}}</span>

                    <div data-handle {{this.resizeHandle column}}>|</div>
                  </th>
                {{/each}}
              </tr>
            </thead>
          </table>
        </div>
      </div>
    </template>
  }

  module('with no options specified', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => [] as unknown[],
        plugins: [ColumnResizing, ColumnReordering, ColumnVisibility],
      });
    }

    hooks.beforeEach(function () {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);
    });

    test('it resizes each column', async function () {
      ctx.setContainerWidth(1000);
      await render(
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      )

      const [columnA, columnB, columnC, columnD] = getColumns();

      assert(`columnA doesn't exist`, columnA);
      assert(`columnB doesn't exist`, columnB);
      assert(`columnC doesn't exist`, columnC);
      assert(`columnD doesn't exist`, columnD);

      await requestAnimationFrameSettled();

      await assertChanges(
        () => dragRight(columnB, 50),
        [
          { value: () => width(columnA), by: 50, msg: 'width of A increased by 50' },
          { value: () => width(columnB), by: -50, msg: 'width of B decreased by 50' },
          { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
          { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
        ]
      );

      await assertChanges(
        () => dragLeft(columnB, 10),
        [
          { value: () => width(columnA), by: -10, msg: 'width of A decreased by 10-' },
          { value: () => width(columnB), by: 10, msg: 'width of B increased by 10' },
          { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
          { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
        ]
      );
    });
  });

  module('with options that affect resize behavior', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => [] as unknown[],
        plugins: [ColumnResizing],
      });
    }

    hooks.beforeEach(function () {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);
    });

    module('handlePosition (default)', function () {
      test('it works', async function () {
        ctx.setContainerWidth(1000);
        await render(
          <template>
            <TestComponentA @ctx={{ctx}} />
          </template>
        )

        const [columnA, columnB, columnC, columnD] = getColumns();

        assert(`columnA doesn't exist`, columnA);
        assert(`columnB doesn't exist`, columnB);
        assert(`columnC doesn't exist`, columnC);
        assert(`columnD doesn't exist`, columnD);

        await requestAnimationFrameSettled();

        await assertChanges(
          () => dragRight(columnB, 50),
          [
            { value: () => width(columnA), by: 50, msg: 'width of A increased by 50' },
            { value: () => width(columnB), by: -50, msg: 'width of B decreased by 50' },
            { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );

        await assertChanges(
          () => dragLeft(columnB, 10),
          [
            { value: () => width(columnA), by: -10, msg: 'width of A decreased by 10-' },
            { value: () => width(columnB), by: 10, msg: 'width of B increased by 10' },
            { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );
      });

      test('column resizing respects column minWidth', async function (qAssert) {
        let bColumn = ctx.columns[1];

        assert(`something went wrong, bColumn not found`, bColumn);

        bColumn.pluginOptions = [ColumnResizing.forColumn(() => ({ minWidth: 240 }))];

        ctx.setContainerWidth(1000);
        await settled();
        await render(
          <template>
            <TestComponentA @ctx={{ctx}} />
          </template>
        )

        const [columnA, columnB, columnC, columnD] = getColumns();

        assert(`columnA doesn't exist`, columnA);
        assert(`columnB doesn't exist`, columnB);
        assert(`columnC doesn't exist`, columnC);
        assert(`columnD doesn't exist`, columnD);

        await requestAnimationFrameSettled();

        // This will grow columnA by more than columnB can shrink, which should
        // cause columnB to shrink to it's minimum width and then shrink the next
        // column by the remainder.
        let room = roomToShrink(columnB);
        let delta = room + 50;

        qAssert.ok(room > 0, `roomToShrink for columnB is non-0 :: ${room}`);
        qAssert.ok(delta > 50, `delta to be used for test is > 50 :: ${delta}`);

        await assertChanges(
          () => dragRight(columnB, delta),
          [
            { value: () => width(columnA), by: delta, msg: `width of A increased by delta :: by ${delta}` },
            {
              value: () => width(columnB),
              by: -room,
              msg: `width of B decreased to min width :: by ${room}`,
            },
            { value: () => width(columnC), by: -50, msg: `width of C decreased by remainder :: by -50` },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );
      });

      test('table & columns resize to fit containing element', async function () {
        ctx.setContainerWidth(1000);
        await render(
          <template>
            <TestComponentA @ctx={{ctx}} />
          </template>
        )


        const [columnA, columnB, columnC, columnD] = getColumns();

        assert(`columnA doesn't exist`, columnA);
        assert(`columnB doesn't exist`, columnB);
        assert(`columnC doesn't exist`, columnC);
        assert(`columnD doesn't exist`, columnD);

        await requestAnimationFrameSettled();

        // When the container grows, columns grow equally
        await assertChanges(
          async () => {
            ctx.setContainerWidth(ctx.containerWidth + 4000);
            await requestAnimationFrameSettled();
          },
          [
            { value: () => width(columnA), by: 1000, msg: 'width of A increased by 1000' },
            { value: () => width(columnB), by: 1000, msg: 'width of B increased by 1000' },
            { value: () => width(columnC), by: 1000, msg: 'width of C increased by 1000' },
            { value: () => width(columnD), by: 1000, msg: 'width of D increased by 1000' },
          ]
        );

        // When the container shrinks, columns shrink equally
        await assertChanges(
          () => ctx.setContainerWidth(ctx.containerWidth - 2000),
          [
            { value: () => width(columnA), by: -500, msg: 'width of A decreased by 500' },
            { value: () => width(columnB), by: -500, msg: 'width of B decreased by 500' },
            { value: () => width(columnC), by: -500, msg: 'width of C decreased by 500' },
            { value: () => width(columnD), by: -500, msg: 'width of D decreased by 500' },
          ]
        );
      });

      test('table resizing respects resized columns', async function () {
        ctx.setContainerWidth(1000);
        await render(
          <template>
            <TestComponentA @ctx={{ctx}} />
          </template>
        )

        const [columnA, columnB, columnC, columnD] = getColumns();

        assert(`columnA doesn't exist`, columnA);
        assert(`columnB doesn't exist`, columnB);
        assert(`columnC doesn't exist`, columnC);
        assert(`columnD doesn't exist`, columnD);

        await requestAnimationFrameSettled();

        // Resize a column
        await assertChanges(
          () => dragRight(columnB, 50),
          [
            { value: () => width(columnA), by: 50, msg: 'width of A increased by 50' },
            { value: () => width(columnB), by: -50, msg: 'width of B decreased by 50' },
            { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );

        // When the container grows by 1000, each column grows by 250
        await assertChanges(
          () => ctx.setContainerWidth(ctx.containerWidth + 1000),
          [
            { value: () => width(columnA), by: 250, msg: 'width of A increased by 250' },
            { value: () => width(columnB), by: 250, msg: 'width of B increased by 250' },
            { value: () => width(columnC), by: 250, msg: 'width of C increased by 250' },
            { value: () => width(columnD), by: 250, msg: 'width of D increased by 250' },
          ]
        );

        // When the container shrinks by 1000, each column shrinks by 250
        await assertChanges(
          () => ctx.setContainerWidth(ctx.containerWidth - 1000),
          [
            { value: () => width(columnA), by: -250, msg: 'width of A decreased by 250' },
            { value: () => width(columnB), by: -250, msg: 'width of B decreased by 250' },
            { value: () => width(columnC), by: -250, msg: 'width of C decreased by 250' },
            { value: () => width(columnD), by: -250, msg: 'width of D decreased by 250' },
          ]
        );
      });
    });

    module('handlePosition: right', function (hooks) {
      class HandlePositionRight extends Context {
        table = headlessTable(this, {
          columns: () => this.columns,
          data: () => [] as unknown[],
          plugins: [ColumnVisibility, ColumnResizing.with(() => ({ handlePosition: 'right' }))],
        });
      }

      hooks.beforeEach(function () {
        ctx = new HandlePositionRight();
        setOwner(ctx, this.owner);
      });

      skip('it works', async function () {
        ctx.setContainerWidth(1000);
        await render(
          <template>
            <TestComponentB @ctx={{ctx}} />
          </template>
        )

        const [columnA, columnB, columnC, columnD] = getColumns();

        assert(`columnA doesn't exist`, columnA);
        assert(`columnB doesn't exist`, columnB);
        assert(`columnC doesn't exist`, columnC);
        assert(`columnD doesn't exist`, columnD);

        await requestAnimationFrameSettled();

        await assertChanges(
          () => dragRight(columnB, 50),
          [
            { value: () => width(columnA), by: 50, msg: 'width of A increased by 50' },
            { value: () => width(columnB), by: -50, msg: 'width of B decreased by 50' },
            { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );

        await assertChanges(
          () => dragLeft(columnB, 10),
          [
            { value: () => width(columnA), by: -10, msg: 'width of A decreased by 10-' },
            { value: () => width(columnB), by: 10, msg: 'width of B increased by 10' },
            { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );
      });
    });
  });

  module('interaction with other plugins', function () {
    module('ColumnReordering', function(hooks) {
      class DefaultOptions extends Context {
        table = headlessTable(this, {
          columns: () => this.columns,
          data: () => [] as unknown[],
          plugins: [ColumnResizing, ColumnReordering, ColumnVisibility],
        });
      }

      hooks.beforeEach(function () {
        ctx = new DefaultOptions();
        setOwner(ctx, this.owner);
      });

      test('resizing makes sense regardless of column order', async function (assert) {
        ctx.setContainerWidth(1000);
        await render(
          <template>
            {{#each ctx.table.columns as |column|}}
              <button id="{{column.key}}-left" {{on 'click' (fn moveLeft column)}}>move {{column.key}} left</button>
              <button id="{{column.key}}-right" {{on 'click' (fn moveRight column)}}>move {{column.key}} right</button>
              <br>
            {{/each}}

            <TestComponentA @ctx={{ctx}} />
          </template>
        )

        const [columnA, columnB, columnC, columnD] = getColumns();

        debugAssert(`columnA doesn't exist`, columnA);
        debugAssert(`columnB doesn't exist`, columnB);
        debugAssert(`columnC doesn't exist`, columnC);
        debugAssert(`columnD doesn't exist`, columnD);

        await requestAnimationFrameSettled();

        const assertSizes = (sizes: Array<[HTMLTableCellElement, number]>) => {
          for (let pair of sizes) {
            let actual = width(pair[0]);

            assert.strictEqual(actual, pair[1]);
          }
        }

        assertSizes([
          [columnA, 250],
          [columnB, 250],
          [columnC, 250],
          [columnD, 250],
        ]);

        await assertChanges(
          () => dragRight(columnB, 50),
          [
            { value: () => width(columnA), by: 50, msg: 'width of A increased by 50' },
            { value: () => width(columnB), by: -50, msg: 'width of B decreased by 50' },
            { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );

        assertSizes([
          [columnA, 300],
          [columnB, 200],
          [columnC, 250],
          [columnD, 250],
        ]);

        await click('#B-right');
        await requestAnimationFrameSettled();

        // Sizes don't change
        assertSizes([
          [columnA, 300],
          [columnB, 200],
          [columnC, 250],
          [columnD, 250],
        ]);

        await assertChanges(
          () => dragLeft(columnB, 10),
          [
            { value: () => width(columnA), by: 0, msg: 'width of A unchanged' },
            { value: () => width(columnC), by: -10, msg: 'width of C decreased by 10' },
            { value: () => width(columnB), by: 10, msg: 'width of B increased by 10' },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );
      });
    });
  });
});

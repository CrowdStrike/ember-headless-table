import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { assert, assert as debugAssert } from '@ember/debug';
import { htmlSafe } from '@ember/template';
import { click, render, settled } from '@ember/test-helpers';
import * as QUnit from 'qunit';
import { module, test, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setOwner } from '@ember/application';

import { headlessTable, type ColumnConfig } from 'ember-headless-table';
import { meta } from 'ember-headless-table/plugins';
import { ColumnResizing, resizeHandle, hasResizeHandle } from 'ember-headless-table/plugins/column-resizing';
import { createHelpers, requestAnimationFrameSettled } from 'ember-headless-table/test-support';

import {
  TestStyles,
  getColumns,
  assertChanges,
  width,
} from './utils';

module('Plugins | resizing | column options', function (hooks) {
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

  module('isResizable: false', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => [
          { name: 'A', key: 'A', pluginOptions: [ColumnResizing.forColumn(() => ({ isResizable: false }))] },
          { name: 'B', key: 'B' },
          { name: 'C', key: 'C' },
          { name: 'D', key: 'D', pluginOptions: [ColumnResizing.forColumn(() => ({ isResizable: false }))] },
        ],
        data: () => [] as unknown[],
        plugins: [ColumnResizing],
      });
    }

    hooks.beforeEach(function () {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);
    });

    test(`option propogates to the meta's value`, async function (assert) {
      let columns = ctx.table.columns;

      debugAssert(`Columns are missing`, columns[0] && columns[1] && columns[2] && columns[3]);

      assert.strictEqual(meta.forColumn(columns[0], ColumnResizing).isResizable, false);
      assert.strictEqual(meta.forColumn(columns[1], ColumnResizing).isResizable, true);
      assert.strictEqual(meta.forColumn(columns[2], ColumnResizing).isResizable, true);
      assert.strictEqual(meta.forColumn(columns[3], ColumnResizing).isResizable, false);
    });

    test(`[hasResizeHandle] there are fewer resize handles than there would be if all columns were resizable`, async function (assert) {
        ctx.setContainerWidth(1000);
        await render(
          <template>
            <TestComponentA @ctx={{ctx}} />
          </template>
        )

        const [columnA, columnB, columnC, columnD] = getColumns();

        debugAssert(`Columns are missing`, columnA && columnB && columnC && columnD);

        await requestAnimationFrameSettled();

        assert.dom(('[data-handle]')).exists({ count: 1 }, 'there is one boundary between columns for adjusting size');
    });
  });

  module('isResizable: false + width: set', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => [
          { name: 'A', key: 'A', pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 48, width: 48, isResizable: false }))] },
          { name: 'B', key: 'B' },
          { name: 'C', key: 'C' },
          { name: 'D', key: 'D', pluginOptions: [ColumnResizing.forColumn(() => ({ minWidth: 48, width: 48, isResizable: false }))] },
        ],
        data: () => [] as unknown[],
        plugins: [ColumnResizing],
      });
    }

    hooks.beforeEach(function () {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);
    });

    test(`option propogates to the meta's value`, async function (assert) {
      let columns = ctx.table.columns;

      debugAssert(`Columns are missing`, columns[0] && columns[1] && columns[2] && columns[3]);

      assert.strictEqual(meta.forColumn(columns[0], ColumnResizing).isResizable, false);
      assert.strictEqual(meta.forColumn(columns[1], ColumnResizing).isResizable, true);
      assert.strictEqual(meta.forColumn(columns[2], ColumnResizing).isResizable, true);
      assert.strictEqual(meta.forColumn(columns[3], ColumnResizing).isResizable, false);

      assert.strictEqual(meta.forColumn(columns[0], ColumnResizing).width, 48);
      assert.strictEqual(meta.forColumn(columns[1], ColumnResizing).width, 128);
      assert.strictEqual(meta.forColumn(columns[2], ColumnResizing).width, 128);
      assert.strictEqual(meta.forColumn(columns[3], ColumnResizing).width, 48);
    });

    test('behaves as if the column is fixed (useful for checkboxes)', async function () {

        ctx.setContainerWidth(1000);
        await render(
          <template>
            <TestComponentA @ctx={{ctx}} />
          </template>
        )

        const [columnA, columnB, columnC, columnD] = getColumns();

        debugAssert(`Columns are missing`, columnA && columnB && columnC && columnD);

        await requestAnimationFrameSettled();

        await assertChanges(
          () => dragRight(columnC, 50),
          [
            { value: () => width(columnA), by: 0, msg: 'width of A increased by 50' },
            { value: () => width(columnB), by: 50, msg: 'width of B decreased by 50' },
            { value: () => width(columnC), by: -50, msg: 'width of C unchanged' },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );

        await requestAnimationFrameSettled();

        await assertChanges(
          () => dragLeft(columnC, 10),
          [
            { value: () => width(columnA), by: 0, msg: 'width of A decreased by 10-' },
            { value: () => width(columnB), by: -10, msg: 'width of B increased by 10' },
            { value: () => width(columnC), by: 10, msg: 'width of C unchanged' },
            { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },
          ]
        );
    });
  });

});

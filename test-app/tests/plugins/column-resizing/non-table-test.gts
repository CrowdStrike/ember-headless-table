import Component from '@glimmer/component';
import { assert } from '@ember/debug';
import { htmlSafe } from '@ember/template';
import { render, findAll } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setOwner } from '@ember/application';

import { headlessTable } from 'ember-headless-table';
import { ColumnResizing, resizeHandle, hasResizeHandle, styleStringFor } from 'ember-headless-table/plugins/column-resizing';
import { createHelpers, requestAnimationFrameSettled } from 'ember-headless-table/test-support';

import {
  Context,
  TestStyles,
  assertChanges,
  width,
} from './utils';


module('Plugins | resizing | non-tables', function (hooks) {
  setupRenderingTest(hooks);

  let ctx: Context;

  let { dragLeft, dragRight } = createHelpers({ resizeHandle: '[data-handle]' });

  /**
    * https://ember-aria.pages.dev/docs
    */
  class TestComponentA extends Component<{ Args: { containerWidth: number; table: ReturnType<typeof headlessTable> }}> {
    get table() {
      return this.args.table;
    }

    get modifiers() {
      return this.table.modifiers;
    }

    get testContainerStyle() {
      return htmlSafe(`width: ${this.args.containerWidth}px`);
    }

    <template>
      <TestStyles />
      <div data-container style={{this.testContainerStyle}}>
        <div data-scroll-container {{@table.modifiers.container}}>
          <div role="grid">
            <div role="row">
              {{#each @table.columns as |column|}}
                <div role="columnheader" {{@table.modifiers.columnHeader column}}>
                  {{column.name}}

                  {{#if (hasResizeHandle column)}}
                    <div data-handle {{resizeHandle column}}>|</div>
                  {{/if}}
                </div>
              {{/each}}
            </div>

            {{#each @table.rows as |row|}}
              <div role="row">
                {{#each @table.columns as |column|}}
                  <div role="cell" style={{styleStringFor column}}>{{column.getValueForRow row}}</div>
                {{/each}}
              </div>
            {{/each}}

          </div>
        </div>
      </div>
    </template>
  }

  module('with no options specified', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => [
          { name: 'A', key: 'A' },
          { name: 'B', key: 'B' },
          { name: 'C', key: 'C' },
          { name: 'D', key: 'D' },
        ],
        plugins: [ColumnResizing],
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
          <TestComponentA @table={{ctx.table}} @containerWidth={{ctx.containerWidth}} />
        </template>
      )

      const [columnA, columnB, columnC, columnD] = findAll('[role=columnheader]');
      const [cellA, cellB, cellC, cellD] = findAll('[role=columnheader]');

      assert(`Test is missing columns`, columnA && columnB && columnC && columnD);
      assert(`Test is missing cells`, cellA && cellB && cellC && cellD);

      await requestAnimationFrameSettled();

      await assertChanges(
        () => dragRight(columnB, 50),
        [
          { value: () => width(columnA), by: 50, msg: 'width of A increased by 50' },
          { value: () => width(columnB), by: -50, msg: 'width of B decreased by 50' },
          { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
          { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },

          { value: () => width(cellA), by: 50, msg: 'width of A increased by 50' },
          { value: () => width(cellB), by: -50, msg: 'width of B decreased by 50' },
          { value: () => width(cellC), by: 0, msg: 'width of C unchanged' },
          { value: () => width(cellD), by: 0, msg: 'width of D unchanged' },
        ]
      );

      await assertChanges(
        () => dragLeft(columnB, 10),
        [
          { value: () => width(columnA), by: -10, msg: 'width of A decreased by 10-' },
          { value: () => width(columnB), by: 10, msg: 'width of B increased by 10' },
          { value: () => width(columnC), by: 0, msg: 'width of C unchanged' },
          { value: () => width(columnD), by: 0, msg: 'width of D unchanged' },

          { value: () => width(cellA), by: -10, msg: 'width of A decreased by 10-' },
          { value: () => width(cellB), by: 10, msg: 'width of B increased by 10' },
          { value: () => width(cellC), by: 0, msg: 'width of C unchanged' },
          { value: () => width(cellD), by: 0, msg: 'width of D unchanged' },

        ]
      );
    });
  });
});

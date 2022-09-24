import Component from '@glimmer/component';
// @ts-ignore
import { on } from '@ember/modifier';
// @ts-ignore
import { fn } from '@ember/helper';
import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { meta } from 'ember-headless-table/plugins';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';

import type { ColumnConfig, Column } from 'ember-headless-table';
import { setOwner } from '@ember/application';

module('Plugins | columnVisibility', function (hooks) {
  setupRenderingTest(hooks);

  let ctx: Context;

  const DATA = [
    {
      // Red stuff
      A: 'Apple',
      B: 'Berry',
      C: 'Cranberry',
      D: 'Da Chile Pepper',
    },
    {
      // Green stuff
      A: 'Avocado',
      B: 'Plantain',
      C: 'Cucumber',
      D: 'Dill',
    },
    {
      // Yellow stuff
      A: 'A Squash',
      B: 'Banana',
      C: 'Corn',
      D: 'Durian',
    },
  ];

  class Context {
    columns = [
      { name: 'A', key: 'A' },
      { name: 'B', key: 'B' },
      { name: 'C', key: 'C' },
      { name: 'D', key: 'D' },
    ];

    table = headlessTable(this, {
      columns: () => this.columns,
      data: () => DATA,
      plugins: [ColumnVisibility],
    });
  }

  class TestComponentA extends Component<{ ctx: Context }> {
    get table() {
      return this.args.ctx.table;
    }

    get columns() {
      let tableMeta = meta.forTable(this.table, ColumnVisibility)
      /**
       * TODO: this cast is a dirty one, and should be removed.
       *       inference "should" be able to work here.
       */
      return tableMeta.visibleColumns as Column<typeof DATA[number]>[];
    }

    hide = (column: Column) => {
      return meta.forColumn(column, ColumnVisibility).hide();
    };

    show = (column: Column) => {
      return meta.forColumn(column, ColumnVisibility).show();
    };

    <template>
      <style>
        [data-scroll-container] {
          height: 100%;
          overflow: auto;
        }

        th {
          position: relative;
          border: 1px solid #999;
        }
      </style>
      <div>
        {{#each this.table.columns as |column|}}
          {{column.name}}:
          <button class="hide {{column.key}}" {{on 'click' (fn this.hide column)}}>
            Hide
          </button>
          <button class="show {{column.key}}" {{on 'click' (fn this.show column)}}>
            Show
          </button>
          <br>
        {{/each}}
      </div>
      <div class="theme-light" data-scroll-container {{this.table.modifiers.container}}>
        <table>
          <thead>
            <tr>
              {{#each this.columns as |column|}}
                <th class="{{column.key}}" {{this.table.modifiers.columnHeader column}}>
                  {{column.name}}
                </th>
              {{else}}
                <th>
                  No columns are visible
                </th>
              {{/each}}
            </tr>
          </thead>
          <tbody>
            {{#each this.table.rows as |row|}}
              <tr>
                {{#each this.columns as |column|}}
                  <td>
                    {{! @glint-ignore }}
                    {{column.getValueForRow row}}</td>
                {{/each}}
              </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
    </template>
  }

  module('with no options specified', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => this.columns,
        data: () => DATA,
        plugins: [ColumnVisibility],
      });
    }

    hooks.beforeEach(function () {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);
    });

    test('everything is visible', async function (assert) {
      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      // all columns are visible (because we configured it that way)
      assert.dom('th').exists({ count: 4 });
      assert.dom(`th.${ctx.columns[0]?.key}`).exists();
      assert.dom(`th.${ctx.columns[1]?.key}`).exists();
      assert.dom(`th.${ctx.columns[2]?.key}`).exists();
      assert.dom(`th.${ctx.columns[3]?.key}`).exists();
    });

    test('each column can be toggled', async function (assert) {
      assert.expect(17);

      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('th').exists({ count: 4 });

      for (let column of ctx.columns) {
        await click(`.hide.${column.key}`);
        assert.dom('th').exists({ count: 3 });
        assert.dom('thead tr').doesNotContainText(column.name);

        await click(`.show.${column.key}`);
        assert.dom('th').exists({ count: 4 });
        assert.dom('thead tr').containsText(column.name);
      }
    });

    test('all columns can be hidden', async function (assert) {
      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('th').exists({ count: 4 });
      assert.dom('thead').doesNotContainText('No columns are visible');

      for (let column of ctx.columns) {
        await click(`.hide.${column.key}`);
      }

      assert.dom('thead').containsText('No columns are visible');
    });

    test('columns re-appear in the same order they were left in', async function (assert) {
      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('thead tr').hasText('A B C D');

      for (let column of ctx.columns) {
        await click(`.hide.${column.key}`);
      }

      assert.dom('thead tr').doesNotContainText('ABCD');

      await click(`.show.${ctx.columns[2]?.key}`)
      await click(`.show.${ctx.columns[0]?.key}`)
      await click(`.show.${ctx.columns[3]?.key}`)
      await click(`.show.${ctx.columns[1]?.key}`)

      assert.dom('thead tr').hasText('A B C D');
    });
  });


  module('Columns can be hidden by default', function (hooks) {
    class DefaultOptions extends Context {
      table = headlessTable(this, {
        columns: () => [
          {
            name: 'A',
            key: 'A',
            pluginOptions: [
              [ColumnVisibility, () => ({ isVisible: false }) ]
            ]
          },
          {
            name: 'B',
            key: 'B',
            pluginOptions: [
              [ColumnVisibility, () => ({ isVisible: true }) ]
            ]
          },
          {
            name: 'C',
            key: 'C',
            pluginOptions: [
              [ColumnVisibility, () => ({ isVisible: false }) ]
            ]
          },
          { name: 'D', key: 'D' },
        ],
        data: () => DATA,
        plugins: [ColumnVisibility],
      });
    }

    hooks.beforeEach(async function (assert) {
      ctx = new DefaultOptions();
      setOwner(ctx, this.owner);

      await render(
        // @ts-ignore
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('th').exists({ count: 2 });
      assert.dom(`th.A`).doesNotExist();
      assert.dom(`th.B`).exists();
      assert.dom(`th.C`).doesNotExist();
      assert.dom(`th.D`).exists();
    });

    test('a column configured to be hidden can be toggled', async function(assert) {
      await click(`.show.A`);
      assert.dom('th').exists({ count: 3 });
      assert.dom('thead tr').containsText('A');

      await click(`.hide.A`);
      assert.dom('th').exists({ count: 2 });
      assert.dom('thead tr').doesNotContainText('A');
    });

    test('a column configured to be visible can be toggled', async function (assert) {
      await click(`.hide.B`);
      assert.dom('th').exists({ count: 1 });
      assert.dom('thead tr').doesNotContainText('B');

      await click(`.show.B`);
      assert.dom('th').exists({ count: 2 });
      assert.dom('thead tr').containsText('B');
    });

    test('a column not configured at all has default behavior', async function (assert) {
      await click(`.hide.D`);
      assert.dom('th').exists({ count: 1 });
      assert.dom('thead tr').doesNotContainText('D');

      await click(`.show.D`);
      assert.dom('th').exists({ count: 2 });
      assert.dom('thead tr').containsText('D');
    });
  })
});

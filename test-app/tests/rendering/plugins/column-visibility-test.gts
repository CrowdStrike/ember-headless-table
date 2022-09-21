import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
// @ts-ignore
import { on } from '@ember/modifier';
// @ts-ignore
import { fn } from '@ember/helper';
import { click, findAll, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { meta } from 'ember-headless-table/plugins';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';

import type { Column } from 'ember-headless-table';
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
    @tracked containerWidth = 1000;

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
      console.log(meta.forTable(this.table, ColumnVisibility).visibleColumns);

      return meta.forTable(this.table, ColumnVisibility).visibleColumns;
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
          <button class="hide {{column.key}}" {{on 'click' (fn this.hide column)}}>
            Hide
          </button>
          <button class="show {{column.key}}" {{on 'click' (fn this.show column)}}>
            Show
          </button>
        {{/each}}
      </div>
      <div class="theme-light" data-scroll-container {{this.table.modifiers.container}}>
        <table>
          <thead>
            <tr>
              {{#each this.columns as |column|}}
                <th class="{{column.key}}" {{this.table.modifiers.columnHeader column}}>
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
                  <td>{{column.getValueForRow row}}</td>
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
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('th').exists({ count: 4 });

      for (let column of ctx.columns) {
        await click(`.hide.${column.key}`);
        assert.dom('th').exists({ count: 3 });
        assert.dom('th').doesNotContainText(column.name);

        await click(`.show.${column.key}`);
        assert.dom('th').exists({ count: 4 });
        assert.dom('th').containsText(column.name);
      }
    });

    test('all columns can be hidden', async function (assert) {
      await render(
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('th').exists({ count: 4 });

      for (let column of ctx.columns) {
        await click(`.hide.${column.key}`);
      }

      assert.dom('th').doesNotExist()
    });

    test('columns re-appear in the same order they were left in', async function (assert) {
      await render(
        <template>
          <TestComponentA @ctx={{ctx}} />
        </template>
      );

      assert.dom('th').hasText('ABCD');

      for (let column of ctx.columns) {
        await click(`.hide.${column.key}`);
      }

      assert.dom('th').doesNotExist()

      await click(`.show.${ctx.columns[2]?.key}`)
      await click(`.show.${ctx.columns[0]?.key}`)
      await click(`.show.${ctx.columns[3]?.key}`)
      await click(`.show.${ctx.columns[1]?.key}`)

      assert.dom('th').hasText('ABCD');
    });
  });
});

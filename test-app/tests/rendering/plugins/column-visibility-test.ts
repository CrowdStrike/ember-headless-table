import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { setComponentTemplate } from '@ember/component';
import { assert } from '@ember/debug';
import { click, findAll, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { meta } from 'ember-headless-table/plugins';
import { ColumnVisibility } from 'ember-headless-table/plugins/column-visibility';

import type { Column } from 'ember-headless-table';
import { setOwner } from '@ember/application';

module('Plugins | columnVisibility', function (hooks) {
  setupRenderingTest(hooks);

  let renderWithContext: (comp?: unknown) => Promise<void>;
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
  }

  setComponentTemplate(
    hbs`
      {{!-- template-lint-disable no-forbidden-elements --}}
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
      {{!-- template-lint-disable no-inline-styles --}}
      {{!-- template-lint-disable style-concatenation --}}
      <div class="theme-light" data-scroll-container {{this.table.modifiers.container}}>
        <table>
          <thead>
            <tr>
              {{#each this.columns as |column|}}
                <th {{this.table.modifiers.columnHeader column}}>
                  <button class="left" {{on 'click' (fn this.moveLeft column)}}>
                    Move Left
                  </button>
                  <button class="right" {{on 'click' (fn this.moveRight column)}}>
                    Move Right
                  </button>
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
                {{#each this.table.visibleColumns as |column|}}
                  <td>{{column.getValueForRow row}}</td>
                {{/each}}
              </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
    `,
    TestComponentA
  );

  hooks.beforeEach(function () {
    ctx = new Context();

    renderWithContext = async (comp = TestComponentA) => {
      this.setProperties({ comp, ctx });

      await render(hbs`
        <this.comp @ctx={{this.ctx}} />
      `);
    };
  });

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

    test('basic re-ordering works', async function (assert) {
      await renderWithContext();
      // await this.pauseTest();
    });
  });
});

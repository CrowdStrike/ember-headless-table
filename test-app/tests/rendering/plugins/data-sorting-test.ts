import { setComponentTemplate } from '@ember/component';
import { assert } from '@ember/debug';
import { click, findAll, render } from '@ember/test-helpers';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { hbs } from 'ember-cli-htmlbars';
import { setupRenderingTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { headlessTable } from 'ember-headless-table';
import { meta } from 'ember-headless-table/plugins';
import { DataSorting, SortDirection } from 'ember-headless-table/plugins/data-sorting';

import type { Column } from 'ember-headless-table';
import type { SortItem } from 'ember-headless-table/plugins/data-sorting';

module('Plugins | dataSorting', function (hooks) {
  setupRenderingTest(hooks);

  let renderWithContext: (comp?: unknown) => Promise<void>;
  let ctx: Context;
  let getColumns = () => findAll('th');
  let getColumn = (index: number) => findAll(`tr td:nth-child(${index + 1})`);
  let valuesOf = (index: number) => getColumn(index).map((element) => element.textContent?.trim());
  let asc = async (column: Element) => {
    let button = column.querySelector('button.asc');

    assert('Missing ascending button', button);

    await click(button);
  };
  let desc = async (column: Element) => {
    let button = column.querySelector('button.desc');

    assert('Missing ascending button', button);

    await click(button);
  };

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
      plugins: [DataSorting],
    });
  }

  class TestComponentA extends Component<{ ctx: Context }> {
    get table() {
      return this.args.ctx.table;
    }

    sortDirection = (column: Column) => {
      return meta.forColumn(column, DataSorting).sortDirection;
    };

    sort = (column: Column) => {
      meta.forTable(column.table, DataSorting).handleSort(column);
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
      <div data-scroll-container {{this.table.modifiers.container}}>
        <table>
          <thead>
            <tr>
              {{#each this.table.visibleColumns as |column|}}
                <th {{this.table.modifiers.columnHeader column}}>
                  <span>({{this.sortDirection column}}) {{column.name}}</span>
                  <button class="asc" {{on 'click' (fn this.sort column)}}>
                    Asc
                  </button>
                  <button class="desc" {{on 'click' (fn this.sort column)}}>
                    Desc
                  </button>
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
    TestComponentA,
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
        plugins: [DataSorting],
      });
    }

    hooks.beforeEach(function () {
      ctx = new DefaultOptions();
    });

    test('sorting does nothing', async function (assert) {
      await renderWithContext();

      let [columnA] = getColumns();

      let valuesOfA = valuesOf(0);

      assert.deepEqual(valuesOfA, ['Apple', 'Avocado', 'A Squash']);

      await asc(columnA);
      assert.deepEqual(valuesOfA, ['Apple', 'Avocado', 'A Squash']);

      await desc(columnA);
      assert.deepEqual(valuesOfA, ['Apple', 'Avocado', 'A Squash']);
    });
  });

  module('with basic sorting configured', function (hooks) {
    class Configured extends Context {
      @tracked sorts: SortItem<unknown>[] = [
        {
          direction: SortDirection.Ascending,
          property: 'A',
        },
      ];

      table = headlessTable(this, {
        columns: () => [
          this.columns[0],
          {
            ...this.columns[1],
            pluginOptions: [DataSorting.forColumn(() => ({ isSortable: false }))],
          },
          this.columns[2],
          this.columns[3],
        ],
        data: () => DATA,
        plugins: [
          DataSorting.with(() => ({
            sorts: this.sorts,
            onSort: (sorts) => (this.sorts = sorts),
          })),
        ],
      });
    }

    hooks.beforeEach(function () {
      ctx = new Configured();
    });

    test('sorting works', async function (assert) {
      await renderWithContext();

      let [columnA] = getColumns();

      let valuesOfA = valuesOf(0);

      assert.deepEqual(valuesOfA, ['Apple', 'Avocado', 'A Squash']);

      await asc(columnA);
      assert.deepEqual(valuesOfA, ['Apple', 'Avocado', 'A Squash']);

      await desc(columnA);
      assert.deepEqual(valuesOfA, ['Apple', 'Avocado', 'A Squash']);
    });

    test('The second column is not sortable', async function (assert) {
      await renderWithContext();

      let [, columnB] = getColumns();

      let valuesOfA = valuesOf(0);
      let valuesOfB = valuesOf(1);

      assert.deepEqual(valuesOfA, ['Apple', 'Avocado', 'A Squash']);
      assert.deepEqual(valuesOfB, ['Berry', 'Plantain', 'Banana']);

      await asc(columnB);
      assert.deepEqual(valuesOfA, ['Apple', 'Avocado', 'A Squash']);
      assert.deepEqual(valuesOfB, ['Berry', 'Plantain', 'Banana']);

      await desc(columnB);
      assert.deepEqual(valuesOfA, ['Apple', 'Avocado', 'A Squash']);
      assert.deepEqual(valuesOfB, ['Berry', 'Plantain', 'Banana']);
    });
  });
});

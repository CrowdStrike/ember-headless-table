import Component from '@glimmer/component';
import { assert as debugAssert} from '@ember/debug';
import { setOwner } from '@ember/application';
import { findAll, click, render, resetOnerror, setupOnerror } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { tracked } from '@glimmer/tracking';
import { TrackedSet } from 'tracked-built-ins';
// typed-ember hasn't shipped types for these yet
// @ts-ignore
import { on } from '@ember/modifier';
// typed-ember hasn't shipped types for these yet
// @ts-ignore
import { fn } from '@ember/helper';

import { headlessTable } from 'ember-headless-table';
import { RowSelection, toggle, isSelected, select, deselect } from 'ember-headless-table/plugins/row-selection';
import { DATA } from 'test-app/data';

module('Plugins | RowSelection', function (hooks) {
  setupRenderingTest(hooks);

  let ctx: TestSetup;

  class TestSetup {
    table = headlessTable(this, {
      columns: () => [
        { name: 'A', key: 'A' },
        { name: 'B', key: 'B' },
        { name: 'C', key: 'C' },
        { name: 'D', key: 'D' },
      ],
      data: () => DATA,
      plugins: [RowSelection],
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
      <div data-container {{this.table.modifiers.container}}>
        <table>
          <thead>
            <tr class="relative">
              {{#each this.table.columns as |column|}}
                <th data-key={{column.key}} {{this.table.modifiers.columnHeader column}}>
                  <span class="name">{{column.name}}</span><br>
                </th>
              {{/each}}
            </tr>
          </thead>
          <tbody>
            {{#each this.table.rows as |row|}}
              <tr {{this.table.modifiers.row row}}>
                {{#each this.table.columns as |column|}}
                  <td>
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

      resetOnerror();
    });


    test('rendering with invalid arguments is not allowed', async function (assert) {
      assert.expect(1);

      setupOnerror((error) => {
        let errorStr = error instanceof Error ? error.message : `${error}`;
        assert.true(
          /Assertion Failed: selection, onSelect, and onDeselect are all required arguments for the RowSelection plugin/.test(errorStr)
        );
      });

      await render(<template>
        <TestStyles />
        <TestComponent @ctx={{ctx}} />
      </template>);
    });
  });

  module('with all required options', function (hooks) {
    type DataType = typeof DATA[number];

    class MultiRowSelection extends TestSetup {
      @tracked selection = new TrackedSet<DataType>();
      onSelect = (item: DataType) => this.selection.add(item);
      onDeselect = (item: DataType) => this.selection.delete(item);

      table = headlessTable(this, {
        columns: () => [
          { name: 'A', key: 'A' },
          { name: 'B', key: 'B' },
          { name: 'C', key: 'C' },
          { name: 'D', key: 'D' },
        ],
        data: () => DATA,
        plugins: [RowSelection.with(() => ({
          selection: this.selection,
          onSelect: (item: DataType) => this.selection.add(item),
          onDeselect: this.onDeselect,
        }))],
      });
    }

    let ctx: MultiRowSelection;

    hooks.beforeEach(function() {
      ctx = new MultiRowSelection();
      setOwner(ctx, this.owner);
    });

    test('it works (the non accessible way by clicking <tr>s', async function(assert) {
      await render(<template>
        <TestStyles />
        <TestComponent @ctx={{ctx}} />
      </template>);


      let rows = findAll('tbody tr');

      debugAssert('rows not found', rows[0] instanceof HTMLElement && rows[1] instanceof HTMLElement);

      assert.strictEqual(ctx.selection.size, 0);
      assert.deepEqual([...ctx.selection.values()], []);

      await click(rows[0]);

      assert.strictEqual(ctx.selection.size, 1);
      assert.deepEqual([...ctx.selection.values()], [DATA[0]]);

      await click(rows[1]);

      assert.strictEqual(ctx.selection.size, 2);
      assert.deepEqual([...ctx.selection.values()], [DATA[0], DATA[1]]);

      await click(rows[1]);

      assert.strictEqual(ctx.selection.size, 1);
      assert.deepEqual([...ctx.selection.values()], [DATA[0]]);

      await click(rows[0]);

      assert.strictEqual(ctx.selection.size, 0);
      assert.deepEqual([...ctx.selection.values()], []);
    });

    module('helpers work as expected (and would be used for accessible implementations)', function () {
      test('toggle', async function (assert) {
        let [first, second] = ctx.table.rows;

        debugAssert('rows need to exist for this test', first && second);

        await render(<template>
          <TestStyles />
          <TestComponent @ctx={{ctx}} />

          <button id="the-helper-1" {{on 'click' (fn toggle first)}}>click me</button>
          <button id="the-helper-2" {{on 'click' (fn toggle second)}}>click me</button>
        </template>);


        assert.strictEqual(ctx.selection.size, 0);
        assert.deepEqual([...ctx.selection.values()], []);

        await click('#the-helper-1');

        assert.strictEqual(ctx.selection.size, 1);
        assert.deepEqual([...ctx.selection.values()], [DATA[0]]);

        await click('#the-helper-2');

        assert.strictEqual(ctx.selection.size, 2);
        assert.deepEqual([...ctx.selection.values()], [DATA[0], DATA[1]]);

        await click('#the-helper-2');

        assert.strictEqual(ctx.selection.size, 1);
        assert.deepEqual([...ctx.selection.values()], [DATA[0]]);

        await click('#the-helper-1');

        assert.strictEqual(ctx.selection.size, 0);
        assert.deepEqual([...ctx.selection.values()], []);
      });

      test('isSelected', async function (assert) {
        let [first, second] = ctx.table.rows;

        debugAssert('rows need to exist for this test', first && second);

        await render(<template>
          <TestStyles />
          <TestComponent @ctx={{ctx}} />

          {{#if first}}
            <out id="the-helper-1">{{isSelected first}}</out>
          {{/if}}
          {{#if second}}
            <out id="the-helper-2">{{isSelected second}}</out>
          {{/if}}
        </template>);

        let rows = findAll('tbody tr');

        debugAssert('rows not found', rows[0] instanceof HTMLElement && rows[1] instanceof HTMLElement);

        assert.dom('#the-helper-1').hasText('false');
        assert.dom('#the-helper-2').hasText('false');

        await click(rows[0]);

        assert.dom('#the-helper-1').hasText('true');
        assert.dom('#the-helper-2').hasText('false');

        await click(rows[1]);

        assert.dom('#the-helper-1').hasText('true');
        assert.dom('#the-helper-2').hasText('true');

        await click(rows[1]);

        assert.dom('#the-helper-1').hasText('true');
        assert.dom('#the-helper-2').hasText('false');

        await click(rows[0]);

        assert.dom('#the-helper-1').hasText('false');
        assert.dom('#the-helper-2').hasText('false');
      });

      test('select & deselect', async function (assert) {
        let [first, second] = ctx.table.rows;

        debugAssert('rows need to exist for this test', first && second);

        await render(<template>
          <TestStyles />
          <TestComponent @ctx={{ctx}} />

          <button id="select-1" {{on 'click' (fn select first)}}>click me</button>
          <button id="select-2" {{on 'click' (fn select second)}}>click me</button>
          <button id="deselect-1" {{on 'click' (fn deselect first)}}>click me</button>
          <button id="deselect-2" {{on 'click' (fn deselect second)}}>click me</button>
        </template>);


        assert.strictEqual(ctx.selection.size, 0);
        assert.deepEqual([...ctx.selection.values()], []);

        await click('#select-1');

        assert.strictEqual(ctx.selection.size, 1);
        assert.deepEqual([...ctx.selection.values()], [DATA[0]]);

        await click('#select-2');
        await click('#select-2'); // does not toggle

        assert.strictEqual(ctx.selection.size, 2);
        assert.deepEqual([...ctx.selection.values()], [DATA[0], DATA[1]]);

        await click('#deselect-2');

        assert.strictEqual(ctx.selection.size, 1);
        assert.deepEqual([...ctx.selection.values()], [DATA[0]]);

        await click('#deselect-1');
        await click('#deselect-1'); // does not toggle

        assert.strictEqual(ctx.selection.size, 0);
        assert.deepEqual([...ctx.selection.values()], []);
      });
    });
  });

});

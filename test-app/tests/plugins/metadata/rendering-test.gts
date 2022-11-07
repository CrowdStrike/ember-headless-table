import { tracked } from '@glimmer/tracking';
import { find, settled, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { headlessTable } from 'ember-headless-table';
import { Metadata, forColumn, forTable } from 'ember-headless-table/plugins/metadata';

import { setOwner } from '@ember/application';
import { DATA } from 'test-app/data';

module('Plugins | metadata', function (hooks) {
  setupRenderingTest(hooks);

  module('Reactivity', function (hooks) {
    class Context {
      @tracked bRad = 'true';
      @tracked bIsDoingOneHandledFlips = 'true';
      @tracked dRed = false;

      @tracked tableFoo = '2';

      table = headlessTable(this, {
        columns: () => [
          { name: 'A', key: 'A' },
          { name: 'B', key: 'B', pluginOptions: [
            Metadata.forColumn(() => ({
              isRad: this.bRad,
              doingOneHandedFlips: this.bIsDoingOneHandledFlips
            }))
          ] },
          { name: 'D', key: 'D', pluginOptions: [Metadata.forColumn(() => ({ isRad: this.dRed }))] },
        ],
        data: () => DATA,
        plugins: [Metadata.with(() => ({ foo: this.tableFoo }))],
      });
    }

    let ctx: Context;

    hooks.beforeEach(async function (assert) {
      ctx = new Context();
      setOwner(ctx, this.owner);

      let step = (key: string, eventName: string, passthrough: string) => {
        assert.step(`${key}@${eventName}: ${passthrough}`);
        return passthrough;
      }

      await render(
        <template>
          {{#each ctx.table.columns as |column|}}
            <span class="{{column.key}}">
              <span class="isRad">{{step column.key "isRad" (forColumn column "isRad")}}</span>
              <span class="isMissing">{{step column.key "isMissing" (forColumn column "isMissing")}}</span>
              <span class="doingOneHandedFlips">{{step column.key "flips" (forColumn column "doingOneHandedFlips")}}</span>
            </span>
          {{/each}}

          <span class="table">
            <span class="foo">{{step "table" "foo" (forTable ctx.table "foo")}}</span>
            <span class="bar">{{step "table" "bar" (forTable ctx.table "bar")}}</span>
          </span>
        </template>
      );

      assert.verifySteps([
        "A@isRad: undefined",
        "A@isMissing: undefined",
        "A@flips: undefined",
        "B@isRad: true",
        "B@isMissing: undefined",
        "B@flips: true",
        "D@isRad: false",
        "D@isMissing: undefined",
        "D@flips: undefined",
        "table@foo: 2",
        "table@bar: undefined"
      ]);
    });

    test('it works, statically', async function (assert) {
      assert.dom(find('.A .isRad')).hasNoText()
      assert.dom(find('.A .isMissing')).hasNoText()
      assert.dom(find('.A .doingOneHandedFlips')).hasNoText()
      assert.dom(find('.B .isRad')).hasText('true')
      assert.dom(find('.B .isMissing')).hasNoText()
      assert.dom(find('.B .doingOneHandedFlips')).hasText('true')
      assert.dom(find('.D .isRad')).hasText('false')
      assert.dom(find('.D .isMissing')).hasNoText()
      assert.dom(find('.D .doingOneHandedFlips')).hasNoText()

      assert.dom(find('.table .foo')).hasText('2');
      assert.dom(find('.table .bar')).hasNoText();

      assert.verifySteps([]);
    });

    test('it works, dynamically', async function (assert) {
      ctx.bRad = 'false';
      await settled();

      assert.dom(find('.B .isRad')).hasText('false');
      assert.dom(find('.B .doingOneHandedFlips')).hasText('true');
      assert.dom(find('.table .foo')).hasText('2');
      assert.verifySteps([
        "B@isRad: false",
        "B@isMissing: undefined",
        "B@flips: true"
      ],
        `all of column B's properties are re-evaluated, because this test does not do finer-grained reactivity. `
         + `but that is possible, if the user wishes`);

      ctx.bIsDoingOneHandledFlips = 'false';
      await settled();

      assert.dom(find('.B .isRad')).hasText('false');
      assert.dom(find('.B .doingOneHandedFlips')).hasText('false');
      assert.dom(find('.table .foo')).hasText('2');
      assert.verifySteps([
        "B@isRad: false",
        "B@isMissing: undefined",
        "B@flips: false"
      ],
        `all of column B's properties are re-evaluated, because this test does not do finer-grained reactivity. `
         + `but that is possible, if the user wishes`);

      ctx.tableFoo = '3';
      await settled();

      assert.dom(find('.B .isRad')).hasText('false');
      assert.dom(find('.B .doingOneHandedFlips')).hasText('false');
      assert.dom(find('.table .foo')).hasText('3');
      assert.verifySteps([
        "table@foo: 3",
        "table@bar: undefined"
      ],
        `all of column B's properties are re-evaluated, because this test does not do finer-grained reactivity. `
         + `but that is possible, if the user wishes`);
    });
  });

});

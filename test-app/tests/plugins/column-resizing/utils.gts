import { findAll, settled } from '@ember/test-helpers';
import { tracked } from '@glimmer/tracking';

import { headlessTable, type ColumnConfig } from 'ember-headless-table';
import { ColumnResizing } from 'ember-headless-table/plugins/column-resizing';

import * as QUnit from 'qunit';

type Changes = Array<{ value: () => number; by: number; msg?: string }>;

/**
 * In order for this work nicely with clean, non-decimal values, we must:
 *  - box-sizing: borderbox everywhere
 *  - on the table: border-collapse: collapse;
 *  - no border styling around cells
 *  - bax shadows are fine (for testing where column boundaries are (for humans))
 */
export async function assertChanges(block: () => Promise<void> | void, changes: Changes) {
  let initialValues = changes.map((change) => change.value());

  await block();
  await settled();

  for (let [key, change] of Object.entries(changes)) {
    let index = parseInt(key, 10);

    let actual = change.value();
    let expected = (initialValues[index] || 0) + change.by;

    // Uncomment this to debug flaky resize behavior!
    // if (actual !== expected) {
    //   console.log({ key, actual, expected, by: change.by, initially: initialValues[index] });
    //   await pauseTest();
    // }

    QUnit.assert.strictEqual(actual, expected, change.msg);
  }
}

export function width(element: Element) {
  return element.getBoundingClientRect().width;
}

export const getColumns = () => {
  let ths = findAll('th');

  return ths;
};

  export class Context {
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

  // This removes some styling that is put on the testing container that
  // interferes with the tests used in this module.  Mainly, the testing
  // container has a transform: scale(0.5); by default that makes it
  // difficult to write these tests in a way that makes sense because
  // everything needs to be cut in half to account for it.
  //
  // See https://github.com/emberjs/ember-qunit/issues/521
export  const TestStyles = <template>
    <style>
      #ember-testing { width: initial; height: initial; transform: initial; }
      #ember-testing-container { width: 1000px; }

      [data-handle] {
        cursor: ew-resize;
        display: inline-block;
        position: absolute;
        left: -0.3rem;
        width: 1rem;
        text-align: center;
      }

      th:first-child [data-handle] {
        display: none;
      }

      [data-scroll-container] {
        height: 100%;
        overflow: auto;
      }

      * {
        box-sizing: border-box;
      }

      table {
        border-collapse: collapse;
      }

      th {
        position: relative;
        box-shadow: inset 1px 0px 0px rgb(0 0 0 / 50%);
      }
    </style>
  </template>;


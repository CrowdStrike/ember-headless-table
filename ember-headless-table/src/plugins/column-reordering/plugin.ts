import { cached } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { action } from '@ember/object';

import { TrackedMap } from 'tracked-built-ins';

import { BasePlugin, meta } from '../-private/base';

import type { Plugin } from '[public-plugin-types]';
import type { Column, Table } from '[public-types]';

export interface ColumnOptions {}
export interface TableOptions {}

export class ColumnReordering
  extends BasePlugin<ColumnMeta, TableMeta, TableOptions, ColumnOptions>
  implements Plugin<ColumnMeta, TableMeta>
{
  name = 'column-reordering';
  static features = ['columnOrder'];
  static requires = ['columnVisibility'];

  meta = {
    column: ColumnMeta,
    table: TableMeta,
  } as const;

  reset() {
    let meta = this.getTableMeta();

    meta.reset();
  }
}

class ColumnMeta {
  constructor(private column: Column) {}

  get #tableMeta() {
    return meta.forTable(this.column.table, ColumnReordering);
  }

  get position() {
    return this.#tableMeta.getPosition(this.column);
  }

  set position(value: number) {
    this.#tableMeta.setPosition(this.column, value);
  }

  /**
   * Move the column one spot to the left
   */
  moveLeft = () => this.position--;

  /**
   * Move the column one spot to the right
   */
  moveRight = () => this.position++;
}

class TableMeta {
  constructor(private table: Table) {}

  /**
   * We want to maintain the instance of this ColumnOrder class because
   * we allow the consumer of the table to swap out columns at any time.
   * When they do this, we want to maintain the order of the table, best we can.
   * This is also why the order of the columns is maintained via column key
   */
  #columnOrder = new ColumnOrder({ columns: () => this.#visibleColumns });

  @action
  getPosition(column: Column) {
    return this.#columnOrder.get(column.key);
  }

  @action
  setPosition(column: Column, newPosition: number) {
    return this.#columnOrder.set(column.key, newPosition);
  }

  /**
   * Revert to default config, ignoring preferences
   */
  @action
  reset() {
    // TODO: delete relevant preferences entries.
    //       do we also want to clear local state?
  }

  @cached
  get columns() {
    return this.#columnOrder.orderedColumns;
  }

  /**
   * This isn't our data to expose, but it is useful to alias
   */
  get #visibleColumns() {
    let visiblility = meta.withFeature.forTable(this.table, 'columnVisibility');

    return visiblility.visibleColumns;
  }
}

class ColumnOrder {
  /**
   * This map will be empty until we re-order something.
   */
  map = new TrackedMap<string, number>();

  constructor(private args: { columns: () => Column[] }) {}

  @action
  set(key: string, position: number) {
    console.log('set', key, position);
    this.map.set(key, position);
  }

  @action
  get(key: string) {
    let result = this.orderedMap.get(key);

    console.log(key, result, this.orderedMap);

    assert(`No position found for ${key}. Is the column used within this table?`, result);

    return result;
  }

  /**
   * The same as this.map, but with all the columns' information
   */
  @cached
  get orderedMap(): ReadonlyMap<string, number> {
    return orderOf(this.args.columns(), this.map);
  }

  @cached
  get orderedColumns(): Column[] {
    let availableColumns = this.args.columns();
    let availableByKey = availableColumns.reduce((keyMap, column) => {
      keyMap[column.key] = column;

      return keyMap;
    }, {} as Record<string, Column>);
    let mergedOrder = orderOf(availableColumns, this.map);

    let result: Column[] = Array.from({ length: availableColumns.length });

    for (let [key, position] of mergedOrder.entries()) {
      let column = availableByKey[key];

      assert(`Could not find column for pair: ${key} @ @{position}`, column);
      result[position] = column;
    }

    assert(
      `Generated orderedColumns' length (${result.filter(Boolean).length}) ` +
        `does not match the length of available columns (${availableColumns.length})`,
      result.filter(Boolean).length === availableColumns.length
    );

    return result;
  }
}

/**
 * @private
 *
 * Utility for helping determine the percieved order of a set of columns
 * given the original (default) ordering, and then user-configurations
 */
export function orderOf(
  columns: { key: string }[],
  currentOrder: Map<string, number>
): Map<string, number> {
  let result = new Map<string, number>();
  let availableColumns = columns.map((column) => column.key);
  let current = new Map<number, string>(
    [...currentOrder.entries()].map(([key, position]) => [position, key])
  );

  for (let i = 0; i < columns.length; i++) {
    let orderedKey = current.get(i);

    if (orderedKey) {
      result.set(orderedKey, i);
      continue;
    }

    let availableKey: string | undefined;

    while ((availableKey = availableColumns.shift())) {
      if (result.has(availableKey) || currentOrder.has(availableKey)) {
        continue;
      }

      break;
    }

    if (!availableKey) {
      /**
       * The rest of our columns likely have their order set
       */
      continue;
    }

    result.set(availableKey, i);
  }

  return result;
}

import { cached, tracked } from '@glimmer/tracking';
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
  moveLeft = () => {
    this.position--;
  };

  /**
   * Move the column one spot to the right
   */
  moveRight = () => {
    this.position++;
  };
}

class ColumnOrder {
  @tracked map = new TrackedMap<number, string>();

  get isUnitialized() {
    return this.map.size === 0;
  }

  @action
  set(key: string, position: number) {
    this.map.set(position, key);
  }

  @action
  get(key: string) {
    let result = this.inverted.get(key);

    assert(`No position found for ${key}. Is the column used within this table?`, result);

    return result;
  }

  @cached
  get inverted(): ReadonlyMap<string, number> {
    return new Map([...this.map.entries()].map((pair) => pair.reverse() as [string, number]));
  }
}

class TableMeta {
  constructor(private table: Table) {}

  @tracked columnOrder = new ColumnOrder();

  @action
  getPosition(column: Column) {
    return this.columnOrder.get(column.key);
  }

  @action
  setPosition(column: Column, newPosition: number) {
    return this.columnOrder.set(column.key, newPosition);
  }

  /**
   * Revert to default config, ignoring preferences
   */
  @action
  reset() {
    // TODO:
  }

  @cached
  get columns() {
    let visiblility = meta.withFeature.forTable(this.table, 'columnVisibility');
    let columns = visiblility.visibleColumns;

    let result = getRepositionedColumns(columns, this.columnOrder);

    console.log({ columns, result });

    return result;
  }
}

function getRepositionedColumns(columns: Column[], orderedColumns: ColumnOrder | undefined) {
  if (orderedColumns === undefined) {
    return columns;
  }

  if (orderedColumns?.isUnitialized) {
    return columns;
  }

  let repositionedColumns: Column[] = Array.from({
    length: columns.length,
  });

  // for (const column of columns) {
  //   const orderedColumn = orderedColumns.find((orderedColumn) => column.key === orderedColumn.key);

  //   if (orderedColumn === undefined) {
  //     if (column.position !== undefined && column.position >= 0) {
  //       repositionedColumns[column.position] = column;
  //     }

  //     continue;
  //   }

  //   const { position } = orderedColumn;

  //   if (position !== undefined && !repositionedColumns[position]) {
  //     repositionedColumns[position] = column;
  //   } else {
  //     repositionedColumns.push(column);
  //   }
  // }

  repositionedColumns = repositionedColumns.filter((column) => column !== undefined);

  return repositionedColumns;
}

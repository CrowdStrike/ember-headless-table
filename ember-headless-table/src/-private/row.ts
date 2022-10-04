import { assert } from '@ember/debug';
import { action } from '@ember/object';

import type { Table } from './table';

export class Row<DataType = Record<string, unknown>> {
  data: DataType;
  table: Table<DataType>;

  get index(): number {
    let i = this.table.rows.values().indexOf(this);

    assert(`Row is no longer a part of the table, something has gone wrong`, i >= 0);

    return i;
  }

  get isOdd() {
    return this.index % 2 !== 0;
  }

  get isSelected() {
    return this.table.rowSelection.has(this.data);
  }

  get next(): Row<DataType> | undefined {
    return this.table.rows[this.index + 1];
  }

  get prev(): Row<DataType> | undefined {
    return this.table.rows[this.index - 1];
  }

  get isSelectable() {
    return this.table.isRowSelectable;
  }

  constructor(table: Table<DataType>, data: DataType) {
    this.data = data;
    this.table = table;
  }

  @action
  handleClick(event: MouseEvent) {
    assert(
      `expected event.target to be an instance of HTMLElement`,
      event.target instanceof HTMLElement || event.target instanceof SVGElement,
    );

    let selection = document.getSelection();

    if (selection) {
      let { type, anchorNode } = selection;
      let isSelectingText = type === 'Range' && event.target?.contains(anchorNode);

      if (isSelectingText) {
        event.stopPropagation();

        return;
      }
    }

    // Ignore clicks on interactive elements within the row
    let inputParent = event.target.closest('input, button, label, a, select');

    if (inputParent) {
      return;
    }

    this.isSelected ? this.table.unselectRow(this) : this.table.selectRow(this);
  }
}

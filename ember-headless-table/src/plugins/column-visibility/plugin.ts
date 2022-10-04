import { assert } from '@ember/debug';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';

import { BasePlugin, meta, options, preferences } from '../-private/base';

import type { Plugin } from '[public-plugin-types]';
import type { Column, Table } from '[public-types]';

export interface ColumnOptions {
  isVisible?: boolean;
}

export interface TableOptions {
  enabled?: boolean;
}

export class ColumnVisibility
  extends BasePlugin<ColumnMeta, TableMeta, TableOptions, ColumnOptions>
  implements Plugin<ColumnMeta, TableMeta>
{
  name = 'column-visibility';
  static features = ['columnVisibility'];

  meta = {
    column: ColumnMeta,
    table: TableMeta,
  } as const;

  reset() {
    /**
     * Global preference, not scoped to plugin
     */
    for (let column of this.table.columns) {
      let defaultValue = this.getColumnOptions(column)?.isVisible;
      let current = this.getColumnMeta(column).isVisible;

      if (defaultValue !== current) {
        preferences.forColumn(column, ColumnVisibility).delete('isVisible');
      }
    }
  }
}

class ColumnMeta {
  constructor(private column: Column) {}

  get isVisible() {
    let columnPreferences = preferences.forColumn(this.column, ColumnVisibility);
    let columnOptions = options.forColumn(this.column, ColumnVisibility);

    return columnPreferences.get('isVisible') ?? columnOptions?.isVisible;
  }

  hide = () => {
    if (!this.isVisible) return;

    let myPreferences = preferences.forColumn(this.column, ColumnVisibility);
    let myOptions = options.forColumn(this.column, ColumnVisibility);
    let willBeDefault = Boolean(myOptions?.isVisible);

    if (willBeDefault) {
      myPreferences.delete('isVisible');

      return;
    }

    myPreferences.set('isVisible', false);
  };

  show = () => {
    if (this.isVisible) return;

    let myPreferences = preferences.forColumn(this.column, ColumnVisibility);
    let myOptions = options.forColumn(this.column, ColumnVisibility);
    let willBeDefault = !myOptions?.isVisible;

    if (willBeDefault) {
      myPreferences.delete('isVisible');

      return;
    }

    myPreferences.set('isVisible', true);
  };

  toggle = () => {
    if (this.isVisible) {
      this.hide();

      return;
    }

    this.show();
  };
}

class TableMeta {
  constructor(private table: Table) {}

  @cached
  get visibleColumns(): Column[] {
    let allColumns = this.table.columns.values();

    return allColumns.filter((column) => {
      let columnMeta = meta.forColumn(column, ColumnVisibility);

      return columnMeta.isVisible;
    });
  }

  @action
  toggleColumnVisibility(column: Column) {
    let columnMeta = meta.forColumn(column, ColumnVisibility);

    columnMeta.toggle();

    // TODO: REMOVE
    // TODO: remember to reset column widths in toucan-data-table
  }

  @action
  previousColumn(referenceColumn: Column) {
    let visible = this.visibleColumns;
    let referenceIndex = visible.indexOf(referenceColumn);

    assert(
      `index of reference column must be >= 0. column likely not a part of the table`,
      referenceIndex >= 0,
    );

    /**
     * There can be nothing before the first column
     */
    if (referenceIndex === 0) {
      return null;
    }

    return visible[referenceIndex - 1];
  }

  @action
  nextColumn(referenceColumn: Column) {
    let visible = this.visibleColumns;
    let referenceIndex = visible.indexOf(referenceColumn);

    assert(
      `index of reference column must be >= 0. column likely not a part of the table`,
      referenceIndex >= 0,
    );

    /**
     * There can be nothing after the last column
     */
    if (referenceIndex > visible.length - 1) {
      return null;
    }

    return visible[referenceIndex + 1];
  }

  @action
  columnsAfter(referenceColumn: Column) {
    let visible = this.visibleColumns;
    let referenceIndex = visible.indexOf(referenceColumn);

    return visible.slice(referenceIndex + 1);
  }

  @action
  columnsBefore(referenceColumn: Column) {
    let visible = this.visibleColumns;
    let referenceIndex = visible.indexOf(referenceColumn);

    return visible.slice(0, referenceIndex);
  }
}

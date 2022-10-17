import { cached } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { action } from '@ember/object';

import { BasePlugin, meta, options, preferences } from '../-private/base';

import type { Plugin, PluginPreferences } from '[public-plugin-types]';
import type { Column, Table } from '[public-types]';

interface ColumnVisibilityPreferences extends PluginPreferences {
  columns: {
    [columnKey: string]: {
      isVisible?: boolean;
    };
  };
}

declare module 'ember-headless-table/plugins' {
  interface Registry {
    ColumnVisibility?: ColumnVisibilityPreferences;
  }
}

export interface Signature {
  Meta: {
    Table: TableMeta;
    Column: ColumnMeta;
  };
  Options: {
    Plugin: {
      enabled?: boolean;
    };
    Column: {
      /**
       * The default visibilty of the column, when rendered.
       * The column can still be toggled on and off.
       *
       * When interacting with preferences, the value stored in preferenced
       * will be the inverse of this value (to save space in storage).
       */
      isVisible?: boolean;
    };
  };
}

export class ColumnVisibility extends BasePlugin<Signature> implements Plugin<Signature> {
  name = 'column-visibility';
  static features = ['columnVisibility'];

  meta = {
    column: ColumnMeta,
    table: TableMeta,
  };

  reset() {
    /**
     * Global preference, not scoped to plugin
     */
    for (let column of this.table.columns) {
      let defaultValue = options.forColumn(column, ColumnVisibility)?.isVisible;
      let current = meta.forColumn(column, ColumnVisibility).isVisible;

      if (defaultValue !== current) {
        preferences.forColumn(column, ColumnVisibility).delete('isVisible');
      }
    }
  }
}

export class ColumnMeta<Data = unknown> {
  constructor(private column: Column<Data>) {}

  get isVisible(): boolean {
    let columnPreferences = preferences.forColumn(this.column, ColumnVisibility);
    let columnOptions = options.forColumn(this.column, ColumnVisibility);

    return Boolean(columnPreferences.get('isVisible') ?? columnOptions?.isVisible ?? true);
  }

  get isHidden(): boolean {
    return !this.isVisible;
  }

  hide = () => {
    if (!this.isVisible) return;

    let myPreferences = preferences.forColumn(this.column, ColumnVisibility);
    let myOptions = options.forColumn(this.column, ColumnVisibility);
    let currentSaved = myPreferences.get('isVisible');
    let willBeDefault = Boolean(currentSaved) === !myOptions?.isVisible;

    if (willBeDefault) {
      myPreferences.set('isVisible', false);
      // TODO: open an issue about tracked-built-ins' delete not being reactive
      // myPreferences.delete('isVisible');

      return;
    }

    myPreferences.set('isVisible', false);
  };

  show = () => {
    if (this.isVisible) return;

    let myPreferences = preferences.forColumn(this.column, ColumnVisibility);
    let myOptions = options.forColumn(this.column, ColumnVisibility);
    let currentSaved = myPreferences.get('isVisible');
    let willBeDefault = currentSaved === !myOptions?.isVisible;

    if (willBeDefault) {
      myPreferences.set('isVisible', true);
      // TODO: open an issue about tracked-built-ins' delete not being reactive
      // myPreferences.delete('isVisible');

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

export class TableMeta<Data = unknown> {
  constructor(private table: Table<Data>) {}

  @cached
  get visibleColumns(): Column<Data>[] {
    let allColumns = this.table.columns.values();

    return allColumns.filter((column) => {
      let columnMeta = meta.forColumn(column, ColumnVisibility);

      return columnMeta.isVisible;
    });
  }

  @action
  toggleColumnVisibility(column: Column<Data>) {
    let columnMeta = meta.forColumn(column, ColumnVisibility);

    columnMeta.toggle();

    // TODO: REMOVE
    // TODO: remember to reset column widths in toucan-data-table
  }

  @action
  previousColumn(referenceColumn: Column<Data>) {
    let visible = this.visibleColumns;
    let referenceIndex = visible.indexOf(referenceColumn);

    assert(
      `index of reference column must be >= 0. column likely not a part of the table`,
      referenceIndex >= 0
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
  nextColumn(referenceColumn: Column<Data>) {
    let visible = this.visibleColumns;
    let referenceIndex = visible.indexOf(referenceColumn);

    assert(
      `index of reference column must be >= 0. column likely not a part of the table`,
      referenceIndex >= 0
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
  columnsAfter(referenceColumn: Column<Data>) {
    let visible = this.visibleColumns;
    let referenceIndex = visible.indexOf(referenceColumn);

    return visible.slice(referenceIndex + 1);
  }

  @action
  columnsBefore(referenceColumn: Column<Data>) {
    let visible = this.visibleColumns;
    let referenceIndex = visible.indexOf(referenceColumn);

    return visible.slice(0, referenceIndex);
  }
}

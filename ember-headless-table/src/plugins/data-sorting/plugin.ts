import { cached } from '@glimmer/tracking';
import { action } from '@ember/object';

import { BasePlugin, meta, options } from '../-private/base';
import { SortDirection } from './types';

import type { Sort, SortItem } from './types';
import type { ColumnApi, PluginPreferences } from '[public-plugin-types]';
import type { Column, Table } from '[public-types]';

interface SortingPreferences extends PluginPreferences {
  table: {
    sorts?: Sort[];
  };
}

declare module 'ember-headless-table/plugins' {
  interface Registry {
    Sorting?: SortingPreferences;
  }
}

/**
 * Utility to disambiguate ColumnMeta and TableMeta
 */
interface Meta {
  column: ColumnMeta;
  table: TableMeta;
}

interface Options<DataType = unknown> {
  /**
   * Handler for interpreting sort requests from the headless table.
   *
   * Does not actually do the sorting.
   *
   * if omitted, the DataSorting plugin will disable itself
   */
  onSort?: (sorts: SortItem<DataType>[]) => void;
  /**
   * Provided sorts that the table should assume are true.
   *
   * if omitted, the DataSorting plugin will disable itself
   */
  sorts?: SortItem<DataType>[];
}

interface ColumnOptions {
  /**
   * Opt in or out of sorting for a particular column.
   * Default is true.
   */
  isSortable?: boolean;
  /**
   * Use this key instead of the `key` on the column config.
   * This has no bearing on any behavior in the plugin, *other than*,
   * swapping out the `property`'s value on the `SortItem`s passed to
   * the table plugin config's `onSort` callback
   */
  sortProperty?: string;
}

/**
 * Manages basic data-sorting behaviors. Ascending -> Descending -> None
 *
 * This plugin requires a table plugin configuration, `onSort` for handling *how* sorting happens.
 * communicating back to the table that sorting has succeeded can be done by setting the `sorts`
 * property in the table plugin configuration.
 *
 * Note that this plugin doesn't actually sort the data, as data management is not the responsibility
 * of the table, but of the surrounding context providing the data to the table. So sorting can happen
 * client-side still, just in a component -- much the same way you'd handel sorting via API requests.
 *
 * This plugin is for *conveying* what the current sorts are, rather than _doing_ the sorting.
 */
export class Sorting extends BasePlugin<Meta['column'], Meta['table'], Options, ColumnOptions> {
  name = 'data-sorting';

  meta = {
    column: ColumnMeta,
    table: TableMeta,
  };

  headerCellModifier = (element: HTMLElement, { column }: ColumnApi) => {
    let meta = this.getColumnMeta(column);

    element.setAttribute('data-test-is-sortable', `${meta.isSortable}`);
    element.setAttribute('aria-sort', `${meta.sortDirection}`);
  };
}

export class ColumnMeta {
  constructor(private column: Column) {}

  @cached
  get options() {
    return options.forColumn(this.column, Sorting);
  }

  get isSortable() {
    return this.options?.isSortable ?? this.tableMeta.isSortable;
  }

  get tableMeta() {
    return meta.forTable(this.column.table, Sorting);
  }

  get sortDirection() {
    let sort = this.tableMeta.sorts.find((sort) => sort.property === this.sortProperty);

    return sort?.direction ?? SortDirection.None;
  }

  get isAscending() {
    return this.sortDirection === SortDirection.Ascending;
  }

  get isDescending() {
    return this.sortDirection === SortDirection.Descending;
  }

  get isUnsorted() {
    return this.sortDirection === SortDirection.None;
  }

  get sortProperty() {
    return this.options?.sortProperty ?? this.column.config.key;
  }
}

export class TableMeta {
  constructor(private table: Table) {}

  @cached
  get options() {
    return options.forTable(this.table, Sorting);
  }

  get sorts() {
    return this.options?.sorts ?? [];
  }

  get isSortable() {
    return Boolean(this.options?.onSort) && Boolean(this.options?.sorts);
  }

  get onSort() {
    return this.options?.onSort;
  }

  @action
  handleSort(column: Column) {
    let columnMeta = meta.forColumn(column, Sorting);

    if (!columnMeta.sortProperty) {
      return;
    }

    if (columnMeta.sortDirection === SortDirection.Ascending) {
      this.onSort?.([]);
    } else if (columnMeta.sortDirection === SortDirection.Descending) {
      this.onSort?.([{ direction: SortDirection.Ascending, property: columnMeta.sortProperty }]);
    } else {
      this.onSort?.([{ direction: SortDirection.Descending, property: columnMeta.sortProperty }]);
    }
  }

  @action
  toggleAscending(column: Column) {
    let columnMeta = meta.forColumn(column, Sorting);

    if (!columnMeta.sortProperty) {
      return;
    }

    if (columnMeta.sortDirection === SortDirection.Ascending) {
      return this.onSort?.([]);
    }

    this.onSort?.([{ direction: SortDirection.Ascending, property: columnMeta.sortProperty }]);
  }

  @action
  toggleDescending(column: Column) {
    let columnMeta = meta.forColumn(column, Sorting);

    if (!columnMeta.sortProperty) {
      return;
    }

    if (columnMeta.sortDirection === SortDirection.Descending) {
      return this.onSort?.([]);
    }

    this.onSort?.([{ direction: SortDirection.Descending, property: columnMeta.sortProperty }]);
  }
}

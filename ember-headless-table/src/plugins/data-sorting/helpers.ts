import { meta } from '../-private/base';
import { Sorting } from './plugin';

import type { Column } from '[public-types]';

/**
 * Query a specific column's current sort direction
 */
export const sortDirection = <DataType = unknown>(column: Column<DataType>) => meta.forColumn(column, Sorting).sortDirection;

/**
 * Ask if a column is sortable
 */
export const isSortable = <DataType = unknown>(column: Column<DataType>) => meta.forColumn(column, Sorting).isSortable;

/**
 * Ask if a column is ascending
 */
export const isAscending = <DataType = unknown>(column: Column<DataType>) => meta.forColumn(column, Sorting).isAscending;

/**
 * Ask if a column is sorted descending
 */
export const isDescending = <DataType = unknown>(column: Column<DataType>) => meta.forColumn(column, Sorting).isDescending;

/**
 * Ask if a column is not sorted
 */
export const isUnsorted = <DataType = unknown>(column: Column<DataType>) => meta.forColumn(column, Sorting).isUnsorted;

/**
 * Sort the specified column's data using a tri-toggle.
 *
 * States go in this order:
 *   Ascending => None => Descending
 *    ⬑ ---------- <= ---------- ↲
 */
export const sort = <DataType = unknown>(column: Column<DataType>) => meta.forTable(column.table, Sorting).handleSort(column);

/**
 * Toggle a column between descending and not unsorted states
 */
export const sortDescending = <DataType = unknown>(column: Column<DataType>) =>
  meta.forTable(column.table, Sorting).toggleDescending(column);

/**
 * Toggle a column between ascending and not unsorted states
 */
export const sortAscending = <DataType = unknown>(column: Column<DataType>) =>
  meta.forTable(column.table, Sorting).toggleAscending(column);

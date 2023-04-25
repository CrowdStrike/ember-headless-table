import { htmlSafe } from '@ember/template';

import { meta } from '../-private/base';
import { ColumnResizing } from './plugin';

import type { Column } from '[public-types]';

/**
 * The column actively being resized by the user.
 *
 * Note that during resizing, multiple columns are resized at once,
 * dependending on the boundaries of the resize events.
 *
 * The other columns being resized as a consequence of "this" column will not
 * be marked as isResizing, because this is a user-scoped question:
 *   "Is the user directly resizing this column?"
 */
export const isResizing = (column: Column) => meta.forColumn(column, ColumnResizing).isResizing;

/**
 * Does the column have room to shrink?
 */
export const canShrink = (column: Column) => meta.forColumn(column, ColumnResizing).canShrink;

/**
 * Does the column have a resize handle?
 * The return value of this function can be determined by
 * - if resizing is enabled for the column
 *   - if resizing is enabled for the whole table
 *   - or if we're asking about the first column (resize handles may only be "between" columns)
 */
export const hasResizeHandle = (column: Column) =>
  meta.forColumn(column, ColumnResizing).hasResizeHandle;

/**
 * In this plugin (by default), styles are only applied to the headers automatically.
 * in <Table> UIs, the header cells control the widths of all cells in that column.
 * There are other kinds of tabular-like markup that may want to grab the widths of columns,
 * because The Platform does not manage that automatically (like if divs and roles were used manually)
 *
 * This utility is meant to be applied to the `style` attribute of a particular td-like element.
 */
export const styleStringFor = <DataType = unknown>(
  column: Column<DataType>
): ReturnType<typeof htmlSafe> => {
  let columnMeta = meta.forColumn(column, ColumnResizing);

  let result = '';

  /**
   * Styles are applied regardless of the "table" being resizable or not
   * because in non-<table> UIs, we need to ensure that all cells in a column
   * have the same width
   */
  for (let [key, value] of Object.entries(columnMeta.style)) {
    result += `${toStyle(key)}:${value};`;
  }

  result = ';' + result;

  return htmlSafe(result);
};

/**
 * the JS API for styles is camel case,
 * but CSS is kebab-case. To save on complexity and
 * amount of code, we have a super small conversion function
 * for only the properties relevant to the sticky plugin.
 */
const toStyle = (key: string): string => {
  switch (key) {
    case 'minWidth':
      return 'min-width';
    default:
      return key;
  }
};

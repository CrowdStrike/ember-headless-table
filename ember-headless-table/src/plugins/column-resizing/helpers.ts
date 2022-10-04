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

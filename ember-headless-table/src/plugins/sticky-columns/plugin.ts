import { cached } from '@glimmer/tracking';
import { assert } from '@ember/debug';

import { BasePlugin, meta, options } from '../-private/base';

import type { Plugin } from '[public-plugin-types]';
import type { Column } from '[public-types]';

interface ColumnOptions {
  /**
   * Whether or not to enable stickiness on the column
   * (default is false)
   *
   * valid values: 'left', 'right', false
   */
  sticky?: boolean | string;
}

interface TableOptions {}

export class StickyColumns
  extends BasePlugin<ColumnMeta, TableMeta, TableOptions, ColumnOptions>
  implements Plugin<ColumnMeta, TableMeta>
{
  name = 'sticky-columns';

  /**
   * This plugin requires that the resizing plugin be present, because the resizing plugin is
   * what manages the base width of the columns.
   *
   * Other width-management plugins can be used instead of ColumnResizing, but they must declare
   * that they manage the width of the columns.
   */
  static requires = ['columnWidth', 'columnVisibility'];

  meta = {
    table: TableMeta,
    column: ColumnMeta,
  };
}

/**
 * @private
 *
 * Contains state and behaviors for the sticiness
 */
export class ColumnMeta {
  constructor(private column: Column) {}

  get isSticky() {
    return this.position !== 'none';
  }

  get position(): 'left' | 'right' | 'none' {
    let sticky = options.forColumn(this.column, StickyColumns)?.sticky;

    assert(
      `Invalid sticky value, ${sticky}. Valid values: 'left', 'right', false`,
      sticky === 'left' || sticky === 'right' || sticky === false
    );

    return sticky || 'none';
  }

  @cached
  get offset() {
    if (!this.isSticky) {
      return;
    }

    let visiblility = meta.withFeature.forTable(this.column.table, 'columnVisibility');

    if (this.position === 'left') {
      let leftColumns = visiblility.columnsBefore(this.column);
      let left = leftColumns.reduce((acc, column) => {
        let columnMeta = meta.withFeature.forColumn(column, 'columnWidth');

        if (hasWidth(columnMeta)) {
          return acc + (columnMeta.width ?? 0);
        }

        return acc;
      }, 0);

      return `${left}px`;
    }

    if (this.position === 'right') {
      let rightColumns = visiblility.columnsAfter(this.column);
      let right = rightColumns.reduce((acc, column) => {
        let columnMeta = meta.withFeature.forColumn(column, 'columnWidth');

        if (hasWidth(columnMeta)) {
          return acc + (columnMeta.width ?? 0);
        }

        return acc;
      }, 0);

      return `${right}px`;
    }

    return;
  }

  get style() {
    if (this.isSticky) {
      return `postiion: sticky; ${this.position}: ${this.offset}; z-index: 8;`;
    }

    return '';
  }
}

function hasWidth(obj: any): obj is { width?: number } {
  return typeof obj === 'object' && obj && 'width' in obj;
}

/* This Plugin does not need table state */
export class TableMeta {}

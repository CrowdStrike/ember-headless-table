import { cached } from '@glimmer/tracking';
import { assert } from '@ember/debug';

import { BasePlugin, columns, meta, options } from '../-private/base';
import { applyStyles } from '../-private/utils';

import type { ColumnApi } from '[public-plugin-types]';
import type { Column } from '[public-types]';

const DEFAULT_Z_INDEX = '8';

interface ColumnOptions {
  /**
   * Whether or not to enable stickiness on the column
   * (default is false)
   *
   * valid values: 'left', 'right', false
   */
  sticky?: boolean | string;
}

export interface Signature {
  Options: {
    Column: ColumnOptions;
  };
  Meta: {
    Table: TableMeta;
    Column: ColumnMeta;
  };
}

export class StickyColumns extends BasePlugin<Signature> {
  name = 'sticky-columns';

  /**
   * This plugin requires that the resizing plugin be present, because the resizing plugin is
   * what manages the base width of the columns.
   *
   * Other width-management plugins can be used instead of ColumnResizing, but they must declare
   * that they manage the width of the columns.
   */
  static requires = ['columnWidth'];

  meta = {
    table: TableMeta,
    column: ColumnMeta,
  };

  conditionallyRemoveStyles = (element: HTMLElement) => {
    if (element.style.getPropertyValue('position') === 'sticky') {
      element.style.removeProperty('position');
    }

    if (element.style.getPropertyValue('left')) {
      element.style.left = '';
    }

    if (element.style.getPropertyValue('right')) {
      element.style.right = '';
    }

    if (element.style.zIndex === DEFAULT_Z_INDEX) {
      element.style.zIndex = '';
    }
  };

  headerCellModifier = (element: HTMLElement, { column }: ColumnApi) => {
    let columnMeta = meta.forColumn(column, StickyColumns);

    if (columnMeta.isSticky) {
      applyStyles(element, columnMeta.style);
    } else {
      this.conditionallyRemoveStyles(element);
    }
  };

  /**
   * Not yet supported. Pending Ember RFC #883
   */
  cellModifier = (element: HTMLElement, { column }: ColumnApi) => {
    let columnMeta = meta.forColumn(column, StickyColumns);

    if (columnMeta.isSticky) {
      applyStyles(element, columnMeta.style);
    } else {
      this.conditionallyRemoveStyles(element);
    }
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
      sticky === 'left' || sticky === 'right' || sticky === false || sticky === undefined
    );

    return sticky || 'none';
  }

  @cached
  get offset() {
    if (!this.isSticky) {
      return;
    }

    if (this.position === 'left') {
      let leftColumns = columns.before(this.column);
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
      let rightColumns = columns.after(this.column);
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

  get style(): Partial<Pick<CSSStyleDeclaration, 'position' | 'left' | 'right' | 'zIndex'>> {
    if (this.isSticky) {
      return {
        position: 'sticky',
        [this.position]: this.offset,
        zIndex: DEFAULT_Z_INDEX,
      };
    }

    return {};
  }
}

function hasWidth(obj: any): obj is { width?: number } {
  return typeof obj === 'object' && obj && 'width' in obj;
}

/* This Plugin does not need table state */
export class TableMeta {}

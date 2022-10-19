import { cached, tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { action } from '@ember/object';

import { BasePlugin, meta, options } from '../-private/base';
import { applyStyles } from '../-private/utils';
import { getAccurateClientHeight, getAccurateClientWidth, totalGapOf } from './utils';

import type { ColumnApi } from '[public-plugin-types]';
import type { Column, Table } from '[public-types]';

export interface ColumnOptions {
  /**
   * Force a starting width
   * This may not be less than the minWidth
   */
  width?: number;
  /**
   * Default: 128px
   */
  minWidth?: number;
  /**
   * Flip if the column is resizable or not.
   * The default is whatever the table's plugin option is set to
   * (and then yet again true, if not set at all)
   */
  isResizable?: boolean;
}

export interface TableOptions {
  /**
   * Toggle whether the table is able to be resized at all
   *
   * default :true
   */
  enabled?: boolean;

  /**
   * By default, each column's "handle" position is on the
   * left-hand side of the column.
   *
   * If, for style-reasons, you want to move it to the right,
   * this option should reflect that so that the calculations can be
   * updated to match the expected behavior of which column(s) grow/shrink
   *
   * Valid values are 'left' or 'right'
   */
  handlePosition?: string;
}

interface Signature {
  Meta: {
    Column: ColumnMeta;
    Table: TableMeta;
  };
  Options: {
    Plugin: TableOptions;
    Column: ColumnOptions;
  };
}

/**
 * One instance of a plugin exists per table
 * but a plugin can have a "Meta" for each column
 */
export class ColumnResizing extends BasePlugin<Signature> {
  name = 'column-resizing';
  static features = ['columnWidth'];

  meta = {
    column: ColumnMeta,
    table: TableMeta,
  };

  headerCellModifier = (element: HTMLElement, { column }: ColumnApi) => {
    let columnMeta = meta.forColumn(column, ColumnResizing);

    element.setAttribute('data-test-is-resizable', `${columnMeta.isResizable}`);

    applyStyles(element, columnMeta.style);
  };

  /**
   * This is what ends up calling resize when the browesr changes
   * (assuming that the containing element's styles stretch to fill the space)
   *
   * Later, when container queries are more broadly supported, we'll want to watch
   * the container instead of the window to prevent unneeded updates (as a window can change
   * size without the container changing size)
   */
  containerModifier = resizeObserver;

  reset() {
    let tableMeta = meta.forTable(this.table, ColumnResizing);

    tableMeta.reset();
  }
}

const DEFAULT_COLUMN_OPTIONS = {
  minWidth: 128,
};

/**
 * @private
 *
 * Contains resizable information for a particular column
 */
export class ColumnMeta {
  constructor(private column: Column) {}

  @tracked _width?: number;
  @tracked isResizing = false;

  get tableMeta() {
    return meta.forTable(this.column.table, ColumnResizing);
  }

  @cached
  get options() {
    let columnOptions = options.forColumn(this.column, ColumnResizing);
    let filteredOptions = Object.entries(columnOptions || {}).reduce((result, [k, v]) => {
      if (v) {
        result[k] = v;
      }

      return result;
    }, {} as Record<string, unknown>) as ColumnOptions;

    return {
      ...DEFAULT_COLUMN_OPTIONS,
      ...filteredOptions,
    };
  }

  get minWidth() {
    return this.options.minWidth;
  }

  get initialWidth() {
    return this.options.width;
  }

  get canShrink() {
    return this.width && this.width > this.minWidth;
  }

  get roomToShrink() {
    return this.width ? this.width - this.minWidth : 0;
  }

  get isResizable() {
    return this.options.isResizable ?? this.tableMeta.isResizable;
  }

  get hasResizeHandle() {
    let visiblility = meta.withFeature.forTable(this.column.table, 'columnVisibility');
    let previous = visiblility.previousColumn(this.column);

    if (!previous) return false;

    return this.isResizable && meta.forColumn(previous, ColumnResizing).isResizable;
  }

  get width() {
    let width = this._width ?? this.initialWidth;

    if (!width) {
      let { defaultColumnWidth } = this.tableMeta;

      width = defaultColumnWidth ? Math.max(defaultColumnWidth, this.minWidth) : this.minWidth;
    }

    return width;
  }

  set width(value) {
    this._width = value;
  }

  get style() {
    let styles: Partial<Pick<CSSStyleDeclaration, 'width' | 'minWidth'>> = {};

    if (this.width) styles.width = `${this.width}px`;
    if (this.minWidth) styles.minWidth = `${this.minWidth}px`;

    return styles;
  }

  @action
  resize(delta: number) {
    this.tableMeta.resizeColumn(this.column, delta);
  }
}

/**
 * @private
 *
 * individual column width must exclude:
 * - padding
 *   - margin
 *   - gap (partial)
 *   - any other positioning offsets
 *
 *   Otherwise the table will infinitely resize itself
 */
function distributeDelta(delta: number, visibleColumns: Column[]) {
  if (delta === 0) return;

  let metas = visibleColumns.map((column) => meta.forColumn(column, ColumnResizing));

  let resizableMetas = metas.filter(
    (meta) => meta.isResizable && (delta < 0 ? meta.canShrink : true)
  );

  let columnDelta = delta / resizableMetas.length;

  for (let meta of resizableMetas) {
    assert('cannot resize a column that does not have a width', meta.width);
    meta.width = Math.max(meta.width + columnDelta, meta.minWidth);
  }
}

/**
 * @private
 *
 * Contains resizable and width information regarding the table as a whole
 */
export class TableMeta {
  constructor(private table: Table) {}

  @tracked scrollContainerHeight?: number;
  @tracked scrollContainerWidth?: number;

  get options() {
    return options.forTable(this.table, ColumnResizing);
  }

  get isResizable() {
    return this.options?.enabled ?? true;
  }

  get defaultColumnWidth() {
    if (!this.scrollContainerWidth) return;

    return (
      (this.scrollContainerWidth - this.totalInitialColumnWidths) /
      this.columnsWithoutInitialWidth.length
    );
  }

  get visibleColumns() {
    let visiblility = meta.withFeature.forTable(this.table, 'columnVisibility');

    return visiblility.visibleColumns;
  }

  get visibleColumnMetas() {
    return this.visibleColumns.map((column) => meta.forColumn(column, ColumnResizing));
  }

  get totalInitialColumnWidths() {
    return this.visibleColumnMetas.reduce((acc, meta) => (acc += meta.initialWidth ?? 0), 0);
  }

  get columnsWithoutInitialWidth() {
    return this.visibleColumnMetas.filter((meta) => !meta.initialWidth);
  }

  get totalVisibleColumnsWidth() {
    return this.visibleColumnMetas.reduce((acc, column) => (acc += column.width ?? 0), 0);
  }

  @action
  reset() {
    if (!this.scrollContainerWidth) return;

    for (let column of this.visibleColumnMetas) {
      column._width = undefined;
    }
  }

  @action
  onTableResize(entry: ResizeObserverEntry) {
    assert('scroll container element must be an HTMLElement', entry.target instanceof HTMLElement);

    this.scrollContainerWidth = getAccurateClientWidth(entry.target);
    this.scrollContainerHeight = getAccurateClientHeight(entry.target);

    // TODO: extract this to card-list and remove it from the plugin
    //       card-list will provide its own column-resizing plugin
    //       by sub-classing this one, and defining its own way of calculating the "diff"
    let totalGap = totalGapOf(entry.target.querySelector('[role="row"]'));
    let diff = this.scrollContainerWidth - this.totalVisibleColumnsWidth - totalGap;

    distributeDelta(diff, this.visibleColumns);
  }

  @action
  resizeColumn(column: Column, delta: number) {
    if (delta === 0) return;

    /**
     * When the delta is negative, we are dragging to the next
     * when positive, we are dragging to the right
     * when dragging to the right, we want to grow the column
     * when dragging to the left, we grow the "next" column,
     * which shrinks the column we're dragging
     *
     * This assumes the resize handle for any column is on the right-hand
     * side of the column header
     *
     * If the resize handle were on the left-hand side of the column header
     * we'd want the column.next to be column.previous
     *
     * This is CSS dependent, and can be configured in plugin
     * options
     */
    let isDraggingRight = delta > 0;
    let position = this.options?.handlePosition ?? 'left';

    let growingColumn: Column | null | undefined;
    let visiblility = meta.withFeature.forTable(this.table, 'columnVisibility');

    if (position === 'right') {
      growingColumn = isDraggingRight ? visiblility.nextColumn(column) : column;
    } else {
      growingColumn = isDraggingRight ? visiblility.previousColumn(column) : column;
    }

    if (!growingColumn) return;

    let growingColumnMeta = meta.forColumn(growingColumn, ColumnResizing);

    assert('cannot resize a column that does not have a width', growingColumnMeta.width);

    let shrinkableColumns =
      delta > 0
        ? visiblility.columnsAfter(growingColumn)
        : visiblility.columnsBefore(growingColumn).reverse();

    let shrinkableColumnsMetas = shrinkableColumns
      .map((column) => meta.forColumn(column, ColumnResizing))
      .filter((meta) => meta.canShrink);

    let remainder = Math.abs(delta);

    while (shrinkableColumnsMetas.length > 0) {
      let shrinkingColumnMeta = shrinkableColumnsMetas.shift();

      assert('cannot resize a column that does not have a width', shrinkingColumnMeta?.width);

      let actualDelta = Math.min(remainder, shrinkingColumnMeta.roomToShrink);

      growingColumnMeta.width += actualDelta;
      shrinkingColumnMeta.width -= actualDelta;
      remainder -= actualDelta;
    }
  }
}

/**
 * @private
 * included in the same file as the plugin due to circular dependency
 *
 * This goes on the containing element
 *
 * @example
 * ```hbs
 *  <div {{resizeObserver @table}}>
 *    <table>
 * ```
 */
function resizeObserver(element: HTMLElement, table: Table) {
  let observer = getObserver(element, table);

  observer.observe(element);

  return () => {
    observer.unobserve(element);
  };
}

let CACHE = new WeakMap<HTMLElement, ResizeObserver>();

/**
 * This is technically "inefficient" as you don't want too many resize
 * observers on a page, but tables are so big, that I don't see too many use cases
 * where you'd have 10+ tables on a page
 */
function getObserver(element: HTMLElement, table: Table): ResizeObserver {
  let existing = CACHE.get(element);

  if (existing) return existing;

  existing = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (let entry of entries) {
      meta.forTable(table, ColumnResizing).onTableResize(entry);
    }
  });

  return existing;
}

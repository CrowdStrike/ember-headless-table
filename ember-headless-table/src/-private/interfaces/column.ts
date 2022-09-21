import type { BasePlugin, Plugin } from '../../plugins';
import type { Column } from '../column';
import type { Row } from '../row';
import type { ComponentLike } from '@glint/template';
import type { Constructor } from 'type-fest';

export interface CellContext<T> {
  column: Column<T>;
  row: Row<T>;
}

type ColumnPluginOption<P = Plugin> = P extends BasePlugin
  ? [Constructor<P>, () => ReturnType<P['getColumnOptions']>]
  : [P | Constructor<P>, () => unknown];

export type CellOptions = Record<string, unknown>;

export interface ColumnConfig<T = unknown> {
  /**
   * the `key` is required for preferences storage, as well as
   * managing uniqueness of the columns in an easy-to-understand way.
   *
   * key may be anything if a `value` is provided, but _should_
   * be a property-path on each data object passed to the table.
   *
   * @example `someObj.property.path`
   * @example `someProperty`
   */
  key: string;

  /**
   * Optionally provide a function to determine the value of a row at this column
   */
  value?: (context: CellContext<T>) => unknown;

  /**
   * Recommended property to use for custom components for each cell per column.
   * Out-of-the-box, this property isn't used, but the provided type may be
   * a convenience for consumers of the headless table
   */
  Cell?: ComponentLike;

  /**
   * The name or title of the column, shown in the column heading / th
   */
  name?: string;

  /**
   * Bag of extra properties to pass to Cell via `@options`, if desired
   */
  options?: (context: CellContext<T>) => CellOptions;

  /**
   * Each plugin may provide column options, and provides similar syntax to how
   * options for the table are specified in the plugins entry,
   *
   * ```js
   * pluginOptions: [
   *   ColumnVisibility.forColumn(() => ({ isVisible: false })),
   *   StickyColumns.forColumn(() => ({ sticky: 'right' })),
   * ],
   * ```
   */
  pluginOptions?: ColumnPluginOption[];
}

export type ColumnKey<T> = NonNullable<ColumnConfig<T>['key']>;

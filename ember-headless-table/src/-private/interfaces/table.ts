import type { Plugins } from '../../plugins/-private/utils';
import type { ColumnConfig } from './column';
import type { Pagination } from './pagination';
import type { PreferencesAdapter } from './preferences';
import type { Selection } from './selection';

export interface TableMeta {
  totalRowCount?: number;
  totalRowsSelectedCount?: number;
}

export interface TableConfig<DataType> {
  /**
   * Configuration describing how the table will crawl through `data`
   * and render it. Within this `columns` config, there will also be opportunities
   * to set the behavior of columns when rendered
   */
  columns: () => ColumnConfig<DataType>[];
  /**
   * The data to render, as described via the `columns` option.
   *
   * This data may or may not match the shape requested by the columns configuration.
   * When a key-value pair matches what a column config requests, the data will be rendered.
   * When a key-value pair is misisng, a fallback or empty representation of a value will be
   * shown instead.
   */
  data: () => DataType[];

  /**
   * A collection of plugins for use in extending table behavior.
   * plugins have a collection of hooks and properties to use, but for anything
   * requiring user interaction there will be manual connecting.
   *
   * The instance for each plugin can be accessed via HeadlessTable's `pluginOf(<Plugin>)`
   * method, where it takes the plugin constructor/class/object for lookup purposes.
   *
   * Some plugins may require setting options for hooking into behavior
   * provided by the plugin (for example sorting).
   *
   * Example:
   * ```js
   * import { DataSorting } from '@crowdstrike/ember-headless-table/plugins/data-sorting';
   * import { ColumnResizing }  from '@crowdstrike/ember-headless-table/plugins/column-resizing';
   *
   *  ...
   *
   *  plugins: [
   *    DataSorting.with(() => {
   *      return {
   *        sorts: [array of sorts],
   *        onSort: this.doThingWhenSortsChange,
   *      };
   *    }),
   *    ColumnResizing.with(() => {
   *      return {
   *        enabled: true,
   *      }
   *    }),
   *  ]
   * ```
   *
   * However, for plugins with no needed options, the list can be simplified:
   * ```js
   * import { ColumnResizing }  from '@crowdstrike/ember-headless-table/plugins/column-resizing';
   * import { StickyColumns }  from '@crowdstrike/ember-headless-table/plugins/sticky-columns';
   *
   *  ...
   *
   *  plugins: [
   *    ColumnResizing,
   *    StickyColumns,
   *  ]
   * ```
   */
  plugins?: Plugins;

  // Bulk selection plugin?
  //   - maybe for providing each row with a checkbox, and some hooks for interacting with
  //     a potential pagination plugin
  bulkSelection?: Selection;
  isCheckboxSelectable?: boolean;

  // Row selection plugin?
  //   - maybe for clicking on a row to open a side panel?
  isRowSelectable?: boolean;
  rowSelection?: () => DataType;
  onRowSelectionChange?: (selection: DataType | undefined) => void;

  // Uncategorized
  meta?: TableMeta;
  pagination?: Pagination;

  /**
   * Foundational to tables is how to store settings within them.
   * The `key` is meant to identify a particular kind of table. For example, if
   * you have a table representing "blog posts", your table key may be "blog-posts".
   *
   * And most importantly, the `adapter` is how you load and save the preferences.
   * This may bo to local storage, or some API.
   */
  preferences?: {
    /**
     * What to name the table in the preferences storage of your choice.
     * Any string is valid provided that the storage adapter of your choice supports
     * the format.
     *
     * For example, if you have a table of "blog posts", the preferences key might be
     * `"all-blog-posts"`
     */
    key: string;
    /**
     * Configuration for how you wish to `persist` and `restore` the configuration for your table.
     *
     * `persist` may be async as it is a fire-and-forget type of action.
     *
     * However, `restore` must be synchronous, as this is a blocking operation for rendering the table.
     * So it's best to load up the table preferences before rendering a table.
     */
    adapter?: PreferencesAdapter;
  };
}

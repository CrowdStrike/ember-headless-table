import type { Column, Table } from '[public-types]';
import type { Destructor } from '#interfaces';
import type { Constructor } from 'type-fest';

type DataTypeOf<T> = T extends Table<infer DataType> ? DataType : T;

export interface ColumnApi<T extends Table = Table> {
  column: Column<DataTypeOf<T>>;
  table: T;
}

/**
 * @public
 *
 * Table plugins are stateless objects that optionally provide hooks based on what
 * the plugin wishes to modify.
 *
 * A Plugin may either be a class or plain object
 *
 * If state is desired, Metadata classes may be provided to manage that state.
 * As a convenience, when the meta classes are instantiated, they'll be given the same
 * `owner` as everything else in the application, so service injection will be available
 * within the meta class instances.
 *
 * A plugin can provide components that the consuming Table can opt in to rendering.
 * (though, often these components will be required to be rendered for the plugin to work)
 *
 * a `Plugin` has three type arguments:
 * - `ColumnMeta` - optional state for storing and managing information per column
 * - `TableMeta` - optional state for storing and managing information about the table
 *
 *   Any particular plugin instantiation will have at most 1 instance of their TableMeta
 *   and `n` instances of their ColumnMeta, where `n` is at most the number of columns.
 */
export interface Plugin<ColumnMeta = unknown, TableMeta = unknown> {
  /**
   * Unique name for the plugin.
   * - only one plugin of the same name is allowed
   * - the name is used for storing preferences / serializable information
   */
  name: string;

  /**
   * Some plugins may require that other plugins be present.
   * and because plugins can be interchangeable, the features implemented
   * by those plugins must be declared via strings so that we can have
   * a semi-stable reference that isn't tied to object equality or anything like that.
   *
   * This enables, for example, the StickyColumns plugin to work with different implementations of the ColumnResizing plugin (such as one
   * might have between an aria-grid and a data table)
   */
  features?: string[];

  /**
   * List of features to lookup "somewhere" in the list of plugins
   * order does not matter.
   */
  requires?: string[];

  /**
   * Optional state that this plugin may or may not choose to use
   *
   * columns will each have an instance of meta.column.
   * the table will have only one instance of meta.table.
   */
  meta?: {
    /**
     * @public
     *
     * Specifies the class definition to use for storing column-related state / behavior for this plugin
     */
    column?: Constructor<ColumnMeta>;

    /**
     * @public
     *
     * Specifies the class definition to use for storing table-related state / behavior for this plugin
     */
    table?: Constructor<TableMeta>;
  };

  /**
   * @public
   * @kind Column property
   *
   * Specify a modifier setup/teardown function to attach to each of the header cells
   *
   * Can be used to add / remove attributes, event listeners, etc
   */
  headerCellModifier?: (
    element: HTMLElement,
    ...args: [ColumnApi<Table<any>>]
  ) => void | Destructor;

  /**
   * @public
   * @kind Table hook
   *
   * Specify a modifier setup/teardown function to attach to the table's containing element
   */
  containerModifier?: (element: HTMLElement, ...args: [Table<any>]) => void | Destructor;

  /**
   * @public
   * @kind Table Hook
   *
   * If the plugin has state, this should be used to reset that state
   */
  reset?: () => void;

  /**
   * @public
   * @kind Table Hook
   *
   * Called when a column's visibility is toggled
   */
  onColumnsChange?: <T extends Table<any>>(table: T) => void;
}

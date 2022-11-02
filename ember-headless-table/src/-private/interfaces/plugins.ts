/**
 * NOTE:
 *  Empty, EmptyObject, and GetOrElse are copied from @glimmer/component
 */

import type { Constructor } from '[private-types]';
import type { Column, Row, Table } from '[public-types]';
import type { Destructor } from '#interfaces';

type DataTypeOf<T> = T extends Table<infer DataType> ? DataType : T;

/**
 * @private utility class
 *
 * This class exists because there isn't a way to, in TS,
 * get access to static properties from an instance type
 */
export type PluginClass<PluginType> = PluginType & {
  new: (...args: unknown[]) => PluginType;
  features?: string[];
  requires?: string[];
};

export type PluginSubclassInstance<PluginType> = PluginType & {
  constructor: PluginClass<PluginType>;
};

/**
 * @public
 *
 * The data passed to a plugin's column APIs
 */
export interface ColumnApi<T extends Table = Table> {
  column: Column<DataTypeOf<T>>;
  table: T;
}

/**
 * @public
 *
 * The data passed to a plugin's row APIs
 */
export interface RowApi<T extends Table = Table> {
  row: Row<DataTypeOf<T>>;
  table: T;
}

/**
 * @private utility type
 *
 * Note that this exists here, and the Plugin interface exists in general
 * because we need to derive types in a static context on BasePlugin,
 * and the source of types need to exist somewhere other than BasePlugin,
 * so that:
 * - inference will work
 * - we avoid infinite recursive type definitions
 */
export type SignatureFrom<Klass extends Plugin<any>> = Klass extends Plugin<infer Signature>
  ? Signature
  : never;

/**
 * @public
 *
 * Table plugins are stateless objects that optionally provide hooks based on what
 * the plugin wishes to modify.
 *
 * If state is desired, Metadata classes may be provided to manage that state.
 * As a convenience, when the meta classes are instantiated, they'll be given the same
 * `owner` as everything else in the application, so service injection will be available
 * within the meta class instances.
 *
 * A plugin can provide components that the consuming Table can opt in to rendering.
 * (though, often these components will be required to be rendered for the plugin to work)
 *
 * a `Plugin` has one type argument:
 * - Signature - which can provide optional information about the Meta/State and Options the plugin can take
 *
 *   Any particular plugin instantiation will have at most 1 instance of their TableMeta
 *   and `n` instances of their ColumnMeta, where `n` is at most the number of columns.
 */
export interface Plugin<Signature = unknown> {
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
    column?: Constructor<ColumnMetaFor<Signature>>;

    /**
     * @public
     *
     * Specifies the class definition to use for storing table-related state / behavior for this plugin
     */
    table?: Constructor<TableMetaFor<Signature>>;

    /**
     * @public
     *
     * Specifies the class definition to use for storing the row-related state / behavior for this plugin
     */
    row?: Constructor<RowMetaFor<Signature>>;
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
   * @kind Row property
   *
   * Specify a modifier setup/teardown function to attach to each of the rows
   *
   * Can be used to add / remove attributes, event listeners, etc
   */
  rowModifier?: (element: HTMLElement, ...args: [RowApi<Table<any>>]) => void | Destructor;

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
   * A plugin may change the columns order, visibility, etc.
   * By implementing this getter, this plugin's
   * `columns` property will be used by other plugins via
   * the `columns.for(table, RequestingPlugin)` api.
   *
   * For the end-consumer, they may choose to do
   * `columns.for(table)`, which will aggregate all column modifications
   * from all plugins.
   *
   * As always, `table.columns` is the way to get the unmodified list of columns.
   */
  columns?: Column<any>[];
}

/**
 * @private utility type
 */
type GetOrElse<Obj, K, Fallback> = K extends keyof Obj ? Obj[K] : Fallback;

/**
 * @public
 *
 * utility class to help with autocompletion / documentation
 * in the editor while while defining the signature of custom plugins.
 */
export interface PluginSignature {
  /**
   * Meta is how plugins can manage per-{table,columns,rows}
   * state, event listeners, and general public API
   */
  Meta?: {
    /**
     * If a plugin has Table meta/state,
     * the shape of that state can be described here
     */
    Table?: unknown;
    /**
     * If a plugin has Column meta/state,
     * the shape of that state can be described here
     */
    Column?: unknown;
    /**
     * If a plugin has Row meta/state,
     * the shape of that state can be described here
     */
    Row?: unknown;
  };
  Options?: {
    /**
     * If a plugin has options configurable for the whole table,
     * those can be specified here.
     *
     * These are passed via the the `withOptions` API
     *
     * ```js
     * headlessTable(this?, {
     *   // ...
     *   plugins: [
     *     MyPlugin.withOptions(() => {
     *       // the return value here is this is Signature['Options']['Plugin']
     *       return {};
     *     })
     *   ]
     * })
     * ```
     */
    Plugin?: unknown;
    /**
     * If a plugin has options configurable per column,
     * those can be specified here
     *
     * These are passed via the the `forColumn` API
     *
     * ```js
     * headlessTable(this?, {
     *   // ...
     *   columns: () => [
     *     MyPlugin.forColumn(() => {
     *       // the return value here is this is Signature['Options']['Column']
     *       return {};
     *     })
     *   ]
     * })
     * ```
     */
    Column?: unknown;
  };
}

/**
 * @private default type
 *
 * Describes the shape of all the dynamic parts of a Plugin.
 *
 * There are no row options, because rows are not statically configurable.
 */
export interface DefaultPluginSignature {
  Meta: {
    Row: unknown;
    Column: unknown;
    Table: unknown;
  };
  Options: {
    Plugin: unknown;
    Column: unknown;
  };
}

/**
 * @private utility type
 */
export type TableMetaFor<Signature> = Signature extends { Meta: { Table: unknown } }
  ? GetOrElse<Signature['Meta'], 'Table', never>
  : never;

/**
 * @private utility type
 */
export type ColumnMetaFor<Signature> = Signature extends { Meta: { Column: unknown } }
  ? GetOrElse<Signature['Meta'], 'Column', never>
  : never;

/**
 * @private utility type
 */
export type RowMetaFor<Signature> = Signature extends { Meta: { Row: unknown } }
  ? GetOrElse<Signature['Meta'], 'Row', never>
  : never;

/**
 * @private utility type
 */
export type OptionsFor<Signature> = Signature extends { Options: object }
  ? GetOrElse<Signature['Options'], 'Plugin', EmptyObject>
  : EmptyObject;

/**
 * @private utility type
 */
export type ColumnOptionsFor<Signature> = Signature extends { Options: object }
  ? GetOrElse<Signature['Options'], 'Column', EmptyObject>
  : EmptyObject;

// Type-only "symbol" to use with `EmptyObject` below, so that it is *not*
// equivalent to an empty interface.
declare const Empty: unique symbol;

/**
 * This provides us a way to have a "fallback" which represents an empty object,
 * without the downsides of how TS treats `{}`. Specifically: this will
 * correctly leverage "excess property checking" so that, given a component
 * which has no named args, if someone invokes it with any named args, they will
 * get a type error.
 *
 * @internal This is exported so declaration emit works (if it were not emitted,
 *   declarations which fall back to it would not work). It is *not* intended for
 *   public usage, and the specific mechanics it uses may change at any time.
 *   The location of this export *is* part of the public API, because moving it
 *   will break existing declarations, but is not legal for end users to import
 *   themselves, so ***DO NOT RELY ON IT***.
 */
export type EmptyObject = { [Empty]?: true };

import { assert } from '@ember/debug';

import { COLUMN_META_KEY, ROW_META_KEY, TABLE_KEY, TABLE_META_KEY } from '../../-private/table';
import { normalizePluginsConfig } from './utils';

import type { Table } from '../../-private/table';
import type { ColumnReordering } from '../column-reordering';
import type { ColumnVisibility } from '../column-visibility';
import type { Class, Constructor } from '[private-types]';
import type { Column, Row } from '[public-types]';
import type {
  ColumnMetaFor,
  ColumnOptionsFor,
  OptionsFor,
  Plugin,
  RowMetaFor,
  TableMetaFor,
} from '#interfaces';

type InstanceOf<T> = T extends Class<infer Instance> ? Instance : T;

/**
 * @public
 *
 * list of interfaces by feature name that consumers may provide alternative
 * implementation for
 */
export interface TableFeatures extends Record<string, unknown | undefined> {
  /**
   * @public
   *
   * interface for the table meta of a "column visibility plugin"
   */
  columnVisibility: InstanceOf<ColumnVisibility['meta']['table']>;
  /**
   * @public
   *
   * interface for the table meta of a "column order plugin"
   */
  columnOrder: InstanceOf<ColumnReordering['meta']['table']>;
}

/**
 * @public
 *
 * list of interfaces by feature name that consumers may provide alternative
 * implementation for
 */
export interface ColumnFeatures extends Record<string, unknown | undefined> {
  /**
   * @public
   *
   * interface for the column meta of a "column visibility plugin"
   */
  columnVisibility: InstanceOf<ColumnVisibility['meta']['column']>;
  /**
   * @public
   *
   * interface for the column meta of a "column order plugin"
   */
  columnOrder: InstanceOf<ColumnReordering['meta']['column']>;
}

/**
 * @private utility type
 *
 */
export type SignatureFrom<Klass extends BasePlugin<any>> = Klass extends BasePlugin<infer Signature>
  ? Signature
  : never;

declare const __Signature__: unique symbol;

/**
 * @public
 *
 * If your table plugin is a class, you may extend from BasePlugin, which provides
 * small utility methods and properties for getting the metadata for your plugin
 * for the table and each column
 *
 * One instance of a plugin exists per table
 */
export abstract class BasePlugin<Signature = unknown> implements Plugin<Signature> {
  constructor(protected table: Table) {}

  /**
   * @private (secret)
   *
   * Because classes are kind of like interfaces,
   * we need "something" to help TS know what a Resource is.
   *
   * This isn't a real API, but does help with type inference
   * with the SignatureFrom utility above
   */
  declare [__Signature__]: Signature;

  /**
   * Helper for specifying plugins on `headlessTable` with the plugin-level options
   */
  static with<T extends BasePlugin<any>>(
    this: Constructor<T>,
    configFn: () => OptionsFor<SignatureFrom<T>>
  ): [Constructor<T>, () => OptionsFor<SignatureFrom<T>>] {
    return [this, configFn];
  }

  /**
   * Helper for specifying column-level configurations for a plugin on `headlessTable`'s
   * columns option
   */
  static forColumn<T extends BasePlugin<any>>(
    this: Constructor<T>,
    configFn: () => ColumnOptionsFor<SignatureFrom<T>>
  ): [Constructor<T>, () => ColumnOptionsFor<SignatureFrom<T>>] {
    return [this, configFn];
  }

  declare meta?: {
    column?: Constructor<ColumnMetaFor<Signature>>;
    table?: Constructor<TableMetaFor<Signature>>;
    row?: Constructor<RowMetaFor<Signature>>;
  };

  abstract name: string;
  static features?: string[];
  static requires?: string[];
}

/**
 * @public
 *
 * returns boolean if the passed table has an instance of the configured passed plugin class.
 * This can be used to help guard against accessing public-specific APIs if those plugins
 * are not configured for a particular table instance
 */
export function hasPlugin<P extends BasePlugin<any>, Data = unknown>(
  table: Table<Data>,
  klass: Class<P>
) {
  return Boolean(table.pluginOf(klass));
}

export const preferences = {
  /**
   * @public
   *
   * returns an object for getting and setting preferences data
   * based on the column (scoped to key)
   *
   * Only the provided plugin will have access to these preferences
   * (though, if other plugins can guess how the underlying plugin access
   * works, they can access this data, too. No security guaranteed)
   */
  forColumn<P extends BasePlugin<any>, Data = unknown>(column: Column<Data>, klass: Class<P>) {
    return {
      /**
       * delete an entry on the underlying `Map` used for this column-plugin pair
       */
      delete(key: string) {
        let prefs = column.table.preferences;
        let existing = prefs.storage.forPlugin(klass.name);
        let columnPrefs = existing.forColumn(column.key);

        columnPrefs.delete(key);

        return prefs.persist();
      },
      /**
       * get an entry on the underlying `Map` used for this column-plugin pair
       */
      get(key: string) {
        let prefs = column.table.preferences;
        let existing = prefs.storage.forPlugin(klass.name);
        let columnPrefs = existing.forColumn(column.key);

        return columnPrefs.get(key);
      },
      /**
       * set an entry on the underlying `Map` used for this column-plugin pair
       */
      set(key: string, value: unknown) {
        let prefs = column.table.preferences;
        let existing = prefs.storage.forPlugin(klass.name);
        let columnPrefs = existing.forColumn(column.key);

        columnPrefs.set(key, value);

        prefs.persist();
      },
    };
  },

  /**
   * @public
   *
   * returns an object for bulk updating preferences data
   * for all columns (scoped to key and table)
   */
  forAllColumns<P extends BasePlugin<any>, Data = unknown>(table: Table<Data>, klass: Class<P>) {
    return {
      /**
       * delete an entry on every column in the underlying column `Map` for this table-plugin pair
       */
      delete(key: string) {
        let tablePrefs = table.preferences;

        for (let column of table.columns) {
          let prefs = column.table.preferences;
          let existing = prefs.storage.forPlugin(klass.name);
          let columnPrefs = existing.forColumn(column.key);

          columnPrefs.delete(key);
        }

        return tablePrefs.persist();
      },
    };
  },

  /**
   * @public
   *
   * returns an object for getting and setting preferences data
   * based on the table (scoped to the key: "table")
   *
   * Only the provided plugin will have access to these preferences
   * (though, if other plugins can guess how the underlying plugin access
   * works, they can access this data, too. No security guaranteed)
   */
  forTable<P extends BasePlugin<any>, Data = unknown>(table: Table<Data>, klass: Class<P>) {
    return {
      /**
       * delete an entry on the underlying `Map` used for this table-plugin pair
       */
      delete(key: string) {
        let prefs = table.preferences;
        let existing = prefs.storage.forPlugin(klass.name);

        existing.table.delete(key);

        return prefs.persist();
      },
      /**
       * get an entry on the underlying `Map` used for this table-plugin pair
       */
      get(key: string) {
        let prefs = table.preferences;
        let existing = prefs.storage.forPlugin(klass.name);

        return existing.table.get(key);
      },
      /**
       * set an entry on the underlying `Map` used for this table-plugin pair
       */
      set(key: string, value: unknown) {
        let prefs = table.preferences;
        let existing = prefs.storage.forPlugin(klass.name);

        existing.table.set(key, value);

        return prefs.persist();
      },
    };
  },
};

/**
 * if a `requester` is not provided,
 * Get the columns for the table, considering any and all plugins that could modify columns.
 *
 * If you are an end-consumer of ember-headless-table, this is the function to use.
 * If you are a plugin-author, you'll want to pass your plugin class as the second parameter.
 *
 * For a given plugin, `requester`, determine what columns should be returned.
 * Since multiple plugins could be used in a table, there is an implicit hierarchy of
 * column modifications that can occur from each of those plugins.
 *
 * If a plugin defines other plugins as either *requirements* or *optional requirements*,
 * and that upstream plugin defines a `columns` property, then those columns will be returned here.
 *
 * This works recursively up the plugin tree up until a plugin has no requirements, and then
 * all columns from the table are returned.
 */
function columnsFor<DataType = any>(
  table: Table<DataType>,
  requester?: Plugin<any> | undefined
): Column<DataType>[] {
  assert(`First argument passed to columns.for must be an instance of Table`, table[TABLE_KEY]);

  let visibility = findPlugin(table.plugins, 'columnVisibility');
  let reordering = findPlugin(table.plugins, 'columnOrder');
  let sizing = findPlugin(table.plugins, 'columnResizing');

  // TODO: actually resolve the graph, rather than use the hardcoded feature names
  //       atm, this only "happens" to work based on expectations of
  //       of the currently implemented plugins' capabilities and implied hierarchy.

  if (requester) {
    assert(
      `[${requester.name}] requested columns from the table, but the plugin, ${requester.name}, ` +
        `is not used in this table`,
      table.plugins.some((plugin) => plugin instanceof (requester as Class<Plugin>))
    );

    if (sizing && sizing.constructor === requester) {
      return table.columns.values();
    }

    if (visibility && visibility.constructor === requester) {
      return table.columns.values();
    }

    if (reordering && reordering.constructor === requester) {
      if (visibility) {
        assert(
          `<#${visibility.name}> defined a 'columns' property, but did not return valid data.`,
          visibility.columns && Array.isArray(visibility.columns)
        );

        return visibility.columns;
      }

      return table.columns.values();
    }

    if (reordering) {
      assert(
        `<#${reordering.name}> defined a 'columns' property, but did not return valid data.`,
        reordering.columns && Array.isArray(reordering.columns)
      );

      return reordering.columns;
    }

    if (visibility) {
      assert(
        `<#${visibility.name}> defined a 'columns' property, but did not return valid data.`,
        visibility.columns && Array.isArray(visibility.columns)
      );

      return visibility.columns;
    }

    if (sizing) {
      assert(
        `<#${sizing.name}> defined a 'columns' property, but did not return valid data.`,
        sizing.columns && Array.isArray(sizing.columns)
      );

      return sizing.columns;
    }

    return table.columns.values();
  }

  /**
   * This flow is the inverse of when we have a requester
   */

  if (reordering) {
    assert(
      `<#${reordering.name}> defined a 'columns' property, but did not return valid data.`,
      reordering.columns && Array.isArray(reordering.columns)
    );

    return reordering.columns;
  }

  if (visibility) {
    assert(
      `<#${visibility.name}> defined a 'columns' property, but did not return valid data.`,
      visibility.columns && Array.isArray(visibility.columns)
    );

    return visibility.columns;
  }

  if (sizing) {
    assert(
      `<#${sizing.name}> defined a 'columns' property, but did not return valid data.`,
      sizing.columns && Array.isArray(sizing.columns)
    );

    return sizing.columns;
  }

  return table.columns.values();
}

export const columns = {
  for: columnsFor,

  /**
   * for a given current or reference column, return the column that
   * is immediately next, or to the right of that column.
   *
   * If a plugin class is provided, the hierarchy of column list modifications
   * will be respected.
   */
  next: <Data = unknown>(
    current: Column<Data>,
    requester?: Plugin<any>
  ): Column<Data> | undefined => {
    let columns = requester ? columnsFor(current.table, requester) : columnsFor(current.table);

    let referenceIndex = columns.indexOf(current);

    assert(
      `index of reference column must be >= 0. column likely not a part of the table`,
      referenceIndex >= 0
    );

    /**
     * There can be nothing after the last column
     */
    if (referenceIndex >= columns.length - 1) {
      return undefined;
    }

    return columns[referenceIndex + 1];
  },

  /**
   * for a given current or reference column, return the column that
   * is immediately previous, or to the left of that column.
   *
   * If a plugin class is provided, the hierarchy of column list modifications
   * will be respected.
   */
  previous: <Data = unknown>(
    current: Column<Data>,
    requester?: Plugin<any>
  ): Column<Data> | undefined => {
    let columns = requester ? columnsFor(current.table, requester) : columnsFor(current.table);
    let referenceIndex = columns.indexOf(current);

    assert(
      `index of reference column must be >= 0. column likely not a part of the table`,
      referenceIndex >= 0
    );

    /**
     * There can be nothing before the first column
     */
    if (referenceIndex === 0) {
      return undefined;
    }

    return columns[referenceIndex - 1];
  },
  /**
   * for a given current or reference column, return the columns that
   * should appear before, or to the left of that column.
   *
   * if a plugin class is provided, the hierarchy of column list modifications
   * will be respected.
   */
  before: <Data = unknown>(current: Column<Data>, requester?: Plugin<any>): Column<Data>[] => {
    let columns = requester ? columnsFor(current.table, requester) : columnsFor(current.table);

    let referenceIndex = columns.indexOf(current);

    return columns.slice(0, referenceIndex);
  },
  /**
   * for a given current or reference column, return the columns that
   * should appear after, or to the right of that column.
   *
   * if a plugin class is provided, the hierarchy of column list modifications
   * will be respected.
   */
  after: <Data = unknown>(current: Column<Data>, requester?: Plugin<any>): Column<Data>[] => {
    let columns = requester ? columnsFor(current.table, requester) : columnsFor(current.table);

    let referenceIndex = columns.indexOf(current);

    return columns.slice(referenceIndex + 1);
  },
};

export const meta = {
  /**
   * @public
   *
   * For a given column and plugin, return the meta / state bucket for the
   * plugin<->column instance pair.
   *
   * Note that this requires the column instance to exist on the table.
   */
  forColumn<P extends BasePlugin<any>, Data = unknown>(
    column: Column<Data>,
    klass: Class<P>
  ): ColumnMetaFor<SignatureFrom<P>> {
    let columnMeta = column.table[COLUMN_META_KEY];

    return getPluginInstance(columnMeta, column, klass, () => {
      let plugin = column.table.pluginOf(klass);

      assert(`[${klass.name}] cannot get plugin instance of unregistered plugin class`, plugin);
      assert(`<#${plugin.name}> plugin does not have meta specified`, plugin.meta);
      assert(`<#${plugin.name}> plugin does not specify column meta`, plugin.meta.column);

      return new plugin.meta.column(column);
    });
  },

  /**
   * @public
   *
   * For a given row and plugin, return the meta / state bucket for the
   * plugin<->row instance pair.
   *
   * Note that this requires the row instance to exist on the table.
   */
  forRow<P extends BasePlugin<any>, Data = unknown>(
    row: Row<Data>,
    klass: Class<P>
  ): RowMetaFor<SignatureFrom<P>> {
    let rowMeta = row.table[ROW_META_KEY];

    return getPluginInstance(rowMeta, row, klass, () => {
      let plugin = row.table.pluginOf(klass);

      assert(`[${klass.name}] cannot get plugin instance of unregistered plugin class`, plugin);
      assert(`<#${plugin.name}> plugin does not have meta specified`, plugin.meta);
      assert(`<#${plugin.name}> plugin does not specify row meta`, plugin.meta.row);

      return new plugin.meta.row(row);
    });
  },

  /**
   * @public
   *
   * For a given table and plugin, return the meta / state bucket for the
   * plugin<->table instance pair.
   */
  forTable<P extends BasePlugin<any>, Data = unknown>(
    table: Table<Data>,
    klass: Class<P>
  ): TableMetaFor<SignatureFrom<P>> {
    let tableMeta = table[TABLE_META_KEY];

    return getPluginInstance(tableMeta, klass, () => {
      let plugin = table.pluginOf(klass);

      assert(`[${klass.name}] cannot get plugin instance of unregistered plugin class`, plugin);
      assert(`<#${plugin.name}> plugin does not have meta specified`, plugin.meta);
      assert(`<#${plugin.name}> plugin does not specify table meta`, plugin.meta.table);
      assert(
        `<#${plugin.name}> plugin already exists for the table. ` +
          `A plugin may only be instantiated once per table.`,
        ![...tableMeta.keys()].includes(klass)
      );

      return new plugin.meta.table(table);
    });
  },

  /**
   * Instead of finding meta based on column or table instances,
   * you can search for meta based on feature strings, such as `columnWidth`
   */
  withFeature: {
    /**
     * @public
     *
     * for a given column and feature name, return the "ColumnMeta" for that feature.
     * This is useful when plugins may depend on one another but may not necessarily care which
     * plugin is providing what behavior.
     *
     * For example, multiple column-focused plugins may care about width or visibility
     */
    forColumn<FeatureName extends string, Data = unknown>(
      column: Column<Data>,
      featureName: FeatureName
    ): ColumnFeatures[FeatureName] {
      let { plugins } = column.table;

      let provider = findPlugin(plugins, featureName);

      assert(
        `Could not find plugin with feature: ${featureName}. ` +
          `Available features: ${availableFeatures(plugins)}`,
        provider
      );

      // TS doesn't believe in the constructor property?
      return meta.forColumn(column, (provider as any).constructor);
    },

    /**
     * @public
     *
     * for a given table and feature name, return the "TableMeta" for that feature.
     * This is useful when plugins may depend on one another but may not necessarily care
     * which plugin is providing that behavior.
     *
     * For example, multiple column-focused plugins may care about width or visibility.
     */
    forTable<FeatureName extends string, Data = unknown>(
      table: Table<Data>,
      featureName: FeatureName
    ): TableFeatures[FeatureName] {
      let { plugins } = table;

      let provider = findPlugin(plugins, featureName);

      assert(
        `Could not find plugin with feature: ${featureName}. ` +
          `Available features: ${availableFeatures(plugins)}`,
        provider
      );

      // TS doesn't believe in the constructor property?
      return meta.forTable(table, (provider as any).constructor);
    },
  },
};

function findPlugin(plugins: Plugin[], featureName: string) {
  let provider = plugins.find((plugin) => {
    /*
     * have to cast in order to get static properties, but we may not have a base plugin
     * so we must rely on nullish coalesting to protect from throwing exceptions
     *
     * (Plugin || BasePlugin).features)
     */
    let features = plugin.features || (plugin.constructor as typeof BasePlugin).features;

    return features?.includes(featureName);
  });

  return provider;
}

function availableFeatures(plugins: Plugin[]): string {
  let allFeatures = plugins
    .map((plugin) => {
      /*
       * have to cast in order to get static properties, but we may not have a base plugin
       * so we must rely on nullish coalesting to protect from throwing exceptions
       *
       * (Plugin || BasePlugin).features)
       */
      let features = plugin.features || (plugin.constructor as typeof BasePlugin).features;

      return features;
    })
    .flat()
    .filter(Boolean);

  return allFeatures.length > 0 ? allFeatures.join(', ') : '[none]';
}

export const options = {
  /**
   * @public
   *
   * For a given table and plugin, return the options, if any were given from the user
   * during construction of the table.
   */
  forTable<P extends BasePlugin<any>, Data = unknown>(
    table: Table<Data>,
    klass: Class<P>
  ): Partial<OptionsFor<SignatureFrom<P>>> {
    let normalized = normalizePluginsConfig(table?.config?.plugins);
    let tuple = normalized?.find((option) => option[0] === klass);
    let t = tuple as [Class<P>, () => OptionsFor<SignatureFrom<P>>];

    // Plugin not provided, likely
    if (!t) return {};

    let fn = t[1];

    return fn() ?? {};
  },

  forColumn<P extends BasePlugin<any>, Data = unknown>(
    column: Column<Data>,
    klass: Class<P>
  ): Partial<ColumnOptionsFor<SignatureFrom<P>>> {
    let tuple = column.config.pluginOptions?.find((option) => option[0] === klass);
    let t = tuple as [unknown, () => ColumnOptionsFor<SignatureFrom<P>>];

    let fn = t?.[1];

    if (!fn) return {};

    return fn() ?? {};
  },
};

type FactoryMap<Instance> = Map<Class<Instance>, Instance>;

/**
 * @private
 */
function getPluginInstance<Instance>(
  map: Map<Class<Instance>, Instance>,
  mapKey: Class<Instance>,
  factory: () => Instance
): Instance;
function getPluginInstance<RootKey extends Column<any> | Row<any>, Instance>(
  map: WeakMap<Column | Row, Map<Class<Instance>, Instance>>,
  rootKey: RootKey,
  mapKey: Class<Instance>,
  factory: () => Instance
): Instance;
function getPluginInstance<RootKey extends Column<any> | Row<any>, Instance>(
  ...args:
    | [FactoryMap<Instance>, Class<Instance>, () => Instance]
    | [WeakMap<Column | Row, FactoryMap<Instance>>, RootKey, Class<Instance>, () => Instance]
): Instance {
  let map: WeakMap<Column | Row, FactoryMap<Instance>> | FactoryMap<Instance>;
  let mapKey: Class<Instance>;
  let rootKey: RootKey | undefined;
  let factory: () => Instance;

  if (args.length === 3) {
    map = args[0];
    mapKey = args[1];
    factory = args[2];
  } else if (args.length === 4) {
    map = args[0];
    rootKey = args[1];
    mapKey = args[2];
    factory = args[3];
  } else {
    throw new Error(
      // TS says args is of type "never", but TS can't protect against general misuse
      // (esp without TS)
      `Incorrect arity passed to getPluginInstance. Expected 3 or 4, received ${
        (args as any).length
      }`
    );
  }

  let bucket: FactoryMap<Instance> | undefined;

  if (map instanceof WeakMap) {
    assert(`rootKey is missing`, rootKey);

    bucket = map.get(rootKey);

    if (!bucket) {
      bucket = new Map();

      map.set(rootKey, bucket);
    }
  } else {
    bucket = map;
  }

  let instance = bucket.get(mapKey);

  if (instance) {
    return instance;
  }

  instance = factory();

  bucket.set(mapKey, instance);

  return instance;
}

import { cached } from '@glimmer/tracking';
import { assert } from '@ember/debug';

import { normalizePluginsConfig } from './utils';

import type { Column, Table } from '[public-types]';
import type { Plugin } from '#interfaces';
import type { ColumnReordering } from 'plugins/column-reordering';
import type { ColumnVisibility } from 'plugins/column-visibility';
import type { Class, Constructor } from 'type-fest';

// eslint-disable-next-line @typescript-eslint/ban-types
const TABLE_META = new WeakMap<Table, Map<Class<unknown>, any>>();
// eslint-disable-next-line @typescript-eslint/ban-types
const COLUMN_META = new WeakMap<Column, Map<Class<unknown>, any>>();

type InstanceOf<T> = T extends Class<infer Instance> ? Instance : T;
type TableMetaFor<P extends Plugin> = InstanceOf<NonNullable<NonNullable<P['meta']>['table']>>;
type ColumnMetaFor<P extends Plugin> = InstanceOf<NonNullable<NonNullable<P['meta']>['column']>>;
type OptionsFor<P extends BasePlugin> = InstanceOf<P>['options'];
type ColumnOptionsFor<P extends BasePlugin> = ReturnType<InstanceOf<P>['getColumnOptions']>;

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

const PLUGIN_INIT = Symbol('__PLUGIN_INIT__');

/**
 * @public
 *
 * If your table plugin is a class, you may extend from BasePlugin, which provides
 * small utility methods and properties for getting the metadata for your plugin
 * for the table and each column
 *
 * One instance of a plugin exists per table
 */
export abstract class BasePlugin<
  ColumnMeta = unknown,
  TableMeta = unknown,
  Options = unknown,
  ColumnOptions = unknown
> implements Plugin<ColumnMeta, TableMeta>
{
  constructor(protected table: Table) {
    preferences[PLUGIN_INIT](table, (this as any).constructor);
  }

  /**
   * Helper for specifying plugins on `headlessTable` with the plugin-level options
   */
  static with<T extends BasePlugin>(
    this: Constructor<T>,
    configFn: () => OptionsFor<T>
  ): [Constructor<T>, () => OptionsFor<T>] {
    return [this, configFn];
  }

  /**
   * Helper for specifying column-level configurations for a plugin on `headlessTable`'s
   * columns option
   */
  static forColumn<T extends BasePlugin>(
    this: Constructor<T>,
    configFn: () => ColumnOptionsFor<T>
  ): [Constructor<T>, () => ColumnOptionsFor<T>] {
    return [this, configFn];
  }

  abstract name: string;
  static features?: string[];
  static requires?: string[];

  declare abstract meta: { column: Constructor<ColumnMeta>; table: Constructor<TableMeta> };

  /**
   * TS does not allow access to the constructor property on class instances
   */
  get #self(): Class<this> {
    return (this as any).constructor;
  }

  /**
   * Utility property that returns the resulting options passed during
   * table creation for this specific plugin.
   */
  @cached
  get options(): Options | undefined {
    return options.forTable(this.table, this.#self);
  }

  getColumnOptions = (column: Column): ColumnOptions | undefined => {
    return options.forColumn(column, this.#self);
  };

  /**
   * Utility to get the meta / state for this plugin for a given column
   */
  getColumnMeta = (column: Column): ColumnMetaFor<this> => {
    return meta.forColumn(column, this.#self);
  };

  /**
   * Utility to get the meta / state for this plugin for *the table*
   */
  getTableMeta = (): TableMetaFor<this> => {
    return meta.forTable(this.table, this.#self);
  };
}

export const preferences = {
  [PLUGIN_INIT]<P extends Plugin>(table: Table, klass: Class<P>) {
    table.preferences.storage.forPlugin(klass.name);
  },
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
  forColumn<P extends Plugin>(column: Column, klass: Class<P>) {
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
   * returns an object for getting and setting preferences data
   * based on the table (scoped to the key: "table")
   *
   * Only the provided plugin will have access to these preferences
   * (though, if other plugins can guess how the underlying plugin access
   * works, they can access this data, too. No security guaranteed)
   */
  forTable<P extends Plugin>(table: Table, klass: Class<P>) {
    return {
      /**
       * delete an entry on the underlying `Map` used for this column-plugin pair
       */
      delete(key: string) {
        let prefs = table.preferences;
        let existing = prefs.storage.forPlugin(klass.name);

        existing.table.delete(key);

        return prefs.persist();
      },
      /**
       * get an entry on the underlying `Map` used for this column-plugin pair
       */
      get(key: string) {
        let prefs = table.preferences;
        let existing = prefs.storage.forPlugin(klass.name);

        return existing.table.get(key);
      },
      /**
       * set an entry on the underlying `Map` used for this column-plugin pair
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

export const meta = {
  /**
   * @public
   *
   * For a given column and plugin, return the meta / state bucket for the
   * plugin<->column instance pair.
   *
   * Note that this requires the column instance to exist on the table.
   */
  forColumn<P extends Plugin>(column: Column, klass: Class<P>): ColumnMetaFor<P> {
    return getPluginInstance(COLUMN_META, column, klass, () => {
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
   * For a given table and plugin, return the meta / state bucket for the
   * plugin<->table instance pair.
   */
  forTable<P extends Plugin>(table: Table, klass: Class<P>): TableMetaFor<P> {
    return getPluginInstance(TABLE_META, table, klass, () => {
      let plugin = table.pluginOf(klass);

      assert(`[${klass.name}] cannot get plugin instance of unregistered plugin class`, plugin);
      assert(`<#${plugin.name}> plugin does not have meta specified`, plugin.meta);
      assert(`<#${plugin.name}> plugin does not specify table meta`, plugin.meta.table);

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
    forColumn<FeatureName extends string>(
      column: Column,
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
    forTable<FeatureName extends string>(
      table: Table,
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
  forTable<P extends BasePlugin>(table: Table, klass: Class<P>): OptionsFor<P> | undefined {
    let normalized = normalizePluginsConfig(table?.config?.plugins);
    let tuple = normalized?.find((option) => option[0] === klass);

    // Plugin not provided, likely
    if (!tuple) return {};

    let fn = tuple[1];

    return fn();
  },

  forColumn<P extends BasePlugin>(
    column: Column,
    klass: Class<P>
  ): ColumnOptionsFor<P> | undefined {
    let tuple = column.config.pluginOptions?.find((option) => option[0] === klass);
    let t = tuple as [unknown, () => ColumnOptionsFor<P>];

    let fn = t?.[1];

    if (!fn) return;

    return fn();
  },
};

/**
 * @private
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function getPluginInstance<RootKey extends object, Instance>(
  map: WeakMap<RootKey, Map<Class<Instance>, Instance>>,
  rootKey: RootKey,
  mapKey: Class<Instance>,
  factory: () => Instance
): Instance {
  let bucket = map.get(rootKey);

  if (!bucket) {
    bucket = new Map();

    map.set(rootKey, bucket);
  }

  let instance = bucket.get(mapKey);

  if (instance) {
    return instance;
  }

  instance = factory();

  bucket.set(mapKey, instance);

  return instance;
}

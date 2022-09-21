import { assert } from '@ember/debug';

import { TrackedMap } from 'tracked-built-ins';

import { fnCacheFor, readStorage, updateStorage } from './storage-helpers';

import type {
  ColumnPreferences,
  PluginPreferences,
  PreferencesAdapter as Adapter,
  TablePreferencesData,
} from '#interfaces';

export class TablePreferences {
  storage = new TrackedPreferences();

  /**
   * @deprecated - preferences must be plugin-based
   */
  columnPreferences = new TrackedMap<string, ColumnPreferences>();

  constructor(private key: string, private adapter?: Adapter) {
    if (this.adapter) {
      this.restore(this.adapter);
    }
  }

  hasAdapter() {
    return this.adapter !== undefined;
  }

  /**
   * @deprecated - preferences must be plugin-based
   */
  deleteColumnPreference<K extends keyof ColumnPreferences>(columnKey: string, key: K) {
    let preferences = this.getColumnPreferences(columnKey);

    if (!(key in preferences)) {
      return false;
    }

    let newPreferences = { ...this.getColumnPreferences(columnKey) };

    delete newPreferences[key];

    if (Object.keys(newPreferences).length === 0) {
      this.columnPreferences.delete(columnKey);
    } else {
      this.columnPreferences.set(columnKey, newPreferences);
    }

    this.persist();

    return true;
  }

  /**
   * @deprecated - preferences must be plugin-based
   */
  getColumnPreferences(columnKey: string): ColumnPreferences {
    return this.columnPreferences.get(columnKey) ?? {};
  }

  getIsAtDefault() {
    return this.storage.isAtDefault;
  }

  /**
   * @deprecated - preferences must be plugin-based
   */
  setColumnPreferences(columnKey: string, value: ColumnPreferences) {
    this.columnPreferences.set(columnKey, value);
    this.persist();
  }

  /**
   * @deprecated - preferences must be plugin-based
   */
  setColumnPreference<K extends keyof ColumnPreferences>(
    columnKey: string,
    key: K,
    value: ColumnPreferences[K]
  ) {
    let preferences = this.getColumnPreferences(columnKey);
    let newValue = { ...preferences, [key]: value };

    this.columnPreferences.set(columnKey, newValue);

    this.persist();
  }

  /**
   * @deprecated - preferences must be plugin-based
   *                use storage.serialize() instead
   */
  toTablePreferencesData() {
    let data: TablePreferencesData = {};

    let columns: Record<string, ColumnPreferences> = {};

    for (let [key, preferences] of this.columnPreferences) {
      if (Object.keys(preferences).length > 0) {
        columns[key] = preferences;
      }
    }

    if (Object.keys(columns).length > 0) {
      data.columns = columns;
    }

    return data;
  }

  persist() {
    return this.adapter?.persist?.(this.key, {
      ...this.toTablePreferencesData(),
      ...this.storage.serialize(),
    });
  }

  restore(adapter: Adapter) {
    let data = adapter?.restore?.(this.key);

    if (!data) return;

    for (let [key, preferences] of Object.entries(data.columns ?? {})) {
      this.columnPreferences.set(key, preferences);
    }

    return this.storage.restore(data);
  }
}

class TrackedPreferences {
  plugins = new TrackedMap<string, TrackedPluginPrefs>();
  #proxyCache = new Map<string, TrackedPluginPrefs>();

  get isAtDefault(): boolean {
    return [...this.plugins.values()].every((pluginPrefs) => pluginPrefs.isAtDefault);
  }

  forPlugin(name: string): TrackedPluginPrefs {
    return deferredAccess({
      key: name,
      storage: this.plugins,
      cache: this.#proxyCache,
      readMethods: ['get', 'forColumn', 'serialize'],
      create: () => new TrackedPluginPrefs(),
    });
  }

  serialize(): TablePreferencesData {
    let plugins: TablePreferencesData['plugins'] = {};

    for (let [pluginName, preferences] of this.plugins.entries()) {
      plugins[pluginName] = preferences.serialize();
    }

    return {
      plugins,
    };
  }

  restore(data: TablePreferencesData): void {
    let { plugins } = data;

    for (let [pluginName, preferences] of Object.entries(plugins || {})) {
      let trackedPluginPrefs = new TrackedPluginPrefs();

      trackedPluginPrefs.restore(preferences);

      this.plugins.set(pluginName, trackedPluginPrefs);
    }
  }
}

class TrackedPluginPrefs {
  table = new TrackedMap<string, unknown>();
  columns = new TrackedMap<string, TrackedMap<string, unknown>>();
  #columnProxyCache = new Map<string, TrackedMap<string, unknown>>();

  get isAtDefault(): boolean {
    return this.table.size === 0 && [...this.columns.values()].every((x) => x.size === 0);
  }

  forColumn = (key: string): TrackedMap<string, unknown> => {
    return deferredAccess({
      key,
      storage: this.columns,
      cache: this.#columnProxyCache,
      readMethods: ['get'],
      create: () => new TrackedMap(),
    });
  };

  serialize(): PluginPreferences {
    let columnsPrefs: PluginPreferences['columns'] = {};
    let tablePrefs: PluginPreferences['table'] = {};

    for (let [columnKey, preferences] of this.columns.entries()) {
      let serializedPreferences: Record<string, unknown> = {};

      for (let [key, preference] of preferences.entries()) {
        serializedPreferences[key] = preference;
      }

      columnsPrefs[columnKey] = serializedPreferences;
    }

    for (let [key, preference] of this.table.entries()) {
      tablePrefs[key] = preference;
    }

    return {
      table: tablePrefs,
      columns: columnsPrefs,
    };
  }

  restore(data: PluginPreferences): void {
    let { table, columns } = data;

    for (let [key, preferences] of Object.entries(columns)) {
      let trackedPluginPrefs = new TrackedMap(Object.entries(preferences));

      this.columns.set(key, trackedPluginPrefs);
    }

    this.table = new TrackedMap(Object.entries(table));
  }
}

/**
 * In an auto-tracking world, we cannot try to access tracked data
 * and then modify it. So, to get around this issue and keep the plugin API we want,
 * we can use proxies to *defer* creation of tracked data until a mutation occurs.
 */
function deferredAccess<Instance = object>({
  key,
  storage,
  cache: storageCache,
  readMethods = [],
  create,
}: {
  key: string;
  storage: Map<unknown, Instance>;
  cache: Map<unknown, Instance>;
  readMethods?: Array<string | symbol>;
  create: () => Instance;
}): Instance {
  let existing = storage.get(key);

  readStorage(storage, key);

  /**
   * Normally, in a !existing check, we'd set the value on the Map... but,
   *
   * We can't call set here during a data _read_, so we need to wait until
   * data is set, and then we can set.
   *
   * We can wait for a set on the plugin prefs because that can only happen outside
   * a tracking frame -- so we can wait for that to happen, and do our own
   * setting here, which will update consumers. (hopefully)
   *
   * None of this code is touched, once we do the plugins.set + updateStorage combo
   */
  if (!existing) {
    let inCache = storageCache.get(key);

    if (!inCache) {
      inCache = create();
      storageCache.set(key, inCache);
    }

    assert(
      `Cannot use ${typeof inCache} to create proxy`,
      typeof inCache === 'object' && inCache !== null
    );

    let proxy = new Proxy(inCache, {
      set(target, property, value, receiver) {
        if (typeof property !== 'string') {
          return Reflect.set(target, property, value, receiver);
        }

        assert(`Cannot proxy 'inCache' when it is falesy`, inCache);

        let targetProperty: keyof Instance = property as unknown as keyof Instance;

        inCache[targetProperty] = value;
        storage.set(key, inCache);
        updateStorage(storage, key);
        updateStorage(target, property);

        return true;
      },
      get(target, property, receiver) {
        let value = Reflect.get(target, property, receiver);

        if (typeof value === 'function') {
          if (readMethods.includes(property)) {
            return value;
          }

          let fnCache = fnCacheFor(target);
          let existing = fnCache.get(property);

          if (!existing) {
            let newFn = function (...args: unknown[]) {
              assert(`Cannot proxy 'inCache' when it is falesy`, inCache);
              console.log('proxy', { property, storage, key, inCache });

              /**
               * Doing this means that next time `forPlugin` is called, we'll skip all of this
               * and "just return 'existing'" below
               */
              storage.set(key, inCache);
              updateStorage(storage, key);

              return value.call(target, ...args);
            };

            fnCache.set(property, newFn);

            return newFn;
          }

          return existing;
        }

        readStorage(target, property);

        return value;
      },
    });

    return proxy;
  }

  return existing;
}

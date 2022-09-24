import { TrackedMap } from 'tracked-built-ins';

import type {
  ColumnPreferences,
  PluginPreferenceFor,
  PluginPreferences,
  PreferencesAdapter as Adapter,
  PreferencesTableValues,
  Registry,
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
  plugins = new Map<string, TrackedPluginPrefs>();

  get isAtDefault(): boolean {
    return [...this.plugins.values()].every((pluginPrefs) => pluginPrefs.isAtDefault);
  }

  forPlugin(name: string) {
    let existing = this.plugins.get(name);

    if (!existing) {
      existing = new TrackedPluginPrefs();
      this.plugins.set(name, existing);
    }

    return existing;
  }

  serialize(): TablePreferencesData {
    let plugins: TablePreferencesData['plugins'] = {};

    for (let [pluginName, preferences] of this.plugins.entries()) {
      /**
       * This cast is dirty, and should be fixed eventually.
       * We should be able to, knowing that pluginName
       * will either be in the registry, or be a default PluginPreferences
       * object, that we can assign the serialized structure to plugins.
       */
      (plugins as any)[pluginName] = preferences.serialize();
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

class TrackedPluginPrefs<PluginName = unknown> {
  table = new TrackedMap<string, unknown>();
  columns = new Map<string, TrackedMap<string, unknown>>();

  get isAtDefault(): boolean {
    return this.table.size === 0 && [...this.columns.values()].every((x) => x.size === 0);
  }

  forColumn = (key: string): TrackedMap<string, unknown> => {
    let existing = this.columns.get(key);

    if (!existing) {
      existing = new TrackedMap();
      this.columns.set(key, existing);
    }

    return existing;
  };

  serialize(): PluginPreferenceFor<PluginName> {
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
    } as PluginPreferenceFor<PluginName>;
  }

  restore(data: PluginPreferences): void {
    let { table, columns } = data;

    for (let [key, preferences] of Object.entries(columns)) {
      let trackedPluginPrefs = new TrackedMap(Object.entries(preferences));

      this.columns.set(key, trackedPluginPrefs);
    }

    /**
      * TODO: fix the inference here...
      *       each time there is a cast, there is a greater risk of runtime error.
      */
    this.table = new TrackedMap<string, PreferencesTableValues<PluginName>>(Object.entries(table) as [string, PreferencesTableValues<PluginName>][]);
  }
}

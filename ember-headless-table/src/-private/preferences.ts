import { TrackedMap } from 'tracked-built-ins';

import type {
  PluginClass,
  PluginPreferenceFor,
  PluginPreferences,
  PreferencesAdapter as Adapter,
  PreferencesTableValues,
  TablePreferencesData,
} from '#interfaces';

export class TablePreferences {
  storage = new TrackedPreferences();

  constructor(private key: string, private adapter?: Adapter) {
    if (this.adapter) {
      this.restore(this.adapter);
    }
  }

  hasAdapter() {
    return this.adapter !== undefined;
  }

  getIsAtDefault() {
    return this.storage.isAtDefault;
  }

  /**
   * Passes a JSON-compatible structure to `adapter.persist`
   *
   * This structure could be stored in a remote database or
   * local storage. The `adpater.restore` method can be used to restore
   * this structure back in to the {@link TrackedPreferences }
   */
  persist() {
    return this.adapter?.persist?.(this.key, {
      ...this.storage.serialize(),
    });
  }

  /**
   * Using the `adapter.restore` method, convert the JSON structure
   * to {@link TrackedPreferences }
   */
  restore(adapter: Adapter) {
    let data = adapter?.restore?.(this.key);

    if (!data) return;

    return this.storage.restore(data);
  }
}

/**
 * @public
 *
 * The API for reactively interacting with preferences
 */
class TrackedPreferences {
  plugins = new Map<string, TrackedPluginPrefs>();

  get isAtDefault(): boolean {
    return [...this.plugins.values()].every((pluginPrefs) => pluginPrefs.isAtDefault);
  }

  forPlugin(klass: PluginClass<any>) {
    let instance = Reflect.construct(klass, []) as PluginClass<any>;
    let existing = this.plugins.get(instance.name);

    if (!existing) {
      existing = new TrackedPluginPrefs();
      this.plugins.set(instance.name, existing);
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
    this.table = new TrackedMap<string, PreferencesTableValues<PluginName>>(
      Object.entries(table) as [string, PreferencesTableValues<PluginName>][]
    );
  }
}

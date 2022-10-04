export interface PreferencesAdapter {
  persist?(key: string, data?: TablePreferencesData): void;
  restore?(key: string): TablePreferencesData | undefined;
}

/**
 * The root preferences object
 *
 * This object is serialized to JSON for your `PreferencesAdapter` to consume.
 * This could allow for saving the data off to an API or local storage.
 */
export interface TablePreferencesData {
  /**
   * @deprecated columns have no configuration outside of what is provided by plugins
   */
  columns?: Record<string, ColumnPreferences>;
  /**
   * Every plugin has its own namespace for preferences storage.
   *
   * This is so that plugins can not worry about colliding with other plugins'
   * keys within the preferences. For example: multiple plugins may use "enabled"
   */
  plugins?: {
    [pluginName: string]: PluginPreferences;
  };
}

/**
 * Preferences for a column may store a map of key-value pairs
 * for each of
 * - the table
 * - each column
 */
export interface PluginPreferences {
  /**
   * A plugin's preferences for the table can be any
   * string -> stringifyable mapping
   */
  table: Record<string, unknown>;
  /**
   * preferences for a plugin's columns-of-interest are mapped out by
   * the column's key
   */
  columns: {
    /**
     * For any particular column that a plugin may desire to store preferences on,
     * the data can be any string -> stringifyable mapping
     */
    [columnKey: string]: Record<string, unknown>;
  };
}

/**
 * @deprecated columns have no configuration outside of what is provided by plugins
 */
export interface ColumnPreferences {
  /**
   * @deprecated columns have no configuration outside of what is provided by plugins
   */
  isVisible?: boolean;
  /**
   * @deprecated columns have no configuration outside of what is provided by plugins
   */
  width?: number;
  /**
   * @deprecated columns have no configuration outside of what is provided by plugins
   */
  position?: number;
}

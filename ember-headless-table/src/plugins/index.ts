// Public API
export { BasePlugin, meta, options, preferences } from './-private/base';
export { applyStyles, removeStyles } from './-private/utils';

// Public Types
export type { ColumnFeatures, TableFeatures } from './-private/base';
export type { ColumnApi, Plugin, PluginPreferences, Registry } from '#interfaces';
export type { PluginSignature } from '#interfaces/plugins';

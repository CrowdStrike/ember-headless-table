// Installs the types for TS, no-op in JS
import 'ember-cached-decorator-polyfill';

/********************************
 * Public API
 *******************************/
// The main export, the headlessTable resource
export { headlessTable } from './-private/js-helper';

// Utilities
export { TablePreferences } from './-private/preferences';
export { deserializeSorts, serializeSorts } from './utils';

/********************************
 * Public Types
 *******************************/
export type { Column } from './-private/column';
export type {
  ColumnConfig,
  ColumnKey,
  Pagination,
  PreferencesAdapter,
  TablePreferencesData as PreferencesData,
  Selection,
  TableConfig,
  TableMeta,
} from './-private/interfaces';
export type { Row } from './-private/row';
export type { Table } from './-private/table';

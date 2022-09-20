import { Table } from './table';

import type { TableConfig } from '#interfaces';

/**
 * Represents a UI-less version of a table
 *
 * _For use for building tables in ui frameworks_.
 *
 * @example
 * ```js
 * import { headlessTable } '@crowdstrike/ember-headless-table';
 *
 * class MyImplementation {
 *   table = headlessTable(this, {
 *     // your config here
 *   })
 * }
 * ```
 *
 */
export function headlessTable<T = unknown>(
  destroyable: object, // eslint-disable-line @typescript-eslint/ban-types
  options:
    | TableConfig<T>
    /* TODO: remove the function way of doing this
       -- this is for backwards compatibility only
       -- until all the dynamically supported options become plugins or thunks
          -> this is probably the easiest first step (pre plugin conversion)
     */
    | (() => TableConfig<T>)
): Table<T> {
  let thunk = typeof options === 'function' ? options : () => options;

  /**
   * If any "root level" config changes, we need to throw-away everything.
   * otherwise individual-property reactivity can be managed on a per-property
   * "thunk"-basis
   */
  return Table.from<Table<T>>(destroyable, thunk);
}

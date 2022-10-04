import { Table } from './table';

import type { TableConfig } from '#interfaces';

type Args<T> = [destroyable: object, options: TableConfig<T>] | [options: TableConfig<T>];

/**
 * Represents a UI-less version of a table
 *
 * _For use for building tables in ui frameworks_.
 *
 * @example
 * ```js
 * import { use } from 'ember-resources';
 * import { headlessTable } '@crowdstrike/ember-headless-table';
 *
 * class MyImplementation {
 *   @use table = headlessTable({
 *     // your config here
 *   })
 * }
 * ```
 */
export function headlessTable<T = unknown>(options: TableConfig<T>): Table<T>;

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
export function headlessTable<T = unknown>(destroyable: object, options: TableConfig<T>): Table<T>;

export function headlessTable<T = unknown>(...args: Args<T>): Table<T> {
  if (args.length === 2) {
    let [destroyable, options] = args;

    /**
     * If any "root level" config changes, we need to throw-away everything.
     * otherwise individual-property reactivity can be managed on a per-property
     * "thunk"-basis
     */
    return Table.from<Table<T>>(destroyable, () => options);
  }

  let [options] = args;

  return Table.from<Table<T>>(() => options);
}

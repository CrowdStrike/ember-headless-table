import { BasePlugin } from '../-private/base';

/**
 * Data stored per column or table can be arbitrary
 *
 */
type ArbitraryData = Record<string, any>;

export interface Signature<Data = ArbitraryData> {
  Options: {
    Column: Data;
    Plugin: Data;
  };
}

/**
 * This plugin does noting,
 * but gives consumer of it a safe way to store and associate "any" data with columns
 * (and have a generic top-level bucket of data as well)
 *
 * This "metadata" stored per column per table is managed via the "options" part of the Signature, as
 * "meta" is a term used for plugins for plugin authors.
 */
export class Metadata<S extends Signature> extends BasePlugin<S> {
  name = 'metadata';
}

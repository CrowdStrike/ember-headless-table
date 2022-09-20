import { cached, tracked } from '@glimmer/tracking';
import { getOwner, setOwner } from '@ember/application';
import { assert } from '@ember/debug';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';

import { Resource } from 'ember-resources/core';
import { map } from 'ember-resources/util/map';

import { normalizePluginsConfig, verifyPlugins } from '../plugins/-private/utils';
import { Column } from './column';
import { TablePreferences } from './preferences';
import { Row } from './row';
import { composeFunctionModifiers } from './utils';

import type { Plugin } from '../plugins';
import type { ColumnKey, ColumnPreferences, Destructor, TableConfig } from '#interfaces';
import type { Class } from 'type-fest';

const DEFAULT_COLUMN_CONFIG = {
  isVisible: true,
  minWidth: 128,
};

interface Signature<DataType> {
  Named: TableConfig<DataType>;
}

const attachContainer = (element: Element, table: Table) => {
  assert('Must be installed on an HTMLElement', element instanceof HTMLElement);

  table.scrollContainerElement = element;
};

export class Table<DataType = unknown> extends Resource<Signature<DataType>> {
  @tracked scrollContainerHeight?: number;
  @tracked scrollContainerWidth?: number;

  @tracked declare args: { named: Signature<DataType>['Named'] };

  defaultColumnConfig = DEFAULT_COLUMN_CONFIG;
  scrollContainerElement?: HTMLElement;

  #page?: number;

  declare preferences: TablePreferences;

  modify(_: [] | undefined, named: Signature<DataType>['Named']) {
    this.args = { named };

    // only set the preferences once
    if (!this.preferences) {
      let { key = guidFor(this), adapter } = named?.preferences ?? {};

      // TODO: when no key is present,
      //       use "local-storage" preferences.
      //       it does not make sense to use a guid in a user's preferences
      this.preferences = new TablePreferences(key, adapter);
    } else {
      // subsequent updates to args
      this.#maybeResetScrollContainer();
    }
  }

  /**
   * Collection of utility modifiers that are the result of composing modifiers
   * from plugins.
   *
   * Using this is optional, and you can "just" use modifiers from specific plugins
   * in specific places if you wish -- but these exists as a "convenience".
   *
   * These are all no-use, no-cost utilities
   */
  modifiers = {
    container: (element: HTMLElement): Destructor => {
      let modifiers = this.plugins.map((plugin) => plugin.containerModifier);
      let composed = composeFunctionModifiers([attachContainer, ...modifiers]);

      // TS is chokeing on different versions of the `Table` type during compilation
      // some sort of cache mismatch where the columns' map mismatches itself
      return composed(element, this as any);
    },

    // resize: ResizeModifier,
    // TODO: switch to composing real modifiers once "curry" and "compose"
    //       RFCs are accepted and implemented
    //
    //       Atm the moment, if _any_ header modifier's tracked data changes,
    //       all the functions for all of the plugins run again.
    //
    //       With curried+composed modifiers, only the plugin's headerModifier
    //       that has tracked changes would run, leaving the other modifiers alone
    columnHeader: (element: HTMLElement, column: Column): Destructor => {
      let modifiers = this.plugins.map((plugin) => plugin.headerCellModifier);
      let composed = composeFunctionModifiers(modifiers);

      return composed(element, { column, table: this });
    },
  };

  /**
   * @private
   *
   * For all configured plugins, instantiates each one.
   * If the plugins argument changes to the Table (either directly or through
   * headlessTable, all state is lost and re-created)
   */
  @cached
  get plugins(): Plugin[] {
    let plugins = normalizePluginsConfig(this.args.named?.plugins);

    verifyPlugins(plugins);

    return plugins.map((tuple) => {
      // We don't need the options here
      let [PluginClass] = tuple;

      if (typeof PluginClass === 'function') {
        let plugin = new PluginClass(this);

        let owner = getOwner(this);

        assert(`The Table does not have an owner. cannot create a plugin without an owner`, owner);
        setOwner(plugin, owner);

        return plugin;
      }

      // This is a plugin object, rather than a class
      // TODO: add test coverage around using classless plugins
      return PluginClass;
    });
  }

  pluginOf(klass: Class<Plugin>) {
    return this.plugins.find((plugin) => plugin instanceof klass);
  }

  get config() {
    return this.args.named;
  }

  get bulkSelection() {
    return this.args.named?.bulkSelection;
  }

  get hasActiveRow() {
    return Boolean(this.args.named?.rowSelection?.());
  }

  get hasCheckboxSelection() {
    return this.isCheckboxSelectable && this.bulkSelection?.currentState.state !== 'NONE';
  }

  get isAtDefaultSettings() {
    return this.preferences.getIsAtDefault();
  }

  get isCheckboxSelectable() {
    return this.args.named?.isCheckboxSelectable ?? Boolean(this.args.named?.bulkSelection);
  }

  get isRowSelectable() {
    return this.args.named?.isRowSelectable ?? Boolean(this.args.named?.onRowSelectionChange);
  }

  get isPaginated() {
    return Boolean(this.args.named?.pagination);
  }

  get pagination() {
    return this.args.named?.pagination;
  }

  get rowSelection() {
    let rowSelection = this.args.named?.rowSelection;

    return rowSelection ? new Set([rowSelection()]) : new Set();
  }

  rows = map(this, {
    data: () => {
      let dataFn = this.args.named?.data;

      if (!dataFn) return [];

      return dataFn() ?? [];
    },
    map: (datum) => new Row(this, datum),
  });

  columns = map(this, {
    data: () => {
      let configFn = this.args.named?.columns;

      if (!configFn) return [];

      return configFn() ?? [];
    },
    map: (config) => {
      return new Column<DataType>(this, { ...this.defaultColumnConfig, ...config });
    },
  });

  get totalRowCount() {
    return this.pagination?.totalItems ?? this.args.named?.meta?.totalRowCount ?? this.rows.length;
  }

  get totalRowsSelectedCount() {
    return this.args.named?.meta?.totalRowsSelectedCount ?? this.bulkSelection?.numSelected;
  }

  get value() {
    return this;
  }

  /**
   * Resets the scroll position of the scroll container if the page has
   * changed.
   * @internal
   */
  #maybeResetScrollContainer() {
    if (this.pagination?.page !== this.#page) {
      this.resetScrollContainer();
    }

    this.#page = this.pagination?.page;
  }

  getColumnPreference<K extends keyof ColumnPreferences>(
    columnKey: ColumnKey<DataType>,
    key: K
  ): ColumnPreferences[K] {
    return this.preferences.getColumnPreferences(columnKey)[key];
  }

  @action
  resetScrollContainer() {
    if (!this.scrollContainerElement) return;

    this.scrollContainerElement.scrollTop = 0;
  }

  @action
  resetToDefaults() {
    this.plugins.forEach((plugin) => plugin.reset?.());
  }

  @action
  selectRow(row: Row<DataType>) {
    this.args.named?.onRowSelectionChange?.(row.data);
  }

  @action
  unselectRow(_row: Row<DataType>) {
    this.args.named?.onRowSelectionChange?.(undefined);
  }
}

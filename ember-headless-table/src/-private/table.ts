import { cached, tracked } from '@glimmer/tracking';
import { getOwner, setOwner } from '@ember/application';
import { assert } from '@ember/debug';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';

import { modifier } from 'ember-modifier';
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

/**
 * Because the table is our entry-point object to all the table behaviors,
 * we need a stable way to know which table we have.
 * Normally, this could be done with referential integrity / identity.
 * However, due to how resources are implemented, if the consumer opts to
 * not use the `@use` decorator, then proxies get involved.
 * The proxies don't maintain instanceof checks, which may be a bug in
 * ember-resources.
 */
export const TABLE_KEY = Symbol('__TABLE_KEY__');

const attachContainer = (element: Element, table: Table) => {
  assert('Must be installed on an HTMLElement', element instanceof HTMLElement);

  table.scrollContainerElement = element;
};

export class Table<DataType = unknown> extends Resource<Signature<DataType>> {
  /**
   * @private
   */
  [TABLE_KEY] = guidFor(this);

  /**
   * @private
   */
  @tracked scrollContainerHeight?: number;

  /**
   * @private
   */
  @tracked scrollContainerWidth?: number;

  /**
   * @private
   */
  @tracked declare args: { named: Signature<DataType>['Named'] };

  /**
   * @private
   */
  defaultColumnConfig = DEFAULT_COLUMN_CONFIG;

  /**
   * @private
   */
  scrollContainerElement?: HTMLElement;

  /**
   * @deprecated
   *
   * this should be moved to a "pagination" plugin
   */
  #page?: number;

  /**
   * Interact with, save, modify, etc the preferences for the table,
   * plugins, columns, etc
   */
  declare preferences: TablePreferences;

  /**
   * @private
   */
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
    container: modifier(
      (element: HTMLElement): Destructor => {
        let modifiers = this.plugins.map((plugin) => plugin.containerModifier);
        let composed = composeFunctionModifiers([attachContainer, ...modifiers]);

        return composed(element, this);
      },
      { eager: false }
    ),

    // resize: ResizeModifier,
    // TODO: switch to composing real modifiers once "curry" and "compose"
    //       RFCs are accepted and implemented
    //
    //       Atm the moment, if _any_ header modifier's tracked data changes,
    //       all the functions for all of the plugins run again.
    //
    //       With curried+composed modifiers, only the plugin's headerModifier
    //       that has tracked changes would run, leaving the other modifiers alone
    columnHeader: modifier(
      (element: HTMLElement, [column]: [Column<DataType>]): Destructor => {
        let modifiers = this.plugins.map((plugin) => plugin.headerCellModifier);
        let composed = composeFunctionModifiers(modifiers);

        return composed(element, { column, table: this });
      },
      { eager: false }
    ),
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

  /**
   * Get the active plugin instance for the given plugin class
   */
  pluginOf(klass: Class<Plugin>) {
    return this.plugins.find((plugin) => plugin instanceof klass);
  }

  /**
   * @private
   */
  get config() {
    return this.args.named;
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  get bulkSelection() {
    return this.args.named?.bulkSelection;
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  get hasActiveRow() {
    return Boolean(this.args.named?.rowSelection?.());
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  get hasCheckboxSelection() {
    return this.isCheckboxSelectable && this.bulkSelection?.currentState.state !== 'NONE';
  }

  /**
   * Will return true if the default is at its default state.
   * false otherwise.
   */
  get isAtDefaultSettings() {
    return this.preferences.getIsAtDefault();
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  get isCheckboxSelectable() {
    return this.args.named?.isCheckboxSelectable ?? Boolean(this.args.named?.bulkSelection);
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  get isRowSelectable() {
    return this.args.named?.isRowSelectable ?? Boolean(this.args.named?.onRowSelectionChange);
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  get isPaginated() {
    return Boolean(this.args.named?.pagination);
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  get pagination() {
    return this.args.named?.pagination;
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
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

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  get totalRowCount() {
    return this.pagination?.totalItems ?? this.args.named?.meta?.totalRowCount ?? this.rows.length;
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  get totalRowsSelectedCount() {
    return this.args.named?.meta?.totalRowsSelectedCount ?? this.bulkSelection?.numSelected;
  }

  /**
   * @private
   *
   * TODO: what's this for?
   */
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

  /**
   * @deprecated
   */
  getColumnPreference<K extends keyof ColumnPreferences>(
    columnKey: ColumnKey<DataType>,
    key: K
  ): ColumnPreferences[K] {
    return this.preferences.getColumnPreferences(columnKey)[key];
  }

  /**
   * @private
   */
  @action
  resetScrollContainer() {
    if (!this.scrollContainerElement) return;

    this.scrollContainerElement.scrollTop = 0;
  }

  @action
  resetToDefaults() {
    this.plugins.forEach((plugin) => plugin.reset?.());
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  @action
  selectRow(row: Row<DataType>) {
    this.args.named?.onRowSelectionChange?.(row.data);
  }

  /**
   * @deprecated
   *
   * This will soon be extracted to a plugin
   */
  @action
  unselectRow(_row: Row<DataType>) {
    this.args.named?.onRowSelectionChange?.(undefined);
  }
}

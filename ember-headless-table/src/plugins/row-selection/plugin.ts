import { cached } from '@glimmer/tracking';
import { assert } from '@ember/debug';

import { BasePlugin, meta, options } from '../-private/base';

import type { Row, Table } from '[public-types]';
import type { PluginSignature, RowApi } from '#interfaces';

export interface Signature<DataType = any, Key = DataType> extends PluginSignature {
  Meta: {
    Table: TableMeta;
    Row: RowMeta;
  };
  Options: {
    Plugin: {
      /**
       * A set of selected things using the same type of Identifier
       * returned from `key`
       */
      selection: Set<Key> | Array<Key>;
    } & (
      | {
          /**
           * For a given row's data, how should the key be determined?
           * this could be a remote id from a database, or some other attribute
           *
           * This could be useful for indicating in UI if a particular item is selected.
           *
           * If not provided, the row's data will be used as the key
           */
          key: (data: DataType) => Key;
          /**
           * When a row is clicked, this will be invoked,
           * allowing you to update your selection object
           */
          onSelect: (item: Key, row: Row<DataType>) => void;
          /**
           * When a row is clicked (and the row is selected), this will be invoked,
           * allowing you to update your selection object
           */
          onDeselect: (item: DataType, row: Row<DataType>) => void;
        }
      | {
          /**
           * When a row is clicked (and the row is not selected), this will be invoked,
           * allowing you to update your selection object
           */
          onSelect: (item: DataType, row: Row<DataType>) => void;
          /**
           * When a row is clicked (and the row is selected), this will be invoked,
           * allowing you to update your selection object
           */
          onDeselect: (item: DataType, row: Row<DataType>) => void;
        }
    );
  };
}

/**
 * This plugin provides a means of managing selection of a single row in a table.
 *
 * The state of what is actually selected is managed by you, but this plugin
 * will wire up the click listeners as well as let you know which *data* is clicked.
 */
export class RowSelection<DataType = any, Key = DataType> extends BasePlugin<Signature<DataType, Key>> {
  name = 'row-selection';

  meta = {
    row: RowMeta,
    table: TableMeta,
  };

  constructor(table: Table) {
    super(table);

    let pluginOptions = options.forTable(this.table, RowSelection);

    assert(
      `selection, onSelect, and onDeselect are all required arguments for the RowSelection plugin. ` +
        `Specify these options via \`RowSelection.with(() => ({ selection, onSelect, onDeselect }))\``,
      pluginOptions.selection && pluginOptions.onSelect && pluginOptions.onDeselect
    );
  }

  rowModifier = (element: HTMLElement, { row }: RowApi<Table<any>>) => {
    let handler = (event: Event) => {
      this.#clickHandler(row, event);
    };

    element.addEventListener('click', handler);

    return () => {
      element.removeEventListener('click', handler);
    };
  };

  #clickHandler = (row: Row, event: Event) => {
    assert(
      `expected event.target to be an instance of HTMLElement`,
      event.target instanceof HTMLElement || event.target instanceof SVGElement
    );

    let selection = document.getSelection();

    if (selection) {
      let { type, anchorNode } = selection;
      let isSelectingText = type === 'Range' && event.target?.contains(anchorNode);

      if (isSelectingText) {
        event.stopPropagation();

        return;
      }
    }

    // Ignore clicks on interactive elements within the row
    let inputParent = event.target.closest('input, button, label, a, select');

    if (inputParent) {
      return;
    }

    let rowMeta = meta.forRow(row, RowSelection);

    rowMeta.toggle();
  };
}

class TableMeta {
  #table: Table;

  constructor(table: Table) {
    this.#table = table;
  }

  @cached
  get selection(): Set<unknown> {
    let passedSelection = options.forTable(this.#table, RowSelection).selection;

    assert(`Cannot access selection because it is undefined`, passedSelection);

    if (passedSelection instanceof Set) {
      return passedSelection;
    }

    return new Set(passedSelection);
  }
}

class RowMeta {
  #row: Row<any>;

  constructor(row: Row<any>) {
    this.#row = row;
  }

  get isSelected(): boolean {
    let tableMeta = meta.forTable(this.#row.table, RowSelection);
    let pluginOptions = options.forTable(this.#row.table, RowSelection);

    if ('key' in pluginOptions && pluginOptions.key) {
      let compareWith = pluginOptions.key(this.#row.data);

      return tableMeta.selection.has(compareWith);
    }

    let compareWith = this.#row.data;

    return tableMeta.selection.has(compareWith);
  }

  toggle = () => {
    if (this.isSelected) {
      this.deselect();

      return;
    }

    this.select();
  };

  select = () => {
    let pluginOptions = options.forTable(this.#row.table, RowSelection);

    if ('key' in pluginOptions && pluginOptions.key) {
      let key = pluginOptions.key(this.#row.data);

      pluginOptions.onSelect?.(key, this.#row);

      return;
    }

    pluginOptions.onSelect?.(this.#row.data, this.#row);
  };

  deselect = () => {
    let pluginOptions = options.forTable(this.#row.table, RowSelection);

    if ('key' in pluginOptions && pluginOptions.key) {
      let key = pluginOptions.key(this.#row.data);

      pluginOptions.onDeselect?.(key, this.#row);

      return;
    }

    pluginOptions.onDeselect?.(this.#row.data, this.#row);
  };
}

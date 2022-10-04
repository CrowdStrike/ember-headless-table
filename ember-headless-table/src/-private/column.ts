import { action, get } from '@ember/object';
import { isEmpty } from '@ember/utils';

import type { Row } from './row';
import type { Table } from './table';
import type { ColumnConfig } from '#interfaces';

const DEFAULT_VALUE = '--';
const DEFAULT_VALUE_KEY = 'defaultValue';
const DEFAULT_OPTIONS = {
  [DEFAULT_VALUE_KEY]: DEFAULT_VALUE,
};

export class Column<T = unknown> {
  get Cell() {
    return this.config.Cell;
  }

  get key() {
    return this.config.key;
  }

  get name() {
    return this.config.name;
  }

  constructor(public table: Table<T>, public config: ColumnConfig<T>) {}

  @action
  getValueForRow(row: Row<T>) {
    if (this.config.value) {
      return this.config.value({ column: this, row });
    }

    // Cast here, because ember get's types do not support nested keys
    // even though the real implementation does
    let value = get(row.data, this.config.key as keyof typeof row.data);

    return isEmpty(value) ? this.getDefaultValue(row) : value;
  }

  private getDefaultValue(row: Row<T>) {
    return this.getOptionsForRow(row)[DEFAULT_VALUE_KEY];
  }

  @action
  getOptionsForRow(row: Row<T>) {
    let defaults = DEFAULT_OPTIONS;

    return {
      ...defaults,
      ...this.config.options?.({ column: this, row }),
    };
  }
}

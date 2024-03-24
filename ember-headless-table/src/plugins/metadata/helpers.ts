import { options } from '../-private/base';
import { Metadata } from './plugin';

import type { Column, Table } from '[public-types]';

export const forColumn = <DataType = unknown>(column: Column<DataType>, key: string) => {
  return options.forColumn(column, Metadata)[key];
};

export const forTable = <DataType = unknown>(table: Table<DataType>, key: string) => {
  return options.forTable(table, Metadata)[key];
};

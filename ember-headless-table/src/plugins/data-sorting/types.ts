import type { ColumnKey } from '#/interfaces';

export enum SortDirection {
  Ascending = 'ascending',
  Descending = 'descending',
  None = 'none',
}

export interface Sort {
  property: string;
  direction: SortDirection;
}

export enum SortTransform {
  Underscore = 'underscore',
  Camelize = 'camelize',
}
export interface SortsOptions {
  separator: string;
  transform: string | null;
}

export interface SortItem<T> {
  direction: SortDirection;
  property: ColumnKey<T>;
}

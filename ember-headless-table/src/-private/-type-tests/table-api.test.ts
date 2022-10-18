import { expectTypeOf } from 'expect-type';

import { ColumnReordering } from '../../plugins/column-reordering';
import { ColumnResizing } from '../../plugins/column-resizing';
import { DataSorting } from '../../plugins/data-sorting';

import type { Table } from '[public-types]';

// We're testing types, not behaviors
const x = 0 as unknown as Table<{ x: number }>;

//////////////////////////////
// <Table>#pluginOf
expectTypeOf(x.pluginOf(DataSorting)).toEqualTypeOf<DataSorting | undefined>();
expectTypeOf(x.pluginOf(ColumnReordering)).toEqualTypeOf<ColumnReordering | undefined>();
expectTypeOf(x.pluginOf(ColumnResizing)).toEqualTypeOf<ColumnResizing | undefined>();

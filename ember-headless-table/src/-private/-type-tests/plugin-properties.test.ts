import { expectTypeOf } from 'expect-type';

import type { Table } from '[public-types]';
import { BasePlugin } from '../../plugins';

class TableMeta {
  a = 'a';
}
class ColumnMeta {
  b = 'b';
}
class RowMeta {
  c = 'c';
}
class A extends BasePlugin<{ Meta: { Table: TableMeta; Column: ColumnMeta; Row: RowMeta } }> {
  name = 'a plugin';
}

let x = 0 as unknown as Table;
let a = new A(x);

///////////////////////////////////////////////////
// Meta instantiation
///////////////////////////////////////////////////
if (a.meta?.table) {
  expectTypeOf(new a.meta.table()).toEqualTypeOf<TableMeta>();
}

if (a.meta?.column) {
  expectTypeOf(new a.meta.column()).toEqualTypeOf<ColumnMeta>();
}

if (a.meta?.row) {
  expectTypeOf(new a.meta.row()).toEqualTypeOf<RowMeta>();
}

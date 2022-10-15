import { expectTypeOf } from 'expect-type';

import type {
  ColumnMetaFor,
  ColumnOptionsFor,
  EmptyObject,
  OptionsFor,
  PluginSignature,
  RowMetaFor,
  TableMetaFor,
} from '#interfaces/plugins';

class ATableMeta {
  a = 1;
}
class AColumnMeta {
  ac = 1;
}
class ARowMeta {
  ar = 1;
}
class AOptions {
  ao = 1;
}
class AColumnOptions {
  aco = 1;
}

interface FullExtendedSignature extends PluginSignature {
  Meta: {
    Table: ATableMeta;
    Column: AColumnMeta;
    Row: ARowMeta;
  };
  Options: {
    Plugin: AOptions;
    Column: AColumnOptions;
  };
}

expectTypeOf<ColumnOptionsFor<FullExtendedSignature>>().toEqualTypeOf<AColumnOptions>();
expectTypeOf<OptionsFor<FullExtendedSignature>>().toEqualTypeOf<AOptions>();
expectTypeOf<TableMetaFor<FullExtendedSignature>>().toEqualTypeOf<ATableMeta>();
expectTypeOf<ColumnMetaFor<FullExtendedSignature>>().toEqualTypeOf<AColumnMeta>();
expectTypeOf<RowMetaFor<FullExtendedSignature>>().toEqualTypeOf<ARowMeta>();

interface FullFreeformSignature {
  Meta: {
    Table: ATableMeta;
    Column: AColumnMeta;
    Row: ARowMeta;
  };
  Options: {
    Plugin: AOptions;
    Column: AColumnOptions;
  };
}

expectTypeOf<ColumnOptionsFor<FullFreeformSignature>>().toEqualTypeOf<AColumnOptions>();
expectTypeOf<OptionsFor<FullFreeformSignature>>().toEqualTypeOf<AOptions>();
expectTypeOf<TableMetaFor<FullFreeformSignature>>().toEqualTypeOf<ATableMeta>();
expectTypeOf<ColumnMetaFor<FullFreeformSignature>>().toEqualTypeOf<AColumnMeta>();
expectTypeOf<RowMetaFor<FullFreeformSignature>>().toEqualTypeOf<ARowMeta>();

interface WithoutOptions {
  Meta: {
    Table: ATableMeta;
    Column: AColumnMeta;
    Row: ARowMeta;
  };
}

expectTypeOf<ColumnOptionsFor<WithoutOptions>>().toEqualTypeOf<EmptyObject>();
expectTypeOf<OptionsFor<WithoutOptions>>().toEqualTypeOf<EmptyObject>();
expectTypeOf<TableMetaFor<WithoutOptions>>().toEqualTypeOf<ATableMeta>();
expectTypeOf<ColumnMetaFor<WithoutOptions>>().toEqualTypeOf<AColumnMeta>();
expectTypeOf<RowMetaFor<WithoutOptions>>().toEqualTypeOf<ARowMeta>();

interface WithoutMeta {
  Options: {
    Plugin: AOptions;
    Column: AColumnOptions;
  };
}

expectTypeOf<ColumnOptionsFor<WithoutMeta>>().toEqualTypeOf<AColumnOptions>();
expectTypeOf<OptionsFor<WithoutMeta>>().toEqualTypeOf<AOptions>();
expectTypeOf<TableMetaFor<WithoutMeta>>().toEqualTypeOf<never>();
expectTypeOf<ColumnMetaFor<WithoutMeta>>().toEqualTypeOf<never>();
expectTypeOf<RowMetaFor<WithoutMeta>>().toEqualTypeOf<never>();

expectTypeOf<
  ColumnOptionsFor<{ Options: { Column: AColumnOptions } }>
>().toEqualTypeOf<AColumnOptions>();
expectTypeOf<ColumnOptionsFor<{ Options: { Plugin: AOptions } }>>().toEqualTypeOf<EmptyObject>();

expectTypeOf<OptionsFor<{ Options: { Plugin: AOptions } }>>().toEqualTypeOf<AOptions>();
expectTypeOf<OptionsFor<{ Options: { Column: AColumnOptions } }>>().toEqualTypeOf<EmptyObject>();

expectTypeOf<
  TableMetaFor<{
    Meta: {
      Table: ATableMeta;
    };
  }>
>().toEqualTypeOf<ATableMeta>();
expectTypeOf<TableMetaFor<{ Meta: { Column: AColumnMeta } }>>().toEqualTypeOf<never>();
expectTypeOf<TableMetaFor<{ Meta: { Row: ARowMeta } }>>().toEqualTypeOf<never>();

expectTypeOf<
  ColumnMetaFor<{
    Meta: {
      Table: ATableMeta;
    };
  }>
>().toEqualTypeOf<never>();
expectTypeOf<ColumnMetaFor<{ Meta: { Column: AColumnMeta } }>>().toEqualTypeOf<AColumnMeta>();
expectTypeOf<ColumnMetaFor<{ Meta: { Row: ARowMeta } }>>().toEqualTypeOf<never>();

expectTypeOf<
  RowMetaFor<{
    Meta: {
      Table: ATableMeta;
    };
  }>
>().toEqualTypeOf<never>();
expectTypeOf<RowMetaFor<{ Meta: { Column: AColumnMeta } }>>().toEqualTypeOf<never>();
expectTypeOf<RowMetaFor<{ Meta: { Row: ARowMeta } }>>().toEqualTypeOf<ARowMeta>();

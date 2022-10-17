import { expectTypeOf } from 'expect-type';

import { BasePlugin } from '../../plugins/-private/base';
import { ColumnReordering } from '../../plugins/column-reordering';
import { Plugins } from '../../plugins/-private/utils';
import { DataSorting, SortItem } from '../../plugins/data-sorting';
import { ColumnResizing } from '../../plugins/column-resizing';
import { ColumnVisibility } from '../../plugins/column-visibility';
import { StickyColumns } from '../../plugins/sticky-columns';

import type { Plugin } from '[public-plugin-types]';
import type { TableConfig } from '[public-types]';
import type { Constructor } from '#private-types';

type TablePluginConfig = NonNullable<TableConfig<unknown>['plugins']>;

/////////////////////////////////////////////
// Sanity checks
expectTypeOf<Plugins>().toMatchTypeOf<TablePluginConfig>();
expectTypeOf<Constructor<Plugin>[]>().toMatchTypeOf<TablePluginConfig>();
expectTypeOf<[Constructor<Plugin>]>().toMatchTypeOf<TablePluginConfig>();
expectTypeOf<[Constructor<Plugin>, Constructor<Plugin>]>().toMatchTypeOf<TablePluginConfig>();
expectTypeOf<Constructor<BasePlugin>[]>().toMatchTypeOf<TablePluginConfig>();
expectTypeOf<[Constructor<BasePlugin>]>().toMatchTypeOf<TablePluginConfig>();
expectTypeOf<
  [Constructor<BasePlugin>, Constructor<BasePlugin>]
>().toMatchTypeOf<TablePluginConfig>();

class SomeClass { foo = 'bar' }
class LocalPlugin extends BasePlugin<{ Meta: { Table: SomeClass} }> {
  name = 'local-plugin';
}

expectTypeOf([LocalPlugin]).toMatchTypeOf<TablePluginConfig>();

/////////////////////////////////////////////
// Making sure all plugins are subclassed appropriately
expectTypeOf(LocalPlugin).toMatchTypeOf<Constructor<BasePlugin<any>>>();
expectTypeOf(ColumnReordering).toMatchTypeOf<Constructor<BasePlugin<any>>>();
expectTypeOf(LocalPlugin).toMatchTypeOf<Constructor<Plugin<any>>>();
expectTypeOf(ColumnReordering).toMatchTypeOf<Constructor<Plugin<any>>>();

// Actual plugins match the actual table config
expectTypeOf([DataSorting]).toMatchTypeOf<TablePluginConfig>();
expectTypeOf([ColumnReordering]).toMatchTypeOf<TablePluginConfig>();
expectTypeOf([ColumnResizing]).toMatchTypeOf<TablePluginConfig>();
expectTypeOf([ColumnVisibility]).toMatchTypeOf<TablePluginConfig>();
expectTypeOf([StickyColumns]).toMatchTypeOf<TablePluginConfig>();

/////////////////////////////////////////////
// The various ways to define plugins
expectTypeOf([DataSorting, ColumnReordering]).toMatchTypeOf<TablePluginConfig>();

const onSort = (_sorts: SortItem<number>[]) => {};
const sorts: SortItem<number>[] = [];
expectTypeOf([DataSorting.with(() => ({ }))]).toMatchTypeOf<TablePluginConfig>();
expectTypeOf([DataSorting.with(() => ({ onSort, sorts }))]).toMatchTypeOf<TablePluginConfig>();


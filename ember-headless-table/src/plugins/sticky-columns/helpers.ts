import { meta } from '../-private/base';
import { StickyColumns } from './plugin';

import type { Column } from '[public-types]';

export const isSticky = <DataType = unknown>(column: Column<DataType>) =>
  meta.forColumn(column, StickyColumns).isSticky;

export const styleFor = <DataType = unknown>(
  column: Column<DataType>
): Partial<CSSStyleDeclaration> => meta.forColumn(column, StickyColumns).style;

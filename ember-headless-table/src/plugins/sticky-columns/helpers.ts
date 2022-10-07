import { meta } from '../-private/base';
import { StickyColumns } from './plugin';

import type { Column } from '[public-types]';

export const isSticky = (column: Column) => meta.forColumn(column, StickyColumns).isSticky;

export const styleFor = (column: Column): Partial<CSSStyleDeclaration> =>
  meta.forColumn(column, StickyColumns).style;

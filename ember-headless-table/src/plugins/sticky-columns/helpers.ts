import { htmlSafe } from '@ember/template';

import { meta } from '../-private/base';
import { StickyColumns } from './plugin';

import type { Column } from '[public-types]';

export const isSticky = <DataType = unknown>(column: Column<DataType>) =>
  meta.forColumn(column, StickyColumns).isSticky;

export const styleFor = <DataType = unknown>(
  column: Column<DataType>
): Partial<CSSStyleDeclaration> => meta.forColumn(column, StickyColumns).style;

/**
 * In this plugin, buth header and cells have the same styles,
 * if applicable.
 *
 * Until this RFC https://github.com/emberjs/rfcs/pull/883
 * is merged and implemented, we can't performantly
 * use modifiers for apply styles.
 *
 * In the mean time, we'll need to append style strings, which is more work
 * for consumers, but is a reasonable trade-off for now.
 */
export const styleStringFor = <DataType = unknown>(
  column: Column<DataType>
): ReturnType<typeof htmlSafe> => {
  let columnMeta = meta.forColumn(column, StickyColumns);

  let result = '';

  if (columnMeta.isSticky) {
    for (let [key, value] of Object.entries(columnMeta.style)) {
      result += `${toStyle(key)}:${value};`;
    }

    result = ';' + result;
  }

  return htmlSafe(result);
};

/**
 * the JS API for styles is camel case,
 * but CSS is kebab-case. To save on complexity and
 * amount of code, we have a super small conversion function
 * for only the properties relevant to the sticky plugin.
 */
const toStyle = (key: string): string => {
  switch (key) {
    case 'zIndex':
      return 'z-index';
    default:
      return key;
  }
};

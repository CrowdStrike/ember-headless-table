import { meta } from '../-private/base';
import { ColumnReordering } from './plugin';

import type { Column } from '[public-types]';

type ColumnOrder = { key: string; position: number | undefined }[];

export function reorderColumns(columns: Column[], orderedColumns: ColumnOrder | undefined) {
  if (orderedColumns === undefined) {
    return columns;
  }

  let repositionedColumns: Column[] = Array.from({
    length: columns.length,
  });

  for (const column of columns) {
    const orderedColumn = orderedColumns.find((orderedColumn) => column.key === orderedColumn.key);
    const currentMeta = meta.forColumn(column, ColumnReordering);

    if (orderedColumn === undefined) {
      if (currentMeta.position !== undefined && currentMeta.position >= 0) {
        repositionedColumns[currentMeta.position] = column;
      }

      continue;
    }

    const { position } = orderedColumn;

    if (position !== undefined && !repositionedColumns[position]) {
      repositionedColumns[position] = column;
    } else {
      repositionedColumns.push(column);
    }
  }

  repositionedColumns = repositionedColumns.filter((column) => column !== undefined);

  return repositionedColumns;
}

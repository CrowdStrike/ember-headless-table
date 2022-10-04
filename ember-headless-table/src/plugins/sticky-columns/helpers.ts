import type { Column } from "[public-types]";
import { meta } from "../-private/base";
import { StickyColumns } from "./plugin";
import { htmlSafe } from '@ember/template';

export const isSticky = (column: Column) => meta.forColumn(column, StickyColumns).isSticky;

export const styleFor = (column: Column) => htmlSafe(meta.forColumn(column, StickyColumns).style);

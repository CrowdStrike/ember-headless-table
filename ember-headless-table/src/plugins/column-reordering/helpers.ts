import { meta } from '../-private/base';
import { ColumnReordering } from './plugin';

import type { Column } from '[public-types]';

/**
 * Move the column one position to the left.
 * If the column is first, nothing will happen.
 */
export const moveLeft = (column: Column) => meta.forColumn(column, ColumnReordering).moveLeft();

/**
 * Move the column one position to the right.
 * If the column is last, nothing will happen.
 */
export const moveRight = (column: Column) => meta.forColumn(column, ColumnReordering).moveRight();

/**
 * Ask if the column cannot move to the left
 */
export const cannotMoveLeft = (column: Column) =>
  meta.forColumn(column, ColumnReordering).cannotMoveLeft;

/**
 * Ask if the column cannot move to the right
 */
export const cannotMoveRight = (column: Column) =>
  meta.forColumn(column, ColumnReordering).cannotMoveRight;

/**
 * Ask if the column can move to the left
 */
export const canMoveLeft = (column: Column) =>
  meta.forColumn(column, ColumnReordering).cannotMoveLeft;

/**
 * Ask if the column can move to the right
 */
export const canMoveRight = (column: Column) =>
  meta.forColumn(column, ColumnReordering).cannotMoveRight;
